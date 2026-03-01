# Mock adafruit_servokit for development on non-Raspberry Pi hardware.
# Servo angle changes are logged to stdout instead of driving real hardware.


class _MockServo:
    def __init__(self, index):
        self._index = index
        self._angle = 0
        self.actuation_range = 180

    @property
    def angle(self):
        return self._angle

    @angle.setter
    def angle(self, value):
        self._angle = value
        print(f"[MOCK SERVO] servo[{self._index}] → {value}°")


class ServoKit:
    def __init__(self, channels=16, i2c=None, address=0x40):
        self.servo = [_MockServo(i) for i in range(channels)]
        print(f"[MOCK ServoKit] initialised {channels} channels at address {hex(address)}")
