import pygame
from fastapi import FastAPI, HTTPException, File, UploadFile, Query
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



async def script_list():
    try:
        # List script files in the 'script' directory
        script_files = [filename for filename in os.listdir("scripts") if filename.endswith((".scr"))]
        # return {"script": script_files}
        return script_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    

    
    
