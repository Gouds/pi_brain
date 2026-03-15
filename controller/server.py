"""
Pi Brain Controller — Mini Backend
-----------------------------------
Lightweight FastAPI service that runs on the controller Pi.
Handles Arduino flash (compile + upload) and exposes health check.
The serial bridge (controller.py) runs separately alongside this.

Run from the project root:
  uvicorn controller.server:app --host 0.0.0.0 --port 8001

Or use start.sh which launches both this and controller.py.
"""

import asyncio
import json
import os
import shutil
import serial

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI(title="Pi Brain Controller", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths are relative to the project root (where uvicorn is started from)
ARDUINO_CONFIG_PATH   = os.path.join("configs", "arduino_config.json")
ARDUINO_TEMPLATE_PATH = os.path.join("arduino", "arduino.ino.template")
ARDUINO_SKETCH_PATH   = os.path.join("arduino", "arduino.ino")

# controller.py watches FLASH_LOCK and creates FLASH_READY once port is closed
FLASH_LOCK  = "/tmp/pi_brain_flash.lock"
FLASH_READY = "/tmp/pi_brain_flash_ready.lock"

DEFAULT_CONFIG = {
    "port": "/dev/ttyUSB0",
    "baud": 9600,
    "fqbn": "arduino:avr:nano:cpu=atmega328old",
    "pins": {
        "left_x": "A0", "left_y": "A1", "left_twist": "A2",
        "right_x": "A3", "right_y": "A4", "right_twist": "A5",
        "btn1": "2", "btn2": "3", "btn3": "4", "estop": "5",
    },
    "deadzone": 30,
    "change_threshold": 8,
    "keepalive_ms": 500,
    "sample_ms": 50,
}


def _load_config():
    if not os.path.exists(ARDUINO_CONFIG_PATH):
        return DEFAULT_CONFIG.copy()
    with open(ARDUINO_CONFIG_PATH) as f:
        return json.load(f)


def _save_config(config):
    os.makedirs("configs", exist_ok=True)
    with open(ARDUINO_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=4)


def _generate_sketch(config):
    if not os.path.exists(ARDUINO_TEMPLATE_PATH):
        return False
    with open(ARDUINO_TEMPLATE_PATH) as f:
        src = f.read()
    pins = config.get("pins", {})
    replacements = {
        "{{PIN_LX}}":           pins.get("left_x",      "A0"),
        "{{PIN_LY}}":           pins.get("left_y",      "A1"),
        "{{PIN_LT}}":           pins.get("left_twist",  "A2"),
        "{{PIN_RX}}":           pins.get("right_x",     "A3"),
        "{{PIN_RY}}":           pins.get("right_y",     "A4"),
        "{{PIN_RT}}":           pins.get("right_twist", "A5"),
        "{{PIN_BTN1}}":         pins.get("btn1",        "2"),
        "{{PIN_BTN2}}":         pins.get("btn2",        "3"),
        "{{PIN_BTN3}}":         pins.get("btn3",        "4"),
        "{{PIN_ESTOP}}":        pins.get("estop",       "5"),
        "{{DEADZONE}}":         str(config.get("deadzone",         30)),
        "{{CHANGE_THRESHOLD}}": str(config.get("change_threshold",  8)),
        "{{KEEPALIVE_MS}}":     str(config.get("keepalive_ms",    500)),
        "{{SAMPLE_MS}}":        str(config.get("sample_ms",        50)),
        "{{BAUD}}":             str(config.get("baud",           9600)),
    }
    for placeholder, value in replacements.items():
        src = src.replace(placeholder, value)
    with open(ARDUINO_SKETCH_PATH, "w") as f:
        f.write(src)
    return True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "controller"}


@app.get("/admin/arduino/config")
async def get_config():
    return _load_config()


@app.put("/admin/arduino/config")
async def save_config(config: dict):
    _save_config(config)
    _generate_sketch(config)
    return config


@app.get("/admin/arduino/flash")
async def flash():
    """Compile and upload the Arduino sketch via arduino-cli. Streams SSE output."""
    config = _load_config()
    _generate_sketch(config)

    port       = config.get("port", "/dev/ttyUSB0")
    fqbn       = config.get("fqbn", "arduino:avr:nano:cpu=atmega328old")
    sketch_dir = os.path.abspath("arduino")

    if not shutil.which("arduino-cli"):
        async def err():
            yield "data: ERROR: arduino-cli not found.\n\n"
            yield "data: Install: curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh\n\n"
            yield "data: Then: arduino-cli core install arduino:avr\n\n"
            yield "event: done\ndata: error\n\n"
        return StreamingResponse(err(), media_type="text/event-stream")

    cmd = [
        "arduino-cli", "compile",
        "--fqbn", fqbn,
        "--upload",
        "--port", port,
        sketch_dir,
    ]

    async def stream():
        # Clean up any stale ready flag from a previous run
        try:
            os.remove(FLASH_READY)
        except FileNotFoundError:
            pass

        # Signal controller.py to close the serial port
        open(FLASH_LOCK, 'w').close()
        yield "data: Waiting for serial port to be released…\n\n"

        # Wait for controller.py to confirm it has closed the port (up to 15s)
        deadline = asyncio.get_event_loop().time() + 15
        while asyncio.get_event_loop().time() < deadline:
            if os.path.exists(FLASH_READY):
                yield "data: Serial port released — waiting for port to settle…\n\n"
                await asyncio.sleep(2)
                yield "data: Starting flash\n\n"
                break
            await asyncio.sleep(0.3)
        else:
            yield "data: WARNING: controller did not confirm port release — attempting flash anyway\n\n"

        yield f"data: Running: {' '.join(cmd)}\n\n"
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            async for line in proc.stdout:
                text = line.decode("utf-8", errors="ignore").rstrip()
                yield f"data: {text}\n\n"
            await proc.wait()
            if proc.returncode == 0:
                yield "event: done\ndata: success\n\n"
            else:
                yield f"event: done\ndata: error (exit {proc.returncode})\n\n"
        finally:
            # Remove both lock files so controller.py can reopen the port
            for f in (FLASH_LOCK, FLASH_READY):
                try:
                    os.remove(f)
                except FileNotFoundError:
                    pass

    return StreamingResponse(stream(), media_type="text/event-stream")
