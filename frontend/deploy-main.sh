#!/bin/bash
# Frontend Deployment Script for GitHub Pages
echo "🚀 Deploying frontend to GitHub Pages from main branch..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the frontend directory"
    exit 1
fi

echo "📦 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔧 Copying build to docs folder..."
rm -rf ../docs
cp -r build ../docs

echo "🔧 Copying 404.html for SPA routing..."
cp public/404.html ../docs/404.html

echo "📝 Updating index.html for GitHub Pages..."
# Find the generated JS and CSS filenames
JS_FILE=$(find ../docs/static/js -name "main.*.js" | head -1 | xargs basename)
CSS_FILE=$(find ../docs/static/css -name "main.*.css" | head -1 | xargs basename)

echo "Found JS file: $JS_FILE"
echo "Found CSS file: $CSS_FILE"

# Update the index.html file with the correct filenames
sed -i '' "s/main\.[a-zA-Z0-9]*\.js/$JS_FILE/g" ../docs/index.html
sed -i '' "s/main\.[a-zA-Z0-9]*\.css/$CSS_FILE/g" ../docs/index.html

# Make all paths relative (remove leading slashes)
sed -i '' 's|src="/static/|src="static/|g' ../docs/index.html
sed -i '' 's|href="/static/|href="static/|g' ../docs/index.html
sed -i '' 's|src="/favicon.ico|src="favicon.ico|g' ../docs/index.html
sed -i '' 's|href="/manifest.json|href="manifest.json|g' ../docs/index.html

# Fix any remaining absolute paths with /MacroScope/ prefix
sed -i '' 's|src="/MacroScope/static/|src="static/|g' ../docs/index.html
sed -i '' 's|href="/MacroScope/static/|href="static/|g' ../docs/index.html

echo "� Updating 404.html paths for production..."
# Update 404.html to use the built static files
if [ -f "../docs/404.html" ]; then
    # Find the generated JS and CSS filenames from index.html
    JS_FILE=$(grep -o 'static/js/main\.[a-zA-Z0-9]*\.js' ../docs/index.html | head -1)
    CSS_FILE=$(grep -o 'static/css/main\.[a-zA-Z0-9]*\.css' ../docs/index.html | head -1)
    
    if [ -n "$JS_FILE" ] && [ -n "$CSS_FILE" ]; then
        echo "Adding built assets to 404.html..."
        # Insert CSS and JS links before closing head tag
        sed -i '' "s|</head>|    <link rel=\"stylesheet\" href=\"$CSS_FILE\">\n    <script defer src=\"$JS_FILE\"></script>\n</head>|" ../docs/404.html
    fi
fi

echo "�📁 Creating .nojekyll file..."
touch ../docs/.nojekyll

echo "🚀 Committing and pushing to GitHub..."
git add ../docs/
git commit -m "Deploy frontend to GitHub Pages - $(date)"
git push origin main

echo "✅ Frontend deployed to GitHub Pages!"
echo "🌐 Your site should be available at: https://saadsaqib.dev/MacroScope/"
echo ""
echo "Note: GitHub Pages may take a few minutes to update" 