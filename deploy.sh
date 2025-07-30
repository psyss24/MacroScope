#!/bin/bash

# MacroScope Deployment Script
# This script helps deploy both frontend and backend

set -e

echo "🚀 Starting MacroScope deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/requirements.txt" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend to GitHub Pages..."
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Build and deploy
    print_status "Building and deploying frontend..."
    npm run deploy:prod
    
    cd ..
    print_status "Frontend deployed successfully!"
}

# Function to deploy backend
deploy_backend() {
    print_status "Backend should be deployed to Railway separately."
    print_status "Please follow these steps:"
    echo "1. Go to https://railway.app"
    echo "2. Create a new project"
    echo "3. Connect your GitHub repository"
    echo "4. Set the root directory to 'backend'"
    echo "5. Add environment variables from backend/env.example"
    echo "6. Deploy!"
}

# Main deployment logic
case "${1:-all}" in
    "frontend")
        deploy_frontend
        ;;
    "backend")
        deploy_backend
        ;;
    "all")
        print_status "Deploying both frontend and backend..."
        deploy_frontend
        echo
        deploy_backend
        ;;
    *)
        print_error "Usage: $0 [frontend|backend|all]"
        exit 1
        ;;
esac

print_status "Deployment process completed!"
print_status "Frontend will be available at: https://saadsaqib.dev/macroscope"
print_status "Backend will be available at: https://your-railway-app.up.railway.app" 