# Pi Brain - Setup Guide

Pi Brain is a FastAPI-based control server for Raspberry Pi droids. It manages servos, audio, GPIO lighting, and scripted automation sequences.

---

## Requirements

| Requirement | Version |
|---|---|
| Python | 3.9 or later |
| pip | Bundled with Python |
| Raspberry Pi OS | Bullseye or later (Pi only) |

---

## Development Setup (Desktop / Non-Pi)

Use this to develop and browse the API on any machine without real hardware. All Pi-specific hardware calls are replaced by mocks that print to stdout.

### 1. Clone / navigate to the project

```bash
cd pi_brain
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate      # Linux / macOS
# venv\Scripts\activate       # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the development server

```bash
bash start_dev.sh
```

Or manually:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Browse the API

| URL | Description |
|---|---|
| http://localhost:8000/docs | Swagger UI - interactive API explorer |
| http://localhost:8000/redoc | ReDoc - clean API reference |
| http://localhost:8000/health | Health check endpoint |

---

## Raspberry Pi Deployment

### 1. Install system dependencies

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv python3-dev libsdl2-mixer-2.0-0
```

### 1b. Install arduino-cli (for in-app Arduino flashing)

```bash
# Download and install arduino-cli
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
# Move to a directory on PATH
sudo mv ~/bin/arduino-cli /usr/local/bin/

# Install the AVR core (needed to compile for Arduino Uno)
arduino-cli core install arduino:avr
```

This is a one-time setup. After this, use **Admin → Controller Config → Compile & Flash** to update the Arduino without the IDE.

### 2. Clone the project

```bash
git clone <your-repo-url> /home/pi/pi_brain
cd /home/pi/pi_brain
```

### 3. Create a virtual environment and install all dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-pi.txt
```

### 4. Configure the environment (optional)

```bash
cp .env.example .env
# Edit .env to set PI_BRAIN_CONFIG_DIR if you want a non-default config location
```

### 5. Run the server

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 6. Run on boot with systemd

Create `/etc/systemd/system/pi-brain.service`:

```ini
[Unit]
Description=Pi Brain API Server
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/pi_brain
ExecStart=/home/pi/pi_brain/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pi-brain
sudo systemctl start pi-brain
```

---

## React Frontend (recommended)

The React/Vite frontend lives in `frontend/` and replaces the legacy PHP frontend. It runs as static files served by a Vite dev server locally, and can be built as a static bundle for Pi deployment.

### Running locally for development

`bash start_dev.sh` starts **both** the backend API and the Vite dev server automatically.

Or start them separately:

```bash
# Terminal 1 — backend
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — frontend
cd frontend
npm install        # first time only
npm run dev
```

Then open **http://localhost:5173**

### Configure the API URL

The frontend reads `VITE_API_URL` from `frontend/.env`:

```bash
cd frontend
cp .env.example .env
# Edit .env to set VITE_API_URL if the API is on a different host
```

Default value is `http://localhost:8000`.

For a Pi deployment, set:
```
VITE_API_URL=http://192.168.x.x:8000
```

### Production build (deploy to Pi)

```bash
cd frontend
npm run build
# Copy dist/ to your web server root on the Pi
```

The built files in `frontend/dist/` are plain HTML/JS/CSS — serve them with any static file server (nginx, Apache, or Python's `http.server`).

---

## Web Controller (PHP Frontend — legacy)

The original PHP frontend lives in `www/` and is kept for reference. The React frontend above is the recommended option.

### Running locally for development

If PHP is installed:

```bash
cd www
php -S localhost:8080
```

Then open http://localhost:8080

### Configure the API URL

Edit `www/config.php` and update `$site_url` to point to the Pi Brain API:

```php
// Development (local machine)
$site_url = 'http://localhost:8000';

// Raspberry Pi (update with your Pi's IP)
$site_url = 'http://192.168.x.x:8000';
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PI_BRAIN_CONFIG_DIR` | `~/.pi_brain/` | Directory for runtime config (`main.cfg`) |

Set these in `.env` (copy from `.env.example`) or export them in your shell before starting.

---

## Configuration Files

| File | Description |
|---|---|
| `configs/servo_config.json` | I2C bus definitions and servo channel mappings |
| `configs/pin_config.json` | GPIO pin definitions for lighting / effects |
| `scripts/*.scr` | Automation scripts (sequences of servo, audio, sleep commands) |

---

## Hardware Mocks (Dev Mode)

When `RPi.GPIO`, `board`, `busio`, or `adafruit_servokit` are not installed, Pi Brain automatically loads mock replacements from the `mocks/` directory. No configuration is required — the app detects missing libraries at startup and falls back gracefully.

Mock behaviour:
- GPIO pin changes are printed to stdout
- Servo angle changes are printed to stdout
- I2C bus initialisation is a no-op
- Audio playback requires `pygame` and a working audio device; it will warn and continue if unavailable

---

## Project Structure

```
pi_brain/
├── app.py                  # FastAPI application and all API routes
├── configs/
│   ├── servo_config.json   # Servo and I2C bus configuration
│   └── pin_config.json     # GPIO pin configuration
├── frontend/               # React/Vite web frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example        # Copy to .env and set VITE_API_URL
│   └── src/
│       ├── App.jsx          # Layout shell + React Router
│       ├── config.js        # API URL from env
│       ├── api/client.js    # All fetch wrappers
│       ├── components/      # Header, Footer, SideMenu, VolumePopup
│       ├── pages/           # Home, Dome, Body, Audio, Scripts, …
│       └── styles/style.css
├── mocks/                  # Hardware stubs for development
│   ├── gpio.py             # RPi.GPIO mock
│   ├── board.py            # Adafruit board mock
│   ├── busio.py            # busio I2C mock
│   └── servokit.py         # ServoKit mock
├── plugins/
│   ├── audio/              # Pygame-based audio playback
│   ├── servo/              # I2C servo control (Adafruit ServoKit)
│   ├── script/             # .scr script execution engine
│   ├── dome/               # Dome servo helpers
│   └── body/               # Body servo helpers
├── scripts/                # Automation scripts (.scr files)
├── audio/                  # Sound files (.mp3 / .wav)
├── utils/
│   └── mainconfig.py       # Config file loader
├── www/                    # PHP web controller frontend (legacy)
├── requirements.txt        # Core Python dependencies
├── requirements-pi.txt     # Additional Pi hardware dependencies
├── start_dev.sh            # Development startup script (API + frontend)
└── SETUP.md                # This file
```

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'RPi'`**
The mock should have loaded automatically. Ensure you are running from the project root directory (`pi_brain/`) so Python can find the `mocks/` package.

**`pygame.error: No available audio device`**
No audio output is connected. Audio API calls will return errors but the server continues running normally.

**`SafeConfigParser` or `ConfigParser` errors**
Ensure you are running Python 3.9 or later. `SafeConfigParser` was removed in Python 3.12.

**Port 8000 already in use**
```bash
# Find and kill the process using port 8000
lsof -i :8000
kill <PID>
```

**Config directory permission error**
Set `PI_BRAIN_CONFIG_DIR` in your `.env` to a directory your user can write to:
```
PI_BRAIN_CONFIG_DIR=/tmp/pi_brain/
```
