from fastapi import FastAPI, HTTPException, File, UploadFile, Query, BackgroundTasks
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import mimetypes
from pydantic import BaseModel
#from gpio_control import turn_on_pin, turn_off_pin
#from pin_config import PinConfig
from typing import List, Dict
import os
from utils import mainconfig
from plugins.audio.audio_control import audio_list, audio_play, audio_random_list, audio_random_play, get_volume, set_volume
from plugins.dome.dome_control import dome_list
from plugins.body.body_control import body_list
from plugins.servo.servo_control import i2c_servo_controls, reinit_bus, remove_bus
from plugins.script.script_control import script_list, script_start_handler, running_scripts, stop_script, stop_all_scripts
#import board
#import busio
#from adafruit_servokit import ServoKit
import json
import asyncio
try:
    import RPi.GPIO as GPIO
except ImportError:
    from mocks import gpio as GPIO
    print("[DEV MODE] RPi.GPIO not available - using mock GPIO")
import subprocess
import shutil




logtofile = mainconfig.mainconfig['logtofile']
logdir = mainconfig.mainconfig['logdir']
logfile = mainconfig.mainconfig['logfile']

app = FastAPI(
    title="Pi Brain",
    version="0.5",
    description="Pi Brain is designed to control Raspberry Pi robots and droids. This is a platform that allows for easy control of multiple control systems including Servos, Audio, Motor Controls and a whole lot more. Its designed to be flexible and easy to use.  Pi Brain is driven by FastAPI and controlled by touch and control systems.",
    contact={
        "name": "Chris Goudie",
        "url": "http://www.goudie.me",
        "email": "chris@goudie.me",
        },

        openapi_tags=[
        {
            "name": "Audio",
            "description": "Handles Audio Items.",
        },
        {
            "name": "Servo",
            "description": "Handles Servo Items.",
        },
        {
            "name": "Dome",
            "description": "Handles Dome Items.",
        },
        {
            "name": "HoloProjector",
            "description": "Handles HoloProjectors Items.",
        },
        {
            "name": "Body",
            "description": "Handles Dome Items.",
        },
        {
            "name": "GPIO",
            "description": "Handles GPIO Items.",
        },
        {
            "name": "Script",
            "description": "Handles Script Items.",
        },
                {
            "name": "Joystick",
            "description": "Handles Joystick Items.",
        },
        {
            "name": "System",
            "description": "Handles System Items.",
        },
        {
            "name": "Admin",
            "description": "Admin CRUD for servo and bus configuration.",
        },
    ] )

# Allow all origins to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

#pin_config = PinConfig()

# Initialize I2C bus and ServoKit
#i2c_bus = busio.I2C(board.SCL, board.SDA)
#kit = ServoKit(channels=16, i2c=i2c_bus)
    
class Message(BaseModel):
    message: str

class PinControl(BaseModel):
    pin: int

class PinConfiguration(BaseModel):
    pin: int
    mode: str

class ServoConfig(BaseModel):
    id: int
    name: str
    bus: str
    default_position: int
    open_position: int
    close_position: int
    position: int = 0
    speed: int = 100  # 1 (slow) – 100 (instant)

class BusConfig(BaseModel):
    name: str
    address: str
    scl_pin: str
    sda_pin: str

class AudioTagUpdate(BaseModel):
    category: str



# Define servo control endpoints
#@app.get("/servo/{servo_id}/angle/{angle}", response_model=Message)
#async def set_servo_angle(servo_id: int, angle: int):
#    try:
#        kit.servo[servo_id].angle = angle
#        return {"message": f"Servo {servo_id} set to angle {angle}"}
#    except Exception as e:
#        return JSONResponse(content={"error": str(e)}, status_code=500)
#
#@app.get("/servo/{servo_id}/position/{position}", response_model=Message)
#async def set_servo_position(servo_id: int, position: int):
#    try:
#        kit.servo[servo_id].angle = position_to_angle(position)
#        return {"message": f"Servo {servo_id} set to position {position}"}
#    except Exception as e:
#        return JSONResponse(content={"error": str(e)}, status_code=500)
#
# Helper function to convert position to angle
#def position_to_angle(position):
#    # Logic to convert position to angle
#    return position


#######################
# AUDIO ITEMS
#######################

@app.get("/audio/list/", tags=["Audio"])
async def audio_list_handeler():
    return await audio_list()

@app.get("/audio/{filename}", tags=["Audio"])
async def audio_play_handler(filename: str):
    return await audio_play(filename)

@app.get("/audio/random/list/", tags=["Audio"])
async def audio_random_list_handler():
    return await audio_random_list()

@app.get("/audio/random/{prefix_name}", tags=["Audio"])
async def audio_random_play_handler(prefix_name: str):
    return await audio_random_play(prefix_name)

@app.get("/volume", tags=["Audio"])
async def get_volume_endpoint():
    return await get_volume()
    
@app.put("/volume/{volume_level}", tags=["Audio"])
async def set_volume_endpoint(volume_level: int):
    return await set_volume(volume_level)

#######################
# SERVO ITEMS
#######################

# Read servo configurations from config file
with open("configs/servo_config.json", "r") as config_file:
    servo_config = json.load(config_file)

# Define route to get all servo configurations
@app.get("/servo/list", tags=["Servo"])
async def get_servos():
    return servo_config["servos"]

# Define route to get all servo configurations
@app.get("/servo/bus/list", tags=["Servo"])
async def get_servos():
    return servo_config["i2c_buses"]

