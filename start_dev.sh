#!/bin/bash
# Pi Brain - development server startup
# Runs the FastAPI backend (port 8000) and the React/Vite frontend (port 5173)
# with hot reload. Hardware libraries are mocked automatically when not on a Pi.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env if it exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# ── Python backend ────────────────────────────────────────────────────────────

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install / upgrade dependencies quietly
echo "Checking Python dependencies..."
pip install -q -r requirements.txt

# ── React frontend ────────────────────────────────────────────────────────────

if [ -d "frontend" ]; then
    echo "Checking frontend dependencies..."
    cd frontend

    # Copy .env.example to .env if missing
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        echo "  Created frontend/.env from .env.example"
    fi

    # Install npm deps if node_modules is missing
    if [ ! -d "node_modules" ]; then
        echo "  Installing npm packages..."
        npm install
    fi

    cd "$SCRIPT_DIR"
fi

echo ""
echo "  Pi Brain starting..."
echo ""
echo "  Backend API:   http://localhost:8000"
echo "  API docs:      http://localhost:8000/docs"
echo "  Redoc:         http://localhost:8000/redoc"
echo "  Frontend:      http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# ── Start both servers ────────────────────────────────────────────────────────

# Start Vite in the background if frontend exists
VITE_PID=""
if [ -d "frontend" ]; then
    cd frontend
    npm run dev &
    VITE_PID=$!
    cd "$SCRIPT_DIR"
fi

# Trap Ctrl+C to kill both processes
trap "kill $VITE_PID 2>/dev/null; exit 0" INT TERM

# Start uvicorn in the foreground (keeps the script alive)
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
