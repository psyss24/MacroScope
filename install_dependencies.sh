#!/bin/bash

# MacroScope Dependencies Installation Script
# This script installs all required dependencies for both backend and frontend

echo "Installing MacroScope dependencies..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ All dependencies installed successfully!"
echo ""
echo "To start the application, run:"
echo "./restart_macroscope.sh"
echo ""
echo "Or start manually:"
echo "Backend: source venv/bin/activate && cd backend && python api/api_server.py"
echo "Frontend: cd frontend && npm start" 