# Define route to move a specific servo to a position
@app.get("/servos/{bus_name}/{servo_id}/move", tags=["Servo"])
async def move_servo(bus_name: str, servo_id: int, position: int):
    if bus_name in i2c_servo_controls:
        i2c_servo_control = i2c_servo_controls[bus_name]
        # Find the servo in the config
        for servo in servo_config["servos"]:
            if servo["id"] == servo_id:
                # Move the servo
                i2c_servo_control.move_servo(servo_id, position)
                # Update the position in the config
                servo["position"] = position
                # Save the updated config back to the file
                with open("configs/servo_config.json", "w") as config_file:
                    json.dump(servo_config, config_file, indent=4)
                return {"message": f"Moved servo {servo_id} to position {position}"}
        return {"message": "Servo not found"}
    else:
        return {"message": f"Invalid bus name: {bus_name}"}


@app.get("/servo/open/{servo_name}")
async def open_servo(servo_name: str):
    # Find the servo with the given name
    for servo in servo_config['servos']:
        if servo['name'] == servo_name:
            # Open the servo
            await move_servo(servo['bus'], servo['id'], servo['open_position'])
            return {"message": f"Opened servo {servo_name}"}

    return {"error": "Servo not found"}

@app.get("/servo/close/{servo_name}")
async def close_servo(servo_name: str):
    # Find the servo with the given name
    for servo in servo_config['servos']:
        if servo['name'] == servo_name:
            # Close the servo
            await move_servo(servo['bus'], servo['id'], servo['close_position'])
            return {"message": f"Closed servo {servo_name}"}

    return {"error": "Servo not found"}


#######################
# DOME ITEMS - MOTOR
#######################

#
#import time
#
#
#
## set up GPIO pins
#GPIO.setup(4, GPIO.OUT)  # Changed to GPIO4
#GPIO.setup(17, GPIO.OUT)  # Changed to GPIO17
#GPIO.setup(18, GPIO.OUT)  # Changed to GPIO18
#GPIO.setup(27, GPIO.OUT)  # Changed to GPIO27
#
## Set the PWM pin and frequency
#pwm = GPIO.PWM(4, 100)  # Changed to GPIO4
#
## Start PWM with 0% duty cycle (off)
#pwm.start(0)
#
#@app.get("/motor/forward/{speed}", tags=["TEST"])
#async def move_forward(speed: int):
#    # Drive the motor clockwise
#    GPIO.output(18, GPIO.HIGH)  # Changed to GPIO18
#    GPIO.output(17, GPIO.LOW)  # Changed to GPIO17
#
#    # Disable STBY (standby)
#    GPIO.output(27, GPIO.HIGH)  # Changed to GPIO27
#
#    # Ramp up the speed over 5 seconds
#    for duty_cycle in range(0, speed+1, 5):  # 0 to speed in steps of 5
#        pwm.ChangeDutyCycle(duty_cycle)
#        time.sleep(0.1)  # sleep 0.1 seconds
#
#   return {"message": f"Motor is running forward at {speed}% speed"}
#
#@app.get("/motor/backward/{speed}", tags=["TEST"])
#async def move_backward(speed: int):
#    # Drive the motor counter-clockwise
#    GPIO.output(18, GPIO.LOW)  # Changed to GPIO18
#    GPIO.output(17, GPIO.HIGH)  # Changed to GPIO17
#
#    # Disable STBY (standby)
#    GPIO.output(27, GPIO.HIGH)  # Changed to GPIO27
#
#    # Ramp up the speed over 5 seconds
#    for duty_cycle in range(0, speed+1, 5):  # 0 to speed in steps of 5
#        pwm.ChangeDutyCycle(duty_cycle)
#        time.sleep(0.1)  # sleep 0.1 seconds
#
 #   return {"message": f"Motor is running backward at {speed}% speed"}
#
#@app.get("/motor/stop", tags=["TEST"])
#async def stop_motor():
#    # Set the duty cycle to 0 (off)
#    pwm.ChangeDutyCycle(0)
#
#    # Set all pins low
#    GPIO.output(4, GPIO.LOW)  # Changed to GPIO4
#    GPIO.output(17, GPIO.LOW)  # Changed to GPIO17
#    GPIO.output(18, GPIO.LOW)  # Changed to GPIO18
#    GPIO.output(27, GPIO.LOW)  # Changed to GPIO27
#
#    return {"message": "Motor stopped"}

#######################
# DOME ITEMS - SERVOS
#######################


@app.get("/dome/list", tags=["Dome"])
async def dome_list_handeler():
    dome_servos = [servo for servo in servo_config["servos"] if servo["bus"] == "dome"]
    return dome_servos


@app.get("/dome/<servo_name>/<servo_position>/<servo_Duration>", tags=["Dome"])
async def PLACEHOLDER():
    return ()

@app.get("/dome/close", tags=["Dome"])
async def PLACEHOLDER():
    return ()

@app.get("/dome/close/<duration>", tags=["Dome"])
async def PLACEHOLDER():
    return ()

@app.get("/dome/open", tags=["Dome"])
async def PLACEHOLDER():
    return ()

@app.get("/dome/open/<duration>", tags=["Dome"])
async def PLACEHOLDER():
    return ()


#######################
# HOLOPROJECTOR ITEMS - SERVOS
#######################


@app.get("/holoprojector/list/", tags=["HoloProjector"])
async def PLACEHOLDER():
    return ()

@app.get("/holoprojector/<servo_name>/<servo_position>/<servo_Duration>", tags=["HoloProjector"])
async def PLACEHOLDER():
    return ()

@app.get("/holoprojector/close", tags=["HoloProjector"])
async def PLACEHOLDER():
    return ()

@app.get("/holoprojector/close/<duration>", tags=["HoloProjector"])
async def PLACEHOLDER():
    return ()

@app.get("/holoprojector/open", tags=["HoloProjector"])
async def PLACEHOLDER():
    return ()

@app.get("/holoprojector/open/<duration>", tags=["HoloProjector"])
async def PLACEHOLDER():
    return ()




#######################
# BODY ITEMS - SERVOS
#######################

@app.get("/body/list", tags=["Body"])
async def body_list_handeler():
    body_servos = [servo for servo in servo_config["servos"] if servo["bus"] == "body"]
    return body_servos



