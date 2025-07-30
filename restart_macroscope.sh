#!/bin/bash

# Restart MacroScope API server and frontend
# This script stops any running MacroScope servers, then starts both backend and frontend

cd "$(dirname "$0")"

# Function to kill a process by PID file
kill_by_pidfile() {
    PIDFILE="$1"
    if [ -f "$PIDFILE" ]; then
        PID=$(cat "$PIDFILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Killing process $PID from $PIDFILE"
            kill $PID 2>/dev/null || true
        fi
        rm "$PIDFILE"
    fi
}

# Kill backend and frontend by PID file if present
kill_by_pidfile backend/backend.pid
kill_by_pidfile frontend/frontend.pid

# Kill any process on common ports
echo "Killing any process on port 8000 (backend)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
echo "Killing any process on port 3000 (frontend)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo "Killing any process on port 3001 (alt frontend)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Check and install dependencies
if ! python3 -c "import flask" &> /dev/null; then
    echo "Flask is not installed. Installing Flask and Flask-CORS..."
    pip3 install flask flask-cors
fi
if ! python3 -c "import yfinance" &> /dev/null; then
    echo "yfinance is not installed. Installing yfinance..."
    pip3 install yfinance
fi

# Start backend
echo "Starting the backend API server..."
cd backend
python3 api_server.py &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
cd ..

# Wait for backend health
echo "Waiting for the backend API to start..."
MAX_RETRIES=10
RETRY_COUNT=0
API_READY=false
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Checking if API is ready (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    if curl -s "http://localhost:8000/api/health" | grep -q "ok"; then
        echo "✅ API is ready!"
        API_READY=true
        break
    else
        echo "API not ready yet, waiting..."
        RETRY_COUNT=$((RETRY_COUNT+1))
        sleep 2
    fi

done
if [ "$API_READY" = false ]; then
    echo "⚠️ Error: API did not respond to health check after $MAX_RETRIES attempts."
    echo "The frontend will still be started, but it will not function correctly without the API."
    echo "Please ensure the backend API server is running and accessible."
fi

# Start frontend
echo "Starting the frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
cd ..

# Cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill_by_pidfile backend/backend.pid
    kill_by_pidfile frontend/frontend.pid
    exit
}
trap cleanup SIGINT SIGTERM

echo "MacroScope is running!"
echo "Backend API server is running at http://localhost:8000"
echo "Frontend is running at http://localhost:3000"
echo "Press Ctrl+C to stop both servers"

wait