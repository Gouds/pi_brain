from adafruit_servokit import ServoKit
import time

# Initialize ServoKit with the correct address if needed
kit = ServoKit(channels=16)

# Function to move a servo to a specific angle
def move_servo(servo_id, angle):
    kit.servo[servo_id].angle = angle
    time.sleep(1)  # Wait for the servo to reach the position

# Test moving each servo to different angles
for servo_id in range(16):
    move_servo(servo_id, 0)  # Move to 0 degrees
    move_servo(servo_id, 90)  # Move to 90 degrees
    move_servo(servo_id, 180)  # Move to 180 degrees

# Move all servos back to the center position
for servo_id in range(16):
    move_servo(servo_id, 90)

print("Servo test complete")