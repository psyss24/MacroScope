#!/bin/bash

# 🚀 Deployment Validation Script
# This script validates the deployment structure before deploying

set -e  # Exit on any error

echo "🔍 Validating deployment structure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "ERROR" ]; then
        echo -e "${RED}❌ $2${NC}"
    elif [ "$1" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    elif [ "$1" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
    else
        echo "ℹ️  $2"
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    print_status "ERROR" "Please run this script from the project root directory"
    exit 1
fi

# 1. Check for multiple docs folders
echo "📁 Checking for multiple docs folders..."
docs_folders=$(find . -name "docs" -type d | grep -v node_modules)
docs_count=$(echo "$docs_folders" | wc -l)

if [ $docs_count -gt 1 ]; then
    print_status "ERROR" "Multiple docs folders found!"
    echo "$docs_folders"
    print_status "ERROR" "Please clean up duplicate docs folders"
    exit 1
elif [ $docs_count -eq 0 ]; then
    print_status "WARNING" "No docs folder found. This might be expected for new projects."
else
    print_status "SUCCESS" "Found 1 docs folder: $(echo "$docs_folders")"
fi

# 2. Check for multiple CNAME files
echo "📄 Checking for multiple CNAME files..."
cname_files=$(find . -name "CNAME" -type f)
cname_count=$(echo "$cname_files" | wc -l)

if [ $cname_count -gt 1 ]; then
    print_status "ERROR" "Multiple CNAME files found!"
    echo "$cname_files"
    print_status "ERROR" "Please keep only one CNAME file in docs/"
    exit 1
elif [ $cname_count -eq 0 ]; then
    print_status "WARNING" "No CNAME file found. This might be expected for new projects."
else
    print_status "SUCCESS" "Found 1 CNAME file: $(echo "$cname_files")"
fi

# 3. Verify docs structure (if docs folder exists)
if [ -d "docs" ]; then
    echo "📋 Checking docs folder structure..."
    
    # Check if CNAME is in docs folder
    if [ -f "docs/CNAME" ]; then
        print_status "SUCCESS" "CNAME file found in docs/"
    else
        print_status "WARNING" "CNAME file not found in docs/"
    fi
    
    # Check for essential files
    if [ -f "docs/index.html" ]; then
        print_status "SUCCESS" "index.html found in docs/"
    else
        print_status "WARNING" "index.html not found in docs/"
    fi
    
    # Check for .nojekyll file
    if [ -f "docs/.nojekyll" ]; then
        print_status "SUCCESS" ".nojekyll file found in docs/"
    else
        print_status "WARNING" ".nojekyll file not found in docs/"
    fi
fi

# 4. Check frontend build configuration
if [ -d "frontend" ]; then
    echo "⚙️  Checking frontend build configuration..."
    
    if [ -f "frontend/package.json" ]; then
        homepage=$(grep -o '"homepage": "[^"]*"' frontend/package.json | cut -d'"' -f4)
        if [ "$homepage" = "https://saadsaqib.dev/MacroScope/" ]; then
            print_status "SUCCESS" "Homepage configured correctly"
        else
            print_status "WARNING" "Homepage might be incorrect: $homepage"
        fi
    else
        print_status "WARNING" "frontend/package.json not found"
    fi
fi

# 5. Check deploy script
if [ -f "deploy-main.sh" ]; then
    echo "📜 Checking deploy script..."
    
    if grep -q "cp -r build/\* ../docs/" deploy-main.sh; then
        print_status "SUCCESS" "Deploy script copies to correct docs folder"
    else
        print_status "WARNING" "Deploy script might not copy to correct location"
    fi
else
    print_status "WARNING" "deploy-main.sh not found"
fi

# 6. Check git status
echo "🔍 Checking git status..."
if git status --porcelain | grep -q "docs/"; then
    print_status "SUCCESS" "docs/ folder has changes to commit"
else
    print_status "WARNING" "No changes in docs/ folder"
fi

# 7. Check if build would work
if [ -d "frontend" ]; then
    echo "🔨 Testing build process..."
    
    # Check if node_modules exists
    if [ -d "frontend/node_modules" ]; then
        print_status "SUCCESS" "node_modules found"
    else
        print_status "WARNING" "node_modules not found - run 'npm install' in frontend/"
    fi
    
    # Check if build script exists
    if [ -f "frontend/package.json" ] && grep -q '"build"' frontend/package.json; then
        print_status "SUCCESS" "Build script found in package.json"
    else
        print_status "WARNING" "Build script not found in package.json"
    fi
fi

echo ""
print_status "SUCCESS" "Validation complete! 🎉"

# Summary
echo ""
echo "📊 Summary:"
echo "  • Docs folders: $docs_count"
echo "  • CNAME files: $cname_count"
echo "  • Ready to deploy: $([ $docs_count -eq 1 ] && [ $cname_count -eq 1 ] && echo "YES" || echo "NO")"

if [ $docs_count -eq 1 ] && [ $cname_count -eq 1 ]; then
    echo ""
    print_status "SUCCESS" "✅ Deployment structure is valid! You can safely deploy."
    echo ""
    echo "🚀 To deploy, run:"
    echo "   ./deploy-main.sh"
else
    echo ""
    print_status "ERROR" "❌ Please fix the issues above before deploying."
    exit 1
fi 