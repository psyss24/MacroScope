#!/bin/bash

# restart script used for local dev
# stops any ports running macrosocpe servers, then starts both backend and frontend

cd "$(dirname "$0")"

# kill a process by PID file
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

# kill backend and frontend by pid file if present
kill_by_pidfile backend/backend.pid
kill_by_pidfile frontend/frontend.pid

# kill any process on ports (that i use for developing)
echo "Killing any process on port 8000 (backend)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
echo "Killing any process on port 3000 (frontend)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo "Killing any process on port 3001 (alt frontend)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# check / install (if required) dependencies
if ! python3 -c "import flask" &> /dev/null; then
    echo "Flask is not installed. Installing Flask and Flask-CORS..."
    pip3 install flask flask-cors
fi
if ! python3 -c "import yfinance" &> /dev/null; then
    echo "yfinance is not installed. Installing yfinance..."
    pip3 install yfinance
fi

# start backend
echo "Starting the backend API server..."
cd backend
python3 api/api_server.py &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
cd ..

# wait for backend 
echo "Waiting for the backend API to start..."
MAX_RETRIES=10
RETRY_COUNT=0
API_READY=false
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Checking if API is ready (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    if curl -s "http://localhost:8000/api/health" | grep -q "ok"; then
        echo "API is ready!"
        API_READY=true
        break
    else
        echo "API not ready yet, waiting..."
        RETRY_COUNT=$((RETRY_COUNT+1))
        sleep 2
    fi

done
if [ "$API_READY" = false ]; then
    echo "Error: API did not respond to health check after $MAX_RETRIES attempts."
    echo "The frontend will still be started (but no data loaded in ofc)"
fi

# now start frontend
echo "Starting the frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
cd ..


cleanup() {
    echo "stoppingg servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill_by_pidfile backend/backend.pid
    kill_by_pidfile frontend/frontend.pid
    exit
}
trap cleanup SIGINT SIGTERM

echo "we are live :)"
echo "backend API server is running at http://localhost:8000"
echo "frontend is running at http://localhost:3000"

wait
