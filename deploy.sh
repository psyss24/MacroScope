#!/bin/bash

# Deployment script for MacroScope
# This script helps deploy both backend and frontend

echo "🚀 MacroScope Deployment Script"
echo "================================"

# Function to deploy backend to Railway
deploy_backend() {
    echo "📦 Deploying backend to Railway..."
    echo "⚠️  Backend deployment requires separate repository"
    echo "   Please deploy from your backend repository directly"
    echo "   or update this script with the correct backend repo path"
    echo ""
    echo "Expected backend repository structure:"
    echo "   - Backend code in separate repo"
    echo "   - Railway project connected to that repo"
    echo "   - Deploy using: cd /path/to/backend-repo && railway up"
}

# Function to deploy frontend to GitHub Pages
deploy_frontend() {
    echo "🌐 Deploying frontend to GitHub Pages from main branch..."
    cd frontend
    
    # Use the main branch deployment script
    ./deploy-main.sh
    
    cd ..
    echo "✅ Frontend deployed to GitHub Pages"
}

# Function to deploy both
deploy_all() {
    echo "🔄 Deploying both backend and frontend..."
    deploy_backend
    deploy_frontend
    echo "🎉 Deployment complete!"
}

# Function to check deployment status
check_status() {
    echo "🔍 Checking deployment status..."
    
    # Check backend health
    echo "Backend health check:"
    curl -s https://macroscope-backend-production.up.railway.app:8080/api/health || echo "❌ Backend not responding"
    
    # Check frontend
    echo "Frontend status:"
    curl -s https://saadsaqib.dev/macroscope | head -5 || echo "❌ Frontend not responding"
}

# Main script logic
case "${1:-help}" in
    "backend")
        deploy_backend
        ;;
    "frontend")
        deploy_frontend
        ;;
    "all")
        deploy_all
        ;;
    "status")
        check_status
        ;;
    "help"|*)
        echo "Usage: $0 [backend|frontend|all|status|help]"
        echo ""
        echo "Commands:"
        echo "  backend  - Deploy only the backend to Railway"
        echo "  frontend - Deploy only the frontend to GitHub Pages"
        echo "  all      - Deploy both backend and frontend"
        echo "  status   - Check deployment status"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 backend   # Deploy backend only"
        echo "  $0 all       # Deploy both"
        echo "  $0 status    # Check status"
        ;;
esac 