#!/bin/bash
# Build and deploy script for DigiHealth

# Stop on errors
set -e

echo "===== DigiHealth Build and Deploy Script ====="
echo "This script will build and prepare the project for deployment"

# Check environment
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "Using Node.js $NODE_VERSION"
echo "Using npm $NPM_VERSION"

# Frontend Build
echo -e "\n===== Building Frontend ====="
echo "Installing dependencies..."
npm install

echo "Building React application..."
npm run build

echo "Frontend build complete"

# Backend Build
echo -e "\n===== Building Backend ====="
cd digihealth-backend

echo "Installing backend dependencies..."
npm install

# Create the uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
  mkdir uploads
  echo "Created uploads directory"
fi

# Test backend connection to OpenAI API
echo -e "\n===== Testing Backend ====="
echo "Running backend diagnostics..."
node debug.js

echo -e "\n===== Build Complete ====="
echo "✅ Frontend build available in ./build directory"
echo "✅ Backend ready for deployment"

echo -e "\n===== Deployment Instructions ====="
echo "To deploy the frontend to Render:"
echo "1. Create a new Static Site service in Render"
echo "2. Connect your GitHub repository"
echo "3. Set the build command to: npm install && npm run build"
echo "4. Set the publish directory to: build"

echo -e "\nTo deploy the backend to Render:"
echo "1. Create a new Web Service in Render"
echo "2. Connect your GitHub repository"
echo "3. Set the build command to: cd digihealth-backend && npm install"
echo "4. Set the start command to: cd digihealth-backend && npm start"
echo "5. Add the OPENAI_API_KEY environment variable in the Environment section"

echo -e "\nTo test your deployment:"
echo "1. Visit your frontend URL"
echo "2. Check the backend health endpoint at /api/debug" 