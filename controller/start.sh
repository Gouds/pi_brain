#!/bin/bash
# Pi Brain Controller — Start Script
# Runs from the project root (pi_brain/).
# Starts the mini backend (port 8001) and the serial bridge + kiosk launcher.

cd "$(dirname "$0")/.." || exit 1

VENV="venv"
PYTHON="$VENV/bin/python"
UVICORN="$VENV/bin/uvicorn"

# Create venv and install if needed
if [ ! -f "$PYTHON" ]; then
  echo "[start] Creating virtual environment..."
  python3 -m venv "$VENV"
fi

if ! "$PYTHON" -c "import fastapi" 2>/dev/null; then
  echo "[start] Installing controller dependencies..."
  "$VENV/bin/pip" install -r controller/requirements.txt
fi

echo "[start] Starting controller mini-backend on port 8001..."
"$UVICORN" controller.server:app --host 0.0.0.0 --port 8001 &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

echo "[start] Starting serial bridge and kiosk..."
"$PYTHON" controller/controller.py "$@"

# If controller.py exits, stop the server too
kill $SERVER_PID 2>/dev/null
