import json

try:
    import board
    import busio
    from adafruit_servokit import ServoKit
except ImportError:
    from mocks import board, busio
    from mocks.servokit import ServoKit
    print("[DEV MODE] Pi hardware not available - using mock servo hardware")

# Initialize I2C bus and ServoKit
try:
    i2c_bus = busio.I2C(board.SCL, board.SDA)
    kit = ServoKit(channels=16, i2c=i2c_bus)
except Exception as e:
    print(f"[SERVO] Default I2C init skipped - {e}")
    i2c_bus = None
    kit = None


class I2CServoControl:
    def __init__(self, address, scl_pin, sda_pin):
        self.address = address
        self.i2c = busio.I2C(scl_pin, sda_pin)
        self.kit = ServoKit(channels=16, i2c=self.i2c)

    def move_servo(self, servo_id, position):
        # Move the specified servo to the specified position
        self.kit.servo[servo_id].angle = position

# Read servo configurations from config file
with open("configs/servo_config.json", "r") as config_file:
    servo_config = json.load(config_file)

# Initialize I2C servo controls for each bus specified in the config
i2c_servo_controls = {}
for bus_config in servo_config["i2c_buses"]:
    bus_name = bus_config["name"]
    bus_address = bus_config["address"]
    try:
        scl_pin = getattr(board, bus_config["scl_pin"])
        sda_pin = getattr(board, bus_config["sda_pin"])
        i2c_servo_controls[bus_name] = I2CServoControl(address=bus_address, scl_pin=scl_pin, sda_pin=sda_pin)
        print(f"[SERVO] Initialised bus '{bus_name}' at {bus_address}")
    except Exception as e:
        print(f"[SERVO] Skipping bus '{bus_name}' at {bus_address} - {e}")


def reinit_bus(bus_config, old_name=None):
    """Dynamically initialise or re-initialise an I2C bus connection.
    Call this after adding or updating a bus via the admin API.
    Pass old_name if the bus was renamed so the old entry is removed."""
    if old_name and old_name in i2c_servo_controls and old_name != bus_config["name"]:
        del i2c_servo_controls[old_name]
        print(f"[SERVO] Removed old bus '{old_name}'")
    bus_name = bus_config["name"]
    try:
        scl_pin = getattr(board, bus_config["scl_pin"])
        sda_pin = getattr(board, bus_config["sda_pin"])
        i2c_servo_controls[bus_name] = I2CServoControl(
            address=bus_config["address"], scl_pin=scl_pin, sda_pin=sda_pin
        )
        print(f"[SERVO] Initialised bus '{bus_name}' at {bus_config['address']}")
        return True
    except Exception as e:
        print(f"[SERVO] Failed to initialise bus '{bus_name}': {e}")
        return False


def remove_bus(bus_name):
    """Remove a bus from active servo controls. Call after deleting a bus via admin API."""
    if bus_name in i2c_servo_controls:
        del i2c_servo_controls[bus_name]
        print(f"[SERVO] Removed bus '{bus_name}'")