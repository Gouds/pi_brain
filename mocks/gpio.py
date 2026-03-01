# Mock RPi.GPIO for development on non-Raspberry Pi hardware.
# All calls are no-ops; pin state is tracked in memory only.

BCM = 11
BOARD = 10
OUT = 0
IN = 1
HIGH = 1
LOW = 0

_pin_state = {}


def setmode(mode):
    pass


def setup(pin, mode, initial=LOW):
    _pin_state[pin] = initial


def output(pin, value):
    _pin_state[pin] = value
    print(f"[MOCK GPIO] pin {pin} → {'HIGH' if value else 'LOW'}")


def input(pin):
    return _pin_state.get(pin, LOW)


def cleanup():
    _pin_state.clear()


class PWM:
    def __init__(self, pin, frequency):
        self.pin = pin
        self.frequency = frequency
        self._duty_cycle = 0

    def start(self, duty_cycle):
        self._duty_cycle = duty_cycle
        print(f"[MOCK GPIO] PWM pin {self.pin} started at {duty_cycle}% duty cycle")

    def ChangeDutyCycle(self, duty_cycle):
        self._duty_cycle = duty_cycle

    def ChangeFrequency(self, frequency):
        self.frequency = frequency

    def stop(self):
        self._duty_cycle = 0
        print(f"[MOCK GPIO] PWM pin {self.pin} stopped")
