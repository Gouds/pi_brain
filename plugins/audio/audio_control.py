
import pygame
from fastapi import FastAPI, HTTPException, File, UploadFile, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import os
from utils import mainconfig
import random

app = FastAPI()

# Initialize pygame
pygame.mixer.init()

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
        if os.path.exists(filepath):
            # Load the audio file
            pygame.mixer.music.load(filepath)
            # Play the audio file
            pygame.mixer.music.play()
            return {"message": f"Playing audio file: {filename}"}
        else:
            raise HTTPException(status_code=404, detail="Audio file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def audio_random_list():
    # return {"random_sounds": _Random_Sounds}
    return _Random_Sounds