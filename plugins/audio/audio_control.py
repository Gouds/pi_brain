
from fastapi import FastAPI, HTTPException, File, UploadFile, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import os
from utils import mainconfig
import glob
import random
import subprocess

app = FastAPI()

try:
    import pygame
    pygame.mixer.init()
    _AUDIO_AVAILABLE = True
except (ImportError, Exception) as e:
    print(f"[DEV MODE] pygame not available ({e}) - audio playback will be mocked")
    _AUDIO_AVAILABLE = False

class AudioFile(BaseModel):
    filename: str
    
class AudioTrigger(BaseModel):
    filename: str

_Random_Sounds = ['alarm',
                  'happy',
                  'hum',
                  'misc',
                  'quote',
                  'razz',
                  'sad',
                  'sent',
                  'ooh',
                  'proc',
                  'whistle',
                  'scream']



async def audio_list():
    try:
        # List audio files in the 'audio' directory
        audio_files = [filename for filename in os.listdir("audio") if filename.endswith((".wav", ".mp3", ".ogg"))]
        # return {"audio_files": audio_files}
        return audio_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def audio_play(filename: str):
    try:
        filepath = os.path.join("audio", filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Audio file not found")
        if not _AUDIO_AVAILABLE:
            print(f"[MOCK AUDIO] would play: {filename}")
            return {"message": f"[DEV MODE] Would play: {filename}"}
        pygame.mixer.music.load(filepath)
        pygame.mixer.music.play()
        return {"message": f"Playing audio file: {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def audio_random_list():
    # return {"random_sounds": _Random_Sounds}
    return _Random_Sounds


async def audio_random_play(prefix_name: str):
    try:
        # Convert the prefix to lowercase
        prefix_name_lower = prefix_name.lower()
        
        if prefix_name_lower not in [p.lower() for p in _Random_Sounds]:
            raise HTTPException(status_code=400, detail="Invalid prefix")
    
        # List audio files in the 'audio' directory
        audio_files = [filename for filename in os.listdir("audio") if filename.endswith((".wav", ".mp3", ".ogg"))]
        # Filter files with the given prefixes
        #filtered_files = [file for file in audio_files for prefix in _Random_Sounds if file.startswith(prefix)]
        filtered_files = [file for file in audio_files for prefix in _Random_Sounds if file.lower().startswith(prefix_name_lower)]
        if not filtered_files:
            raise HTTPException(status_code=404, detail="No matching audio files found")
        # Select a random file from the filtered list
        random_file = random.choice(filtered_files)
        
        filepath = os.path.join("audio", random_file)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Audio file not found")
        if not _AUDIO_AVAILABLE:
            print(f"[MOCK AUDIO] would play random: {random_file}")
            return {"message": f"[DEV MODE] Would play: {random_file}"}
        pygame.mixer.music.load(filepath)
        pygame.mixer.music.play()
        return {"message": f"Playing random audio file: {random_file}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_volume():
    try:
        # Execute the 'amixer' command to get the volume information
        result = subprocess.run(['amixer', 'get', 'Master'], capture_output=True, text=True)
        
        # Check if the command executed successfully
        if result.returncode != 0:
            error_output = result.stderr.strip()
            return f"Failed to get volume information. Error: {error_output}"
        
        # Extract the volume level from the command output
        output_lines = result.stdout.split('\n')
        for line in output_lines:
            if 'Front Left:' in line:
                volume_info = line.strip().split()
                # Search for the volume level
                for item in volume_info:
                    if '%' in item:
                        current_volume = item.replace('[', '').replace(']', '').replace('%', '')
                        return current_volume

        # If volume information is not found in the output, return an error
        return "Volume information not found"
    except Exception as e:
        return str(e)
    
async def set_volume(volume_level: int):
    try:
        # Execute the 'amixer' command to set the volume
        result = subprocess.run(['amixer', 'set', 'Master', f"{volume_level}%"], capture_output=True, text=True)
        
        # Check if the command executed successfully
        if result.returncode != 0:
            error_output = result.stderr.strip()
            return {"error": f"Failed to set volume. Error: {error_output}"}
        
        return {"message": f"Volume set to {volume_level}%"}
    except Exception as e:
        return {"error": str(e)}