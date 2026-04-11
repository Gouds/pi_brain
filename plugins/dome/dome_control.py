"""
Dome motor control via AQMH3615NS 15A DC motor driver.

Wiring (BOARD pin numbering):
  Pi pin  7 (GPIO4)  → PWM
  Pi pin 11 (GPIO17) → IN1
  Pi pin 12 (GPIO18) → IN2
  Pi GND             → GND

Direction logic:
  IN1=HIGH, IN2=LOW  → forward  (direction A)
  IN1=LOW,  IN2=HIGH → reverse  (direction B)
  IN1=LOW,  IN2=LOW  → stop / coast

PWM duty cycle (0–100) controls speed.
Falls back to mock (console print) when RPi.GPIO is unavailable.
"""

# BCM GPIO numbers (physical BOARD pins 7/11/12 → BCM 4/17/18)
PWM_PIN = 4   # BCM (physical pin 7)
IN1_PIN = 17  # BCM (physical pin 11)
IN2_PIN = 18  # BCM (physical pin 12)
PWM_FREQ = 1000  # Hz

_pwm = None
_gpio = None
_mock = False
_init_done = False  # prevents retrying on every call after a failed init


def _init():
    global _pwm, _gpio, _mock, _init_done
    if _init_done:
        return
    _init_done = True
    try:
        import RPi.GPIO as GPIO
        # BCM mode is already set by app.py — do not call setmode again
        GPIO.setwarnings(False)
        GPIO.setup(PWM_PIN, GPIO.OUT)
        GPIO.setup(IN1_PIN, GPIO.OUT)
        GPIO.setup(IN2_PIN, GPIO.OUT)
        GPIO.output(IN1_PIN, GPIO.LOW)
        GPIO.output(IN2_PIN, GPIO.LOW)
        _pwm = GPIO.PWM(PWM_PIN, PWM_FREQ)
        _pwm.start(0)
        _gpio = GPIO
        _mock = False
        print('[DOME] GPIO initialised (BCM mode)')
    except Exception as e:
        print(f'[DOME] GPIO unavailable, using mock: {e}')
        _mock = True


def dome_spin(speed: int) -> dict:
    """
    Spin the dome motor.
    speed: -100 (full reverse) to 100 (full forward), 0 = stop.
    """
    _init()
    speed = max(-100, min(100, int(speed)))

    if _mock:
        direction = 'right' if speed > 0 else ('left' if speed < 0 else 'stop')
        print(f'[DOME MOCK] spin speed={speed} direction={direction}')
        return {'ok': True, 'mock': True, 'speed': speed}

    duty = abs(speed)
    if speed > 0:
        _gpio.output(IN1_PIN, _gpio.HIGH)
        _gpio.output(IN2_PIN, _gpio.LOW)
    elif speed < 0:
        _gpio.output(IN1_PIN, _gpio.LOW)
        _gpio.output(IN2_PIN, _gpio.HIGH)
    else:
        _gpio.output(IN1_PIN, _gpio.LOW)
        _gpio.output(IN2_PIN, _gpio.LOW)
        duty = 0

    _pwm.ChangeDutyCycle(duty)
    return {'ok': True, 'speed': speed}


def dome_stop() -> dict:
    """Stop the dome motor immediately."""
    return dome_spin(0)


async def dome_list():
    return {"message"}
