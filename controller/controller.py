import subprocess
import serial
import requests
import threading
import time  # Add this import

url = '192.168.20.231'  # Replace with your URL

print('Starting script...')

# Open the web browser in kiosk mode
# This command is for Google Chrome on Linux. Modify it according to your browser and operating system
#subprocess.Popen(['chromium-browser', '--kiosk', url])

print('Opened web browser in kiosk mode')

def send_command(command):
    try:
        command_with_hyphens = command.replace(' ', '-')
        print(f'Sending command: {command_with_hyphens}')
        request_url = f'http://{url}:8000/joystick/{command_with_hyphens}'
        print(f'HTTP request: POST {request_url}')
        response = requests.post(request_url)
        print(f'Sent command: {command_with_hyphens}, received response: {response.text}')
    except Exception as e:
        print(f'Error sending command: {e}')

def read_joystick_commands():
    try:
        print('Opening serial port...')
        with serial.Serial('/dev/ttyUSB0', 9600, timeout=1) as ser:  # Replace '/dev/ttyACM0' with your serial port
            print('Serial port opened')
            while True:
                print('Reading from serial port...')
                command = ser.readline().decode().strip()  # Read a line from the serial port
                print(f'Read from serial port: {command}')
                if command:
                    send_command(command)
                    time.sleep(1)  # Add a delay here

    except Exception as e:
        print(f'Error reading joystick commands: {e}')

# Start the joystick command reader in a separate thread
print('Starting joystick command reader...')
threading.Thread(target=read_joystick_commands, daemon=True).start()
print('Joystick command reader started')

# Keep the main thread alive
while True:
    time.sleep(10)