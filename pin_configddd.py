class PinConfig:
    def __init__(self):
        self.pin_mapping = {}

    def get_pin_mapping(self):
        return self.pin_mapping

    def update_pin_mapping(self, pin, mode):
        self.pin_mapping[pin] = mode
