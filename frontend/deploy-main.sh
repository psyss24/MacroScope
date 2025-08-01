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

echo "✅ Build successful!"

# Copy build files to docs folder
echo "📁 Copying build files to docs folder..."
cp -r build/* ../docs/

# Go back to root directory
cd ..

# Automatically fix asset paths in index.html to be relative
echo "🔧 Fixing asset paths in index.html..."

# Find the actual JS and CSS file names
JS_FILE=$(find docs/static/js -name "main.*.js" | head -1 | sed 's|docs/static/js/||')
CSS_FILE=$(find docs/static/css -name "main.*.css" | head -1 | sed 's|docs/static/css/||')

if [ -n "$JS_FILE" ] && [ -n "$CSS_FILE" ]; then
    echo "Found JS file: $JS_FILE"
    echo "Found CSS file: $CSS_FILE"
    
    # Replace the file names in index.html
    sed -i '' "s|src=\"/static/js/main.[^\"]*\.js\"|src=\"static/js/$JS_FILE\"|g" docs/index.html
    sed -i '' "s|href=\"/static/css/main.[^\"]*\.css\"|href=\"static/css/$CSS_FILE\"|g" docs/index.html
else
    echo "⚠️  Could not find JS or CSS files, using fallback method"
    # Fallback: just make paths relative
    sed -i '' 's|src="/static/|src="static/|g' docs/index.html
    sed -i '' 's|href="/static/|href="static/|g' docs/index.html
fi

# Fix other asset paths
sed -i '' 's|href="/favicon.ico"|href="favicon.ico"|g' docs/index.html
sed -i '' 's|href="/logo192.png"|href="logo192.png"|g' docs/index.html
sed -i '' 's|href="/manifest.json"|href="manifest.json"|g' docs/index.html

# Add all docs files to git
echo "📝 Adding docs files to git..."
git add docs/

# Commit the changes
echo "💾 Committing changes..."
git commit -m "Deploy frontend to GitHub Pages - $(date)"

# Push to main branch
echo "🚀 Pushing to main branch..."
git push origin main

echo "✅ Frontend deployed to GitHub Pages!"
echo "🌐 Your app should be available at: https://saadsaqib.dev/MacroScope/"
echo ""
echo "Note: GitHub Pages may take 2-5 minutes to update" 