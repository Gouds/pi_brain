import pygame
from fastapi import FastAPI, HTTPException, File, UploadFile, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import os
from utils import mainconfig
import glob
import random
import subprocess
import threading
import csv
import time
import urllib.request
import urllib.error
import urllib.parse
import collections
import asyncio 
import uuid  # Import uuid module
from concurrent.futures import ThreadPoolExecutor
import aiohttp


async def script_list():
    try:
        # List script files in the 'script' directory
        script_files = [filename for filename in os.listdir("scripts") if filename.endswith((".scr"))]
        # return {"script": script_files}
        return script_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    


# Dictionary to hold information about running scripts
running_scripts = {}

async def run_script(script_name: str, loop: int, script_id: str):
    try:
        # Construct the path to the script file
        script_path = f"scripts/{script_name}.scr"
        print("Script Path:", script_path)  # Debug output

        # Check if the script file exists
        if not os.path.exists(script_path):
            raise FileNotFoundError

        # Read the script file
        with open(script_path, "r") as script_file:
            script_content = script_file.readlines()

        # Store the script information in the running_scripts dictionary
        #running_scripts[script_id] = {"script_name": script_name, "status": "running"}
        running_scripts[script_id] = {"script_name": script_name, "status": "running"}

        # Parse and execute each command in the script
        for line in script_content:
            command = line.strip().split(" ")
            print("Executing command:", line.strip())  # Debug output
            if command[0] == "audio":
                async with aiohttp.ClientSession() as session:
                    if command[1] == "play":
                        async with session.get(f"http://localhost:8000/audio/{command[2]}") as response:
                            print(await response.text())
                    elif command[1] == "random":
                        async with session.get(f"http://localhost:8000/audio/random/{command[2]}") as response:
                            print(await response.text())
            elif command[0] == "servo":
                # Handle servo commands
                async with aiohttp.ClientSession() as session:
                    if command[1] == "position":
                        bus_name = command[2]
                        servo_id = command[3]
                        position = command[4]
                        async with session.get(f"http://localhost:8000/servos/{bus_name}/{servo_id}/move?position={position}") as response:
                            print(await response.text())
                    elif command[1] == "open":
                        servo_name = command[2]
                        async with session.get(f"http://localhost:8000/servo/open/{servo_name}") as response:
                            print(await response.text())
                    elif command[1] == "close":
                        servo_name = command[2]
                        async with session.get(f"http://localhost:8000/servo/close/{servo_name}") as response:
                            print(await response.text())

            elif command[0] == "dome":
                # Handle dome commands
                pass  # Implement dome command handling
            elif command[0] == "holoprojector":
                # Handle holoprojector commands
                pass  # Implement holoprojector command handling
            elif command[0] == "body":
                # Handle body commands
                pass  # Implement body command handling
            elif command[0] == "gpio":
                # Handle GPIO commands
                pass  # Implement GPIO command handling
            elif command[0] == "sleep":
                # Sleep command
                await asyncio.sleep(int(command[1]))
            # Add handling for other commands here
            else:
                # Unknown command
                raise HTTPException(status_code=400, detail=f"Unknown command '{command[0]}' in script")

            # Check if the script has been stopped
            if script_id not in running_scripts:
                break

        # If loop is enabled and the script hasn't been stopped, restart the script
        if int(loop) == 1 and script_id in running_scripts:
            await run_script(script_name, loop, script_id)

        # Remove the script information from the running_scripts dictionary
        if script_id in running_scripts:
            del running_scripts[script_id]

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Script '{script_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def script_start_handler(script_name: str, loop: int, background_tasks: BackgroundTasks):
    # Generate a unique ID for the script
    script_id = str(uuid.uuid4())
    # Run the script in a background task
    background_tasks.add_task(run_script, script_name, loop, script_id)
    return {"script_id": script_id, "message": f"Script '{script_name}' execution started"}



# Function to stop a single script
async def stop_script(script_id: str):
    if script_id in running_scripts:
        # Add logic here to stop the script if needed
        del running_scripts[script_id]
        return {"message": f"Script '{script_id}' stopped successfully"}
    else:
        raise HTTPException(status_code=404, detail=f"Script '{script_id}' not found")

# Function to stop all running scripts
async def stop_all_scripts():
    for script_id in list(running_scripts.keys()):
        # Add logic here to stop each script if needed
        del running_scripts[script_id]
    return {"message": "All running scripts stopped successfully"}
    
    
