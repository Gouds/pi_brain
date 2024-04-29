import webbrowser
import subprocess

url = '192.168.20.231'  # Replace with your URL

# Open the web browser in kiosk mode
# This command is for Google Chrome on Linux. Modify it according to your browser and operating system
subprocess.Popen(['chromium-browser', '--kiosk', url])

# Alternatively, you can use the webbrowser module to open the URL in your default web browser
# However, this will not open the browser in kiosk mode
# webbrowser.open(url)