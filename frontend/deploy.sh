#!/bin/bash

# Frontend Deployment Script for GitHub Pages
echo "🚀 Deploying Frontend to GitHub Pages..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the frontend directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the production version
echo "📦 Building production version..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

echo "✅ Build successful!"

# Move build files to root for GitHub Pages
echo "📁 Moving build files to root directory..."
cp -r build/* ../

# Add all files to git
echo "📝 Adding files to git..."
git add -A

# Commit the build
echo "💾 Committing build files..."
git commit -m "Deploy frontend to GitHub Pages - $(date)"

# Push to main branch
echo "🚀 Pushing to main branch..."
git push origin main

echo "✅ Frontend deployed to GitHub Pages!"
echo "🌐 Your app should be available at: https://saadsaqib.dev/macroscope"
echo ""
echo "Note: GitHub Pages may take a few minutes to update" 