@app.get("/body/<servo_name>/<servo_position>/<servo_Duration>", tags=["Body"])
async def PLACEHOLDER():
    return ()

@app.get("/body/close", tags=["Body"])
async def PLACEHOLDER():
    return ()

@app.get("/body/close/<duration>", tags=["Body"])
async def PLACEHOLDER():
    return ()

@app.get("/body/open", tags=["Body"])
async def PLACEHOLDER():
    return ()

@app.get("/body/open/<duration>", tags=["Body"])
async def PLACEHOLDER():
    return ()





#class I2CServoControl:
#    def __init__(self, address, scl_pin, sda_pin):
#        self.address = address
 #       self.i2c = busio.I2C(scl_pin, sda_pin)
 #       self.kit = ServoKit(channels=16, i2c=self.i2c)
#
#    def move_servo(self, servo_id, position):
#        # Move the specified servo to the specified position
#        self.kit.servo[servo_id].angle = position

## Read servo configurations from config file
#with open("configs/servo_config.json", "r") as config_file:
#    servo_config = json.load(config_file)

# Initialize I2C servo controls for each bus specified in the config
#i2c_servo_controls = {}
#for bus_config in servo_config["i2c_buses"]:
#    bus_name = bus_config["name"]
#    bus_address = bus_config["address"]
#    scl_pin = getattr(board, bus_config["scl_pin"])
#    sda_pin = getattr(board, bus_config["sda_pin"])
#    i2c_servo_controls[bus_name] = I2CServoControl(address=bus_address, scl_pin=scl_pin, sda_pin=sda_pin)

# Define route to get all servo configurations
#@app.get("/servos")
#async def get_servos():
 #   return servo_config["servos"]

# Define route to move a specific servo to a position
#@app.put("/servos/{bus_name}/{servo_id}/move")
#async def move_servo(bus_name: str, servo_id: int, position: int):
#    if bus_name in i2c_servo_controls:
#        i2c_servo_control = i2c_servo_controls[bus_name]
#        # Find the servo in the config
#        for servo in servo_config["servos"]:
#            if servo["id"] == servo_id:
#                # Move the servo
#                i2c_servo_control.move_servo(servo_id, position)
#                # Update the position in the config
#                servo["position"] = position
#                # Save the updated config back to the file
#                with open("configs/servo_config.json", "w") as config_file:
#                    json.dump(servo_config, config_file, indent=4)
#                return {"message": f"Moved servo {servo_id} to position {position}"}
#        return {"message": "Servo not found"}
#    else:
#        return {"message": f"Invalid bus name: {bus_name}"}


# @app.put("/servos/{bus_name}/{servo_id}/move")
#async def move_servo(bus_name: str, servo_id: int, position: int):
#    if bus_name in i2c_servo_controls:
#        i2c_servo_control = i2c_servo_controls[bus_name]
#        # Find the servo in the config
#        for servo in servo_config["servos"]:
#            if servo["id"] == servo_id:
#                # Check if the position is within the limits
#                if "min_angle" in servo and "max_angle" in servo:
#                    min_angle = servo["min_angle"]
#                    max_angle = servo["max_angle"]
#                    if position < min_angle or position > max_angle:
#                        return {"message": f"Position {position} is outside the allowed range ({min_angle} - {max_angle})"}
#                # Move the servo
#                i2c_servo_control.move_servo(servo_id, position)
#                # Update the position in the config
#                servo["position"] = position
#                # Save the updated config back to the file
#                with open("configs/servo_config.json", "w") as config_file:
#                    json.dump(servo_config, config_file, indent=4)
#                return {"message": f"Moved servo {servo_id} to position {position}"}
#        return {"message": "Servo not found"}
#    else:
#        return {"message": f"Invalid bus name: {bus_name}"}





#######################
# GPIO ITEMS
#######################

# Read pin configuration from config file
with open("configs/pin_config.json", "r") as config_file:
    pin_config = json.load(config_file)

 # Set up GPIO pins based on config
GPIO.setmode(GPIO.BCM)
for pin in pin_config["pins"]:
    GPIO.setup(pin["id"], GPIO.OUT)   

@app.get("/GPIO/list", tags=["GPIO"])
async def list_pins():
    return pin_config["pins"]

@app.get("/GPIO/AllOn", tags=["GPIO"])
async def turn_on_pins():
    # Turn on all pins
    for pin in pin_config["pins"]:
        turn_on_pin(pin["id"])
    return {"message": "All pins turned on successfully"}


@app.get("/GPIO/AllOff", tags=["GPIO"])
async def turn_off_pins():
    # Turn off all pins
    for pin in pin_config["pins"]:
        turn_off_pin(pin["id"])
    return {"message": "All pins turned off successfully"}

@app.get("/GPIO/on/{pin_id}", tags=["GPIO"])
async def turn_on_pin(pin_id: int):
    # Find the pin in the config
    for pin in pin_config["pins"]:
        if pin["id"] == pin_id:
            GPIO.output(pin["id"], GPIO.HIGH)
            return {"message": f"Pin {pin_id} turned on successfully"}
    raise HTTPException(status_code=404, detail="Pin not found")

@app.get("/GPIO/off/{pin_id}", tags=["GPIO"])
async def turn_off_pin(pin_id: int):
    # Find the pin in the config
    for pin in pin_config["pins"]:
        if pin["id"] == pin_id:
            GPIO.output(pin["id"], GPIO.LOW)
            return {"message": f"Pin {pin_id} turned off successfully"}
    raise HTTPException(status_code=404, detail="Pin not found")


def turn_off_pin(pin):
    GPIO.output(pin, GPIO.LOW)

def turn_on_pin(pin):
    GPIO.output(pin, GPIO.HIGH)





######################
# SCRIPT ITEMS - SERVOS
#######################

