"""
Pi Brain Controller
-------------------
Runs the frontend in kiosk mode and bridges the Arduino joystick controller
to the backend over HTTP.

Usage:
  python controller.py [--url http://localhost:8000] [--port /dev/ttyUSB0] [--baud 9600]

Environment (read from .env if present):
  VITE_API_URL  — backend base URL (same file used by the frontend)
"""

import argparse
import os
import subprocess
import threading
import time
import requests
import serial

# ── Config ────────────────────────────────────────────────────────────────────

def _load_env_url():
    """Read VITE_API_URL from .env file next to this script or in parent dir."""
    for search in (os.path.dirname(__file__), os.path.join(os.path.dirname(__file__), '..')):
        env_path = os.path.join(search, '.env')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('VITE_API_URL='):
                        return line.split('=', 1)[1].strip().rstrip('/')
    return None

parser = argparse.ArgumentParser(description='Pi Brain Controller')
parser.add_argument('--url',  default=None, help='Backend base URL, e.g. http://192.168.1.100:8000')
parser.add_argument('--port', default='/dev/ttyUSB0', help='Arduino serial port')
parser.add_argument('--baud', default=9600, type=int, help='Serial baud rate')
args = parser.parse_args()

BACKEND_URL = (args.url or _load_env_url() or 'http://localhost:8000').rstrip('/')
SERIAL_PORT = args.port
BAUD_RATE   = args.baud
POLL_MS     = 50   # How often to process serial data (milliseconds)

print(f'[controller] Backend: {BACKEND_URL}')
print(f'[controller] Serial:  {SERIAL_PORT} @ {BAUD_RATE} baud')

# ── Kiosk ─────────────────────────────────────────────────────────────────────

def wait_for_backend(timeout=60):
    """Block until the backend health endpoint responds."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(f'{BACKEND_URL}/health', timeout=2)
            if r.status_code == 200:
                print('[controller] Backend is up')
                return True
        except Exception:
            pass
        time.sleep(1)
    print('[controller] WARNING: backend did not respond in time, launching kiosk anyway')
    return False

def launch_kiosk():
    """Open Chromium in kiosk mode pointing at the backend-served frontend."""
    frontend_url = BACKEND_URL.replace(':8000', '')  # served on same host, port 80 or direct
    # The frontend is served by FastAPI at / — use the same host, port 8000
    kiosk_url = f'{BACKEND_URL}/'
    cmd = [
        'chromium-browser',
        '--kiosk',
        '--noerrdialogs',
        '--disable-infobars',
        '--disable-session-crashed-bubble',
        kiosk_url,
    ]
    print(f'[controller] Launching kiosk: {" ".join(cmd)}')
    subprocess.Popen(cmd)

# ── Serial bridge ─────────────────────────────────────────────────────────────

def send_command(raw_line: str):
    """
    Translate a serial line from the Arduino and POST it to the backend.
    Expected format: "LX LY RX RY BTN ESTOP"  (space-separated, 6 integers)
    The backend endpoint expects: POST /joystick/LX-LY-RX-RY-BTN-ESTOP
    """
    command = raw_line.replace(' ', '-')
    try:
        requests.post(f'{BACKEND_URL}/joystick/{command}', timeout=0.1)
    except Exception as e:
        print(f'[controller] Send error: {e}')

def read_joystick_loop():
    """Continuously read from the Arduino serial port and forward commands."""
    while True:
        try:
            print(f'[controller] Opening serial port {SERIAL_PORT}…')
            with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as ser:
                print('[controller] Serial port open')
                while True:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        send_command(line)
        except serial.SerialException as e:
            print(f'[controller] Serial error: {e} — retrying in 3s')
            time.sleep(3)
        except Exception as e:
            print(f'[controller] Unexpected error: {e} — retrying in 3s')
            time.sleep(3)

# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    wait_for_backend()
    launch_kiosk()

    t = threading.Thread(target=read_joystick_loop, daemon=True)
    t.start()
    print('[controller] Running — Ctrl+C to stop')

    try:
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print('[controller] Stopped')
