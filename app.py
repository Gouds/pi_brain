from fastapi import FastAPI, HTTPException, File, UploadFile, Query, BackgroundTasks
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
#from gpio_control import turn_on_pin, turn_off_pin
#from pin_config import PinConfig
from typing import List, Dict
import os
from utils import mainconfig
from plugins.audio.audio_control import audio_list, audio_play, audio_random_list, audio_random_play, get_volume, set_volume
from plugins.dome.dome_control import dome_list
from plugins.body.body_control import body_list
from plugins.servo.servo_control import i2c_servo_controls
from plugins.script.script_control import script_list, script_start_handler, running_scripts, stop_script, stop_all_scripts
#import board
#import busio
#from adafruit_servokit import ServoKit
import json
try:
    import RPi.GPIO as GPIO
except ImportError:
    from mocks import gpio as GPIO
    print("[DEV MODE] RPi.GPIO not available - using mock GPIO")
import subprocess




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

class BusConfig(BaseModel):
    name: str
    address: str
    scl_pin: str
    sda_pin: str



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
            profiles[i] = profile.model_dump()
            _save_profiles(profiles)
            return profile.model_dump()
    raise HTTPException(status_code=404, detail="Profile not found")

@app.delete("/profiles/{profile_id}", tags=["Admin"])
async def delete_profile(profile_id: str):
    profiles = _load_profiles()
    new_profiles = [p for p in profiles if p["id"] != profile_id]
    if len(new_profiles) == len(profiles):
        raise HTTPException(status_code=404, detail="Profile not found")
    _save_profiles(new_profiles)
    return {"deleted": profile_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)