@app.get("/script/list/", tags=["Script"])
async def script_list_handeler():
    return await script_list()

@app.get("/script/start/{script_name}/{loop}", tags=["Script"])
async def start_script(script_name: str, loop: int, background_tasks: BackgroundTasks):
    return await script_start_handler(script_name, loop, background_tasks)

@app.get("/script/list_running", tags=["Script"])
async def list_running_scripts():
    return {"running_scripts": running_scripts}

# Define endpoint to stop a single script
@app.get("/script/stop/{script_id}", tags=["Script"])
async def stop_single_script(script_id: str):
    return await stop_script(script_id)

# Define endpoint to stop all running scripts
@app.get("/script/stop_all", tags=["Script"])
async def stop_all_running_scripts():
    return await stop_all_scripts()


######################
# JOY STICK ITEMS - SERVOS
#######################
@app.post("/joystick/{command}", tags=["Joystick"])  # Change this line
async def joystick_command(command: str):
    print('Joystick endpoint hit')  # Add this line
    print(f'Received command: {command}')
    positions = command.split('-')  # Change this line
    if len(positions) != 6:
        return {"error": "Expected 6 positions"}

    # Now positions is a list of 6 strings
    # You can access the positions with positions[0], positions[1], etc.
    # Replace this with your actual code to handle the joystick commands
    for i, position in enumerate(positions):
        print(f'Position {i + 1}: {position}')

    return {"message": f"Received joystick command: {positions}"}


#######################
# STARTUP
#######################

@app.on_event("startup")
async def startup_init_profile_buses():
    """Initialise I2C buses from all existing profile servo configs at startup."""
    if not os.path.exists(PROFILES_DIR):
        return
    for profile_id in os.listdir(PROFILES_DIR):
        config = _load_profile_servo_config(profile_id)
        for bus in config.get("i2c_buses", []):
            if bus["name"] not in i2c_servo_controls:
                reinit_bus(bus)


#######################
# SYSTEM ITEMS
#######################
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok"}


@app.get("/shutdown", tags=["System"])
async def shutdown_pi():
    # Execute the shutdown command using subprocess
    subprocess.run(["sudo", "shutdown", "-h", "now"])
    return {"message": "Shutting down Raspberry Pi"}


SERVO_CONFIG_PATH = "configs/servo_config.json"

def _load_servo_config():
    with open(SERVO_CONFIG_PATH, "r") as f:
        return json.load(f)

def _save_servo_config(config):
    with open(SERVO_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=4)


#######################
# ADMIN ITEMS
#######################

@app.get("/admin/servos", tags=["Admin"])
async def admin_get_servos():
    return _load_servo_config()["servos"]

@app.post("/admin/servos", tags=["Admin"])
async def admin_add_servo(servo: ServoConfig):
    config = _load_servo_config()
    config["servos"].append(servo.model_dump())
    _save_servo_config(config)
    return config["servos"]

@app.put("/admin/servos/{index}", tags=["Admin"])
async def admin_update_servo(index: int, servo: ServoConfig):
    config = _load_servo_config()
    if index < 0 or index >= len(config["servos"]):
        raise HTTPException(status_code=404, detail="Servo index out of range")
    config["servos"][index] = servo.model_dump()
    _save_servo_config(config)
    return config["servos"]

@app.delete("/admin/servos/{index}", tags=["Admin"])
async def admin_delete_servo(index: int):
    config = _load_servo_config()
    if index < 0 or index >= len(config["servos"]):
        raise HTTPException(status_code=404, detail="Servo index out of range")
    config["servos"].pop(index)
    _save_servo_config(config)
    return config["servos"]

@app.get("/admin/buses", tags=["Admin"])
async def admin_get_buses():
    return _load_servo_config()["i2c_buses"]

@app.post("/admin/buses", tags=["Admin"])
async def admin_add_bus(bus: BusConfig):
    config = _load_servo_config()
    config["i2c_buses"].append(bus.model_dump())
    _save_servo_config(config)
    return config["i2c_buses"]

@app.put("/admin/buses/{index}", tags=["Admin"])
async def admin_update_bus(index: int, bus: BusConfig):
    config = _load_servo_config()
    if index < 0 or index >= len(config["i2c_buses"]):
        raise HTTPException(status_code=404, detail="Bus index out of range")
    config["i2c_buses"][index] = bus.model_dump()
    _save_servo_config(config)
    return config["i2c_buses"]

@app.delete("/admin/buses/{index}", tags=["Admin"])
async def admin_delete_bus(index: int):
    config = _load_servo_config()
    if index < 0 or index >= len(config["i2c_buses"]):
        raise HTTPException(status_code=404, detail="Bus index out of range")
    config["i2c_buses"].pop(index)
    _save_servo_config(config)
    return config["i2c_buses"]


#######################
# PROFILES
#######################

PROFILES_CONFIG_PATH = "configs/profiles.json"
PROFILES_DIR = "profiles"

def _profile_dir(profile_id):
    return os.path.join(PROFILES_DIR, profile_id)

def _profile_audio_dir(profile_id):
    return os.path.join(PROFILES_DIR, profile_id, "audio")

def _profile_scripts_dir(profile_id):
    return os.path.join(PROFILES_DIR, profile_id, "scripts")

def _profile_servo_config_path(profile_id):
    return os.path.join(PROFILES_DIR, profile_id, "servo_config.json")

def _ensure_profile_dirs(profile_id):
    os.makedirs(_profile_audio_dir(profile_id), exist_ok=True)
    os.makedirs(_profile_scripts_dir(profile_id), exist_ok=True)

def _profile_audio_tags_path(profile_id):
    return os.path.join(PROFILES_DIR, profile_id, "audio_tags.json")

def _profile_audio_categories_path(profile_id):
    return os.path.join(PROFILES_DIR, profile_id, "audio_categories.json")

