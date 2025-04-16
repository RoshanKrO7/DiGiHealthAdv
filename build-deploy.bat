@echo off
REM Build and deploy script for DigiHealth

echo ===== DigiHealth Build and Deploy Script =====
echo This script will build and prepare the project for deployment

REM Check environment
echo.
echo ===== Environment Info =====
node -v
echo Node.js version above
npm -v
echo npm version above

REM Frontend Build
echo.
echo ===== Building Frontend =====
echo Installing dependencies...
call npm install

echo Building React application...
call npm run build

echo Frontend build complete

REM Backend Build
echo.
echo ===== Building Backend =====
cd digihealth-backend

echo Installing backend dependencies...
call npm install

REM Create the uploads directory if it doesn't exist
if not exist uploads (
  mkdir uploads
  echo Created uploads directory
)

REM Test backend connection to OpenAI API
echo.
echo ===== Testing Backend =====
echo Running backend diagnostics...
call node debug.js

echo.
echo ===== Build Complete =====
echo ✅ Frontend build available in ./build directory
echo ✅ Backend ready for deployment

echo.
echo ===== Deployment Instructions =====
echo To deploy the frontend to Render:
echo 1. Create a new Static Site service in Render
echo 2. Connect your GitHub repository
echo 3. Set the build command to: npm install ^&^& npm run build
echo 4. Set the publish directory to: build

echo.
echo To deploy the backend to Render:
echo 1. Create a new Web Service in Render
echo 2. Connect your GitHub repository
echo 3. Set the build command to: cd digihealth-backend ^&^& npm install
echo 4. Set the start command to: cd digihealth-backend ^&^& npm start
echo 5. Add the OPENAI_API_KEY environment variable in the Environment section

echo.
echo To test your deployment:
echo 1. Visit your frontend URL
echo 2. Check the backend health endpoint at /api/debug

echo.
pause 