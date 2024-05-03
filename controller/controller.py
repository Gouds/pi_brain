import webbrowser
import subprocess
import serial
import requests
import threading

url = '192.168.20.231'  # Replace with your URL

# Open the web browser in kiosk mode
# This command is for Google Chrome on Linux. Modify it according to your browser and operating system
subprocess.Popen(['chromium-browser', '--kiosk', url])

# Alternatively, you can use the webbrowser module to open the URL in your default web browser
# However, this will not open the browser in kiosk mode
# webbrowser.open(url)

def send_command(command):
    response = requests.post(f'http://192.168.20.231:8000/joystick', data={'command': command})
    print(f'Sent command: {command}, received response: {response.text}')

def read_joystick_commands():
    with serial.Serial('/dev/ttyACM0', 9600, timeout=1) as ser:  # Replace '/dev/ttyACM0' with your serial port
        while True:
            command = ser.readline().decode().strip()  # Read a line from the serial port
            if command:
                print(f'Read command: {command}')
                send_command(command)

# Start the joystick command reader in a separate thread
threading.Thread(target=read_joystick_commands, daemon=True).start()