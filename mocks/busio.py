# Mock busio module for development on non-Raspberry Pi hardware.


class I2C:
    def __init__(self, scl, sda):
        self.scl = scl
        self.sda = sda
        print(f"[MOCK I2C] bus initialised on SCL={scl} SDA={sda}")

    def unlock(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass
