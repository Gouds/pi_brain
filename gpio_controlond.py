import RPi.GPIO as GPIO

# Set up GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(18, GPIO.OUT)
GPIO.setup(23, GPIO.OUT)

def turn_on_pin(pin):
    GPIO.output(pin, GPIO.HIGH)

def turn_off_pin(pin):
    GPIO.output(pin, GPIO.LOW)