def _load_audio_categories(profile_id):
    path = _profile_audio_categories_path(profile_id)
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return json.load(f)

def _save_audio_categories(profile_id, categories):
    os.makedirs(_profile_dir(profile_id), exist_ok=True)
    with open(_profile_audio_categories_path(profile_id), "w") as f:
        json.dump(categories, f, indent=4)

def _load_audio_tags(profile_id):
    path = _profile_audio_tags_path(profile_id)
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)

def _save_audio_tags(profile_id, tags):
    os.makedirs(_profile_dir(profile_id), exist_ok=True)
    with open(_profile_audio_tags_path(profile_id), "w") as f:
        json.dump(tags, f, indent=4)

def _load_profile_servo_config(profile_id):
    path = _profile_servo_config_path(profile_id)
    if not os.path.exists(path):
        # Fall back to global servo config until a profile-specific one is saved
        return {"i2c_buses": list(servo_config.get("i2c_buses", [])), "servos": list(servo_config.get("servos", []))}
    with open(path) as f:
        return json.load(f)

def _save_profile_servo_config(profile_id, config):
    os.makedirs(_profile_dir(profile_id), exist_ok=True)
    with open(_profile_servo_config_path(profile_id), "w") as f:
        json.dump(config, f, indent=4)

def _find_profile_image(profile_id):
    for ext in ('.png', '.jpg', '.jpeg', '.gif', '.webp'):
        path = os.path.join(_profile_dir(profile_id), f"image{ext}")
        if os.path.exists(path):
            return path
    return None

def _load_profiles():
    if not os.path.exists(PROFILES_CONFIG_PATH):
        return []
    with open(PROFILES_CONFIG_PATH, "r") as f:
        return json.load(f)

def _save_profiles(profiles):
    with open(PROFILES_CONFIG_PATH, "w") as f:
        json.dump(profiles, f, indent=4)

class ProfileRobot(BaseModel):
    name: str
    api_url: str
    features: List[str]

class Profile(BaseModel):
    id: str
    label: str
    layout: str
    builtin: bool = False
    colors: Dict[str, str]
    robot: ProfileRobot

@app.get("/profiles", tags=["Admin"])
async def get_profiles():
    return _load_profiles()

@app.get("/profiles/{profile_id}", tags=["Admin"])
async def get_profile(profile_id: str):
    profiles = _load_profiles()
    for p in profiles:
        if p["id"] == profile_id:
            return p
    raise HTTPException(status_code=404, detail="Profile not found")

@app.post("/profiles", tags=["Admin"])
async def create_profile(profile: Profile):
    if profile.builtin:
        raise HTTPException(status_code=400, detail="Cannot create built-in profiles")
    profiles = _load_profiles()
    if any(p["id"] == profile.id for p in profiles):
        raise HTTPException(status_code=409, detail="Profile ID already exists")
    profiles.append(profile.model_dump())
    _save_profiles(profiles)
    return profile.model_dump()

@app.put("/profiles/{profile_id}", tags=["Admin"])
async def update_profile(profile_id: str, profile: Profile):
    profiles = _load_profiles()
    for i, p in enumerate(profiles):
        if p["id"] == profile_id:
            if profile.id != profile_id and any(p2["id"] == profile.id for p2 in profiles):
                raise HTTPException(status_code=409, detail="Profile ID already exists")
            profiles[i] = profile.model_dump()
            _save_profiles(profiles)
            if profile.id != profile_id:
                old_dir = _profile_dir(profile_id)
                new_dir = _profile_dir(profile.id)
                if os.path.exists(old_dir):
                    os.rename(old_dir, new_dir)
            return profile.model_dump()
    raise HTTPException(status_code=404, detail="Profile not found")

@app.delete("/profiles/{profile_id}", tags=["Admin"])
async def delete_profile(profile_id: str):
    profiles = _load_profiles()
    new_profiles = [p for p in profiles if p["id"] != profile_id]
    if len(new_profiles) == len(profiles):
        raise HTTPException(status_code=404, detail="Profile not found")
    _save_profiles(new_profiles)
    profile_dir = _profile_dir(profile_id)
    if os.path.exists(profile_dir):
        shutil.rmtree(profile_dir)
    return {"deleted": profile_id}


#######################
# PROFILE-SCOPED AUDIO
#######################

@app.get("/profiles/{profile_id}/audio/list", tags=["Admin"])
async def profile_audio_list(profile_id: str):
    audio_dir = _profile_audio_dir(profile_id)
    if not os.path.exists(audio_dir):
        return []
    files = sorted(f for f in os.listdir(audio_dir) if f.endswith((".mp3", ".wav", ".ogg")))
    return files

