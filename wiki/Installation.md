# Installation

Pi Brain can be run in two modes:

| Mode | Where | Use case |
|---|---|---|
| **Development** | Your laptop / desktop | Building, testing, and making changes |
| **Production** | Raspberry Pi | Running on your robot |

---

## Prerequisites

| Requirement | Dev | Pi |
|---|---|---|
| Python 3.10+ | ✓ | ✓ |
| Node.js 18+ | ✓ | Only needed to build the frontend |
| Git | ✓ | ✓ |
| Raspberry Pi OS (Bookworm recommended) | — | ✓ |

---

## 1. Clone the Repository

```bash
git clone https://github.com/Gouds/pi_brain.git
cd pi_brain
```

---

## 2. Development Setup (laptop / desktop)

The `start_dev.sh` script handles everything — it creates a virtual environment, installs Python dependencies, installs npm packages, and starts both servers with hot reload.

```bash
bash start_dev.sh
```

Once running:

| Service | URL |
|---|---|
| Frontend (React / Vite) | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Interactive API docs | http://localhost:8000/docs |

Press **Ctrl+C** to stop both servers.

> **Hardware mocks** — on a non-Pi machine, `RPi.GPIO`, `pygame`, and the servo kit are automatically replaced with mock implementations. You can use the full UI without any hardware attached. Audio playback falls back to the browser.

---

## 3. Raspberry Pi Setup

### 3a. Python dependencies

Install the base dependencies plus the Pi-specific hardware libraries:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-pi.txt
```

`requirements-pi.txt` adds:
- `RPi.GPIO` — GPIO control
- `adafruit-circuitpython-servokit` — I²C servo control
- `pygame` — audio playback

### 3b. Build the frontend

The Pi serves the React app as static files from FastAPI, so you need to build it first. Do this on your dev machine (or any machine with Node.js):

```bash
cd frontend
npm install
npm run build
cd ..
```

Copy the resulting `frontend/dist/` folder to the Pi alongside `app.py`.

### 3c. Serve the built frontend

Add the following to `app.py` to serve the static files (if not already present):

```python
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
```

### 3d. Run the backend

```bash
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000
```

Access the UI from any device on your network at `http://<pi-ip>:8000`.

### 3e. Auto-start on boot (optional)

Create a systemd service so Pi Brain starts automatically:

```ini
# /etc/systemd/system/pibrain.service
[Unit]
Description=Pi Brain
After=network.target

[Service]
WorkingDirectory=/home/pi/pi_brain
ExecStart=/home/pi/pi_brain/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable pibrain
sudo systemctl start pibrain
```

---

## Directory Structure

```
pi_brain/
├── app.py                  # FastAPI backend — all API routes
├── start_dev.sh            # Dev startup script
├── requirements.txt        # Python deps (dev + pi)
├── requirements-pi.txt     # Pi-only hardware deps
├── configs/
│   ├── servo_config.json   # I²C bus and servo definitions
│   ├── pin_config.json     # GPIO pin definitions
│   └── profiles.json       # User robot profiles (created on first save)
├── profiles/               # Per-robot data (created at runtime)
│   └── {robot-id}/
│       ├── audio/          # Uploaded audio files
│       ├── scripts/        # Uploaded .scr scripts
│       ├── audio_tags.json
│       ├── audio_categories.json
│       └── servo_config.json
├── mocks/                  # Hardware stubs used in dev mode
├── plugins/                # Audio, servo, script control modules
└── frontend/
    ├── src/                # React source
    └── dist/               # Built output (after npm run build)
```
