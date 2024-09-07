# Import required modules
import time
import RPi.GPIO as GPIO

# Declare the GPIO settings
GPIO.setmode(GPIO.BCM)  # Changed to GPIO.BCM

# set up GPIO pins
GPIO.setup(4, GPIO.OUT)  # Changed to GPIO4
GPIO.setup(17, GPIO.OUT)  # Changed to GPIO17
GPIO.setup(18, GPIO.OUT)  # Changed to GPIO18
GPIO.setup(27, GPIO.OUT)  # Changed to GPIO27

# Set the PWM pin and frequency
pwm = GPIO.PWM(4, 100)  # Changed to GPIO4

# Start PWM with 0% duty cycle (off)
pwm.start(0)

# Drive the motor clockwise
GPIO.output(18, GPIO.HIGH)  # Changed to GPIO18
GPIO.output(17, GPIO.LOW)  # Changed to GPIO17

# Disable STBY (standby)
GPIO.output(27, GPIO.HIGH)  # Changed to GPIO27

# Ramp up the speed over 5 seconds
for duty_cycle in range(0, 101, 5):  # 0 to 100 in steps of 5
    pwm.ChangeDutyCycle(duty_cycle)
    time.sleep(0.1)  # sleep 0.1 seconds

# Wait 5 seconds at full speed
time.sleep(5)

# Ramp down the speed over 5 seconds
for duty_cycle in range(100, -1, -5):  # 100 to 0 in steps of -5
    pwm.ChangeDutyCycle(duty_cycle)
    time.sleep(0.1)  # sleep 0.1 seconds

# Drive the motor counter-clockwise
GPIO.output(18, GPIO.LOW)  # Changed to GPIO18
GPIO.output(17, GPIO.HIGH)  # Changed to GPIO17

# Ramp up the speed over 5 seconds
for duty_cycle in range(0, 101, 5):  # 0 to 100 in steps of 5
    pwm.ChangeDutyCycle(duty_cycle)
    time.sleep(0.1)  # sleep 0.1 seconds

# Wait 5 seconds at full speed
time.sleep(5)

# Ramp down the speed over 5 seconds
for duty_cycle in range(100, -1, -5):  # 100 to 0 in steps of -5
    pwm.ChangeDutyCycle(duty_cycle)
    time.sleep(0.1)  # sleep 0.1 seconds

# Reset by setting all pins low
GPIO.output(4, GPIO.LOW)  # Changed to GPIO4
GPIO.output(17, GPIO.LOW)  # Changed to GPIO17
GPIO.output(18, GPIO.LOW)  # Changed to GPIO18
GPIO.output(27, GPIO.LOW)  # Changed to GPIO27