@app.get("/profiles/{profile_id}/audio/file/{filename}", tags=["Admin"])
async def profile_audio_serve(profile_id: str, filename: str):
    filepath = os.path.join(_profile_audio_dir(profile_id), filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    media_type, _ = mimetypes.guess_type(filepath)
    return FileResponse(filepath, media_type=media_type or "audio/mpeg")

@app.get("/profiles/{profile_id}/audio/stop", tags=["Admin"])
async def profile_audio_stop(profile_id: str):
    from plugins.audio.audio_control import _AUDIO_AVAILABLE
    try:
        import pygame
    except ImportError:
        pygame = None
    if _AUDIO_AVAILABLE and pygame is not None:
        pygame.mixer.music.stop()
        return {"stopped": True}
    return {"stopped": False, "message": "[DEV MODE] No audio to stop"}

@app.get("/profiles/{profile_id}/audio/play/{filename}", tags=["Admin"])
async def profile_audio_play(profile_id: str, filename: str):
    from plugins.audio.audio_control import _AUDIO_AVAILABLE
    try:
        import pygame
    except ImportError:
        pygame = None
    filepath = os.path.join(_profile_audio_dir(profile_id), filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    if not _AUDIO_AVAILABLE or pygame is None:
        print(f"[MOCK AUDIO] would play: {filepath}")
        return {"played": False, "filename": filename, "message": f"[DEV MODE] Would play: {filename}"}
    pygame.mixer.music.load(filepath)
    pygame.mixer.music.play()
    return {"played": True, "filename": filename, "message": f"Playing audio file: {filename}"}

@app.get("/profiles/{profile_id}/audio/random/{prefix}", tags=["Admin"])
async def profile_audio_random(profile_id: str, prefix: str):
    import random as _random
    from plugins.audio.audio_control import _AUDIO_AVAILABLE
    try:
        import pygame
    except ImportError:
        pygame = None
    audio_dir = _profile_audio_dir(profile_id)
    if not os.path.exists(audio_dir):
        raise HTTPException(status_code=404, detail="No audio files found")
    files = [f for f in os.listdir(audio_dir) if f.lower().startswith(prefix.lower()) and f.endswith((".mp3", ".wav", ".ogg"))]
    if not files:
        raise HTTPException(status_code=404, detail="No matching audio files found")
    chosen = _random.choice(files)
    filepath = os.path.join(audio_dir, chosen)
    if not _AUDIO_AVAILABLE or pygame is None:
        print(f"[MOCK AUDIO] would play random: {chosen}")
        return {"played": False, "filename": chosen, "message": f"[DEV MODE] Would play: {chosen}"}
    pygame.mixer.music.load(filepath)
    pygame.mixer.music.play()
    return {"played": True, "filename": chosen, "message": f"Playing random audio file: {chosen}"}

@app.post("/profiles/{profile_id}/audio/upload", tags=["Admin"])
async def profile_audio_upload(profile_id: str, file: UploadFile = File(...)):
    allowed = {".mp3", ".wav", ".ogg"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only .mp3, .wav, .ogg allowed")
    _ensure_profile_dirs(profile_id)
    dest = os.path.join(_profile_audio_dir(profile_id), file.filename)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"message": f"Uploaded {file.filename}"}

@app.delete("/profiles/{profile_id}/audio/{filename}", tags=["Admin"])
async def profile_audio_delete(profile_id: str, filename: str):
    filepath = os.path.join(_profile_audio_dir(profile_id), filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(filepath)
    return {"deleted": filename}

@app.get("/profiles/{profile_id}/audio/tags", tags=["Admin"])
async def profile_audio_get_tags(profile_id: str):
    return _load_audio_tags(profile_id)

@app.put("/profiles/{profile_id}/audio/tags/{filename}", tags=["Admin"])
async def profile_audio_set_tag(profile_id: str, filename: str, update: AudioTagUpdate):
    tags = _load_audio_tags(profile_id)
    tags[filename] = update.category
    _save_audio_tags(profile_id, tags)
    return tags

@app.delete("/profiles/{profile_id}/audio/tags/{filename}", tags=["Admin"])
async def profile_audio_clear_tag(profile_id: str, filename: str):
    tags = _load_audio_tags(profile_id)
    tags.pop(filename, None)
    _save_audio_tags(profile_id, tags)
    return tags

@app.get("/profiles/{profile_id}/audio/categories", tags=["Admin"])
async def profile_audio_get_categories(profile_id: str):
    return _load_audio_categories(profile_id)

@app.post("/profiles/{profile_id}/audio/categories/{name}", tags=["Admin"])
async def profile_audio_add_category(profile_id: str, name: str):
    cats = _load_audio_categories(profile_id)
    if name not in cats:
        cats.append(name)
        _save_audio_categories(profile_id, cats)
    return cats

@app.put("/profiles/{profile_id}/audio/categories/{old_name}", tags=["Admin"])
async def profile_audio_rename_category(profile_id: str, old_name: str, new_name: str = Query(...)):
    cats = _load_audio_categories(profile_id)
    if old_name not in cats:
        raise HTTPException(status_code=404, detail="Category not found")
    cats = [new_name if c == old_name else c for c in cats]
    _save_audio_categories(profile_id, cats)
    tags = _load_audio_tags(profile_id)
    if any(v == old_name for v in tags.values()):
        for filename in tags:
            if tags[filename] == old_name:
                tags[filename] = new_name
        _save_audio_tags(profile_id, tags)
    return cats

@app.delete("/profiles/{profile_id}/audio/categories/{name}", tags=["Admin"])
async def profile_audio_remove_category(profile_id: str, name: str):
    cats = _load_audio_categories(profile_id)
    cats = [c for c in cats if c != name]
    _save_audio_categories(profile_id, cats)
    return cats

@app.put("/profiles/{profile_id}/audio/rename/{filename}", tags=["Admin"])
async def profile_audio_rename(profile_id: str, filename: str, new_name: str = Query(...)):
    old_path = os.path.join(_profile_audio_dir(profile_id), filename)
    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail="File not found")
    new_path = os.path.join(_profile_audio_dir(profile_id), new_name)
    os.rename(old_path, new_path)
    tags = _load_audio_tags(profile_id)
    if filename in tags:
        tags[new_name] = tags.pop(filename)
        _save_audio_tags(profile_id, tags)
    return {"renamed": new_name}


#######################
# PROFILE-SCOPED SCRIPTS
#######################

@app.get("/profiles/{profile_id}/scripts/list", tags=["Admin"])
async def profile_script_list(profile_id: str):
    scripts_dir = _profile_scripts_dir(profile_id)
    if not os.path.exists(scripts_dir):
        return []
    return sorted(f for f in os.listdir(scripts_dir) if f.endswith(".scr"))

@app.post("/profiles/{profile_id}/scripts/upload", tags=["Admin"])
async def profile_script_upload(profile_id: str, file: UploadFile = File(...)):
    if not file.filename.endswith(".scr"):
        raise HTTPException(status_code=400, detail="Only .scr files allowed")
    _ensure_profile_dirs(profile_id)
    dest = os.path.join(_profile_scripts_dir(profile_id), file.filename)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"message": f"Uploaded {file.filename}"}

@app.delete("/profiles/{profile_id}/scripts/{filename}", tags=["Admin"])
async def profile_script_delete(profile_id: str, filename: str):
    filepath = os.path.join(_profile_scripts_dir(profile_id), filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(filepath)
    return {"deleted": filename}

@app.get("/profiles/{profile_id}/scripts/{name}/content", tags=["Admin"])
async def profile_script_get_content(profile_id: str, name: str):
    path = os.path.join(_profile_scripts_dir(profile_id), f"{name}.scr")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Script not found")
    with open(path) as f:
        return {"content": f.read()}

class ScriptContent(BaseModel):
    content: str

@app.put("/profiles/{profile_id}/scripts/{name}", tags=["Admin"])
async def profile_script_save(profile_id: str, name: str, body: ScriptContent):
    os.makedirs(_profile_scripts_dir(profile_id), exist_ok=True)
    path = os.path.join(_profile_scripts_dir(profile_id), f"{name}.scr")
    with open(path, "w") as f:
        f.write(body.content)
    return {"saved": name}

@app.get("/profiles/{profile_id}/scripts/start/{name}/{loop}", tags=["Admin"])
async def profile_script_start(profile_id: str, name: str, loop: int, background_tasks: BackgroundTasks):
    from plugins.script.script_control import run_script, running_scripts
    import uuid as _uuid
    script_path = os.path.join(_profile_scripts_dir(profile_id), f"{name}.scr")
    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail=f"Script '{name}' not found")
    script_id = str(_uuid.uuid4())

    async def _run_profile_script(script_id, script_path, name, loop):
        import aiohttp
        running_scripts[script_id] = {"script_name": name, "status": "running"}
        try:
            with open(script_path) as f:
                lines = f.readlines()
            for line in lines:
                if script_id not in running_scripts:
                    break
                parts = line.strip().split()
                if not parts:
                    continue
                if parts[0] == "sleep":
                    import asyncio as _asyncio
                    await _asyncio.sleep(int(parts[1]))
                elif parts[0] == "audio" and parts[1] == "play":
                    async with aiohttp.ClientSession() as session:
                        async with session.get(f"http://localhost:8000/profiles/{profile_id}/audio/play/{parts[2]}") as r:
                            pass
                elif parts[0] == "audio" and parts[1] == "random":
                    async with aiohttp.ClientSession() as session:
                        async with session.get(f"http://localhost:8000/profiles/{profile_id}/audio/random/{parts[2]}") as r:
                            pass
                elif parts[0] == "servo" and parts[1] == "open":
                    async with aiohttp.ClientSession() as session:
                        async with session.get(f"http://localhost:8000/profiles/{profile_id}/servo/open/{parts[2]}") as r:
                            pass
                elif parts[0] == "servo" and parts[1] == "close":
                    async with aiohttp.ClientSession() as session:
                        async with session.get(f"http://localhost:8000/profiles/{profile_id}/servo/close/{parts[2]}") as r:
                            pass
                elif parts[0] == "servo" and parts[1] == "move":
                    async with aiohttp.ClientSession() as session:
                        async with session.get(f"http://localhost:8000/profiles/{profile_id}/servo/{parts[2]}/move/{parts[3]}") as r:
                            pass
            if int(loop) == 1 and script_id in running_scripts:
                await _run_profile_script(script_id, script_path, name, loop)
        finally:
            running_scripts.pop(script_id, None)

    background_tasks.add_task(_run_profile_script, script_id, script_path, name, loop)
    return {"script_id": script_id, "message": f"Script '{name}' execution started"}


#######################
# PROFILE-SCOPED ADMIN SERVOS
#######################

@app.get("/profiles/{profile_id}/admin/servos", tags=["Admin"])
async def profile_admin_get_servos(profile_id: str):
    return _load_profile_servo_config(profile_id)["servos"]

@app.post("/profiles/{profile_id}/admin/servos", tags=["Admin"])
async def profile_admin_add_servo(profile_id: str, servo: ServoConfig):
    config = _load_profile_servo_config(profile_id)
    config["servos"].append(servo.model_dump())
    _save_profile_servo_config(profile_id, config)
    return config["servos"]

@app.put("/profiles/{profile_id}/admin/servos/{index}", tags=["Admin"])
async def profile_admin_update_servo(profile_id: str, index: int, servo: ServoConfig):
    config = _load_profile_servo_config(profile_id)
    if index < 0 or index >= len(config["servos"]):
        raise HTTPException(status_code=404, detail="Servo index out of range")
    config["servos"][index] = servo.model_dump()
    _save_profile_servo_config(profile_id, config)
    return config["servos"]

@app.delete("/profiles/{profile_id}/admin/servos/{index}", tags=["Admin"])
async def profile_admin_delete_servo(profile_id: str, index: int):
    config = _load_profile_servo_config(profile_id)
    if index < 0 or index >= len(config["servos"]):
        raise HTTPException(status_code=404, detail="Servo index out of range")
    config["servos"].pop(index)
    _save_profile_servo_config(profile_id, config)
    return config["servos"]


#######################
# PROFILE-SCOPED ADMIN BUSES
#######################

@app.get("/profiles/{profile_id}/admin/buses", tags=["Admin"])
async def profile_admin_get_buses(profile_id: str):
    return _load_profile_servo_config(profile_id)["i2c_buses"]

@app.post("/profiles/{profile_id}/admin/buses", tags=["Admin"])
async def profile_admin_add_bus(profile_id: str, bus: BusConfig):
    config = _load_profile_servo_config(profile_id)
    config["i2c_buses"].append(bus.model_dump())
    _save_profile_servo_config(profile_id, config)
    reinit_bus(bus.model_dump())
    return config["i2c_buses"]

@app.put("/profiles/{profile_id}/admin/buses/{index}", tags=["Admin"])
async def profile_admin_update_bus(profile_id: str, index: int, bus: BusConfig):
    config = _load_profile_servo_config(profile_id)
    if index < 0 or index >= len(config["i2c_buses"]):
        raise HTTPException(status_code=404, detail="Bus index out of range")
    old_name = config["i2c_buses"][index]["name"]
    config["i2c_buses"][index] = bus.model_dump()
    _save_profile_servo_config(profile_id, config)
    reinit_bus(bus.model_dump(), old_name=old_name)
    return config["i2c_buses"]

@app.delete("/profiles/{profile_id}/admin/buses/{index}", tags=["Admin"])
async def profile_admin_delete_bus(profile_id: str, index: int):
    config = _load_profile_servo_config(profile_id)
    if index < 0 or index >= len(config["i2c_buses"]):
        raise HTTPException(status_code=404, detail="Bus index out of range")
    old_name = config["i2c_buses"][index]["name"]
    config["i2c_buses"].pop(index)
    _save_profile_servo_config(profile_id, config)
    remove_bus(old_name)
    return config["i2c_buses"]


#######################
# PROFILE-SCOPED SERVO CONTROL
#######################

async def _move_with_speed(kit, servo_id, from_angle, to_angle, speed=100):
    """Move a servo from from_angle to to_angle at the given speed (1=slow, 100=instant)."""
    from_angle = int(from_angle)
    to_angle = int(to_angle)
    if speed >= 100 or from_angle == to_angle:
        kit.servo[servo_id].angle = to_angle
        return
    steps = abs(to_angle - from_angle)
    total_time = (100 - speed) * 0.03  # up to ~3 seconds at speed=1
    delay = total_time / steps
    direction = 1 if to_angle > from_angle else -1
    for angle in range(from_angle, to_angle + direction, direction):
        kit.servo[servo_id].angle = angle
        await asyncio.sleep(delay)


@app.get("/profiles/{profile_id}/servo/open/{servo_name}", tags=["Admin"])
async def profile_servo_open(profile_id: str, servo_name: str):
    config = _load_profile_servo_config(profile_id)
    for servo in config["servos"]:
        if servo["name"] == servo_name:
            if servo["bus"] in i2c_servo_controls:
                await _move_with_speed(
                    i2c_servo_controls[servo["bus"]].kit,
                    servo["id"],
                    servo.get("position", servo["open_position"]),
                    servo["open_position"],
                    servo.get("speed", 100),
                )
            servo["position"] = servo["open_position"]
            _save_profile_servo_config(profile_id, config)
            return {"message": f"Opened {servo_name}", "position": servo["open_position"]}
    raise HTTPException(status_code=404, detail="Servo not found")

@app.get("/profiles/{profile_id}/servo/close/{servo_name}", tags=["Admin"])
async def profile_servo_close(profile_id: str, servo_name: str):
    config = _load_profile_servo_config(profile_id)
    for servo in config["servos"]:
        if servo["name"] == servo_name:
            if servo["bus"] in i2c_servo_controls:
                await _move_with_speed(
                    i2c_servo_controls[servo["bus"]].kit,
                    servo["id"],
                    servo.get("position", servo["close_position"]),
                    servo["close_position"],
                    servo.get("speed", 100),
                )
            servo["position"] = servo["close_position"]
            _save_profile_servo_config(profile_id, config)
            return {"message": f"Closed {servo_name}", "position": servo["close_position"]}
    raise HTTPException(status_code=404, detail="Servo not found")

@app.get("/profiles/{profile_id}/servo/{servo_name}/move/{angle}", tags=["Admin"])
async def profile_servo_move(profile_id: str, servo_name: str, angle: int):
    if angle < 0 or angle > 180:
        raise HTTPException(status_code=400, detail="Angle must be 0-180")
    config = _load_profile_servo_config(profile_id)
    for servo in config["servos"]:
        if servo["name"] == servo_name:
            if servo["bus"] in i2c_servo_controls:
                await _move_with_speed(
                    i2c_servo_controls[servo["bus"]].kit,
                    servo["id"],
                    servo.get("position", angle),
                    angle,
                    servo.get("speed", 100),
                )
            servo["position"] = angle
            _save_profile_servo_config(profile_id, config)
            return {"message": f"Moved {servo_name} to {angle}°", "position": angle}
    raise HTTPException(status_code=404, detail="Servo not found")


#######################
# PROFILE IMAGE
#######################

@app.post("/profiles/{profile_id}/image", tags=["Admin"])
async def profile_image_upload(profile_id: str, file: UploadFile = File(...)):
    allowed = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only image files allowed (.png/.jpg/.jpeg/.gif/.webp)")
    os.makedirs(_profile_dir(profile_id), exist_ok=True)
    # Delete old image first
    old = _find_profile_image(profile_id)
    if old:
        os.remove(old)
    dest = os.path.join(_profile_dir(profile_id), f"image{ext}")
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"message": f"Image uploaded for profile {profile_id}"}

@app.get("/profiles/{profile_id}/image", tags=["Admin"])
async def profile_image_get(profile_id: str):
    path = _find_profile_image(profile_id)
    if not path:
        raise HTTPException(status_code=404, detail="No image found for this profile")
    media_type, _ = mimetypes.guess_type(path)
    return FileResponse(path, media_type=media_type or "application/octet-stream")

@app.delete("/profiles/{profile_id}/image", tags=["Admin"])
async def profile_image_delete(profile_id: str):
    path = _find_profile_image(profile_id)
    if not path:
        raise HTTPException(status_code=404, detail="No image found for this profile")
    os.remove(path)
    return {"deleted": True}


# Serve the built React frontend — must be last so it doesn't shadow API routes
_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)




