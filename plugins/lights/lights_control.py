"""
AstroPixels lights control plugin.

Communicates with an AstroPixels ESP32 board over I2C at address 0x0A.
Commands are the same ASCII strings as serial — sent as raw bytes in a
single I2C transaction using smbus2.write_bytes().

Falls back to mock (console print) when smbus2 or the I2C bus is unavailable.

Wiring:
  Pi GPIO 2 (SDA) → AstroPixels I2C header Data
  Pi GPIO 3 (SCL) → AstroPixels I2C header Clock
  Pi GND          → AstroPixels I2C header GND
  (no power line — AstroPixels powered separately)
  (can share the same I2C bus as the dome PCA9685 at 0x42 — no conflict)
"""

import os
import json

LIGHTS_CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'configs', 'lights_config.json')

DEFAULT_CONFIG = {
    'i2c_bus': 1,
    'i2c_address': 0x0A,
    'enabled': True,
}

_config: dict = {}
_bus = None


def load_config() -> dict:
    global _config
    if os.path.exists(LIGHTS_CONFIG_PATH):
        with open(LIGHTS_CONFIG_PATH) as f:
            _config = {**DEFAULT_CONFIG, **json.load(f)}
    else:
        _config = DEFAULT_CONFIG.copy()
    return _config


def save_config(config: dict):
    global _config
    os.makedirs(os.path.dirname(LIGHTS_CONFIG_PATH), exist_ok=True)
    with open(LIGHTS_CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)
    _config = config
    global _bus
    _bus = None  # re-open on next send in case bus number changed


def _get_bus():
    global _bus, _config
    if not _config:
        load_config()
    if not _config.get('enabled', True):
        return None
    try:
        import smbus2
        if _bus is None:
            _bus = smbus2.SMBus(_config.get('i2c_bus', 1))
        return _bus
    except Exception as e:
        print(f'[LIGHTS] I2C unavailable (bus {_config.get("i2c_bus", 1)}): {e}')
        return None


def send_command(cmd: str) -> dict:
    """Send a raw ASCII command string to the AstroPixels board over I2C."""
    bus = _get_bus()
    if bus is None:
        print(f'[LIGHTS MOCK] {cmd}')
        return {'ok': True, 'mock': True, 'command': cmd}
    try:
        address = _config.get('i2c_address', 0x0A)
        data = cmd.encode('ascii')
        # write_i2c_block_data(addr, register, data) — first byte acts as the
        # register/command byte; remaining bytes are the data payload.
        # The AstroPixels I2CReceiver reads all bytes in the transaction the
        # same way, so this sends the full ASCII command in one transaction.
        bus.write_i2c_block_data(address, data[0], list(data[1:]))
        return {'ok': True, 'command': cmd}
    except Exception as e:
        print(f'[LIGHTS] I2C send error: {e}')
        global _bus
        _bus = None  # reset so next call retries
        return {'ok': False, 'error': str(e), 'command': cmd}


def build_logic_command(target: str, effect: int, colour: int, speed: int, duration: int) -> str:
    """
    Build a Logic Engine (LE) command.

    Format: LE<target><effect(2)><colour(1)><speed(1)><time(2)>

    Targets: 0=all, 1=front logic, 3=rear logic, 4=front PSI, 5=rear PSI
    Effects: 0=normal, 1=alarm, 2=failure, 3=leia, 4=march, 5=single colour,
             6=flashing, 7=flip flop, 8=flip flop alt, 9=colour swap, 10=rainbow,
             14=lights out, 19=roaming pixel, 20=h-scanline, 21=v-scanline,
             22=fire, 24=pulse, 99=random
    Colours: 0=default, 1=red, 2=orange, 3=yellow, 4=green, 5=cyan,
             6=blue, 7=purple, 8=magenta, 9=pink
    Speed:   0 (fastest) – 9 (slowest)
    Duration: seconds, 0 = continuous
    """
    effect_str = str(int(effect)).zfill(2)
    time_str   = str(min(int(duration), 99)).zfill(2)
    return f"LE{target}{effect_str}{int(colour)}{int(speed)}{time_str}"


def build_holo_command(target: str, sequence: int, colour: int, duration: int) -> str:
    """
    Build a HoloProjector (HP) LED command.

    Format: HP<target>0<seq(2)><colour>[|<duration(2)>]

    Targets: A=all, F=front, R=rear, T=top, X=front+rear, Y=front+top, Z=rear+top
    Sequences: 1=leia, 2=flicker, 3=pulse, 4=cycle, 5=colour, 6=rainbow, 7=short circuit
    Colours: 0=random, 1=red, 2=yellow, 3=green, 4=cyan, 5=blue, 6=magenta, 7=orange, 8=purple, 9=white
    Duration: seconds, 0 = continuous (no suffix added)
    """
    seq_str = str(int(sequence)).zfill(2)
    cmd = f"HP{target}0{seq_str}{int(colour)}"
    if int(duration) > 0:
        cmd += f"|{str(min(int(duration), 99)).zfill(2)}"
    return cmd
