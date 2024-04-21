import board
import busio
from adafruit_servokit import ServoKit
import json

# Initialize I2C bus and ServoKit
i2c_bus = busio.I2C(board.SCL, board.SDA)
kit = ServoKit(channels=16, i2c=i2c_bus)


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
    scl_pin = getattr(board, bus_config["scl_pin"])
    sda_pin = getattr(board, bus_config["sda_pin"])
    i2c_servo_controls[bus_name] = I2CServoControl(address=bus_address, scl_pin=scl_pin, sda_pin=sda_pin)