#!/bin/bash

# Deploy frontend to GitHub Pages from main branch
echo "🚀 Deploying frontend to GitHub Pages from main branch..."

# Build the production version
echo "📦 Building production version..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

# Add build folder to git
echo "📝 Adding build files to git..."
git add build/

# Commit the build
echo "💾 Committing build files..."
git commit -m "Deploy frontend to GitHub Pages - $(date)"

# Push to main branch
echo "🚀 Pushing to main branch..."
git push origin main

echo "✅ Frontend deployed to GitHub Pages from main branch!"
echo "🌐 Your app should be available at: https://saadsaqib.dev/macroscope" 