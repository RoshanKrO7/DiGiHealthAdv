@echo off
REM GitHub Pages Deployment Script for DigiHealth

echo ===== DigiHealth GitHub Pages Deployment =====

REM Set environment variable to fix OpenSSL issues with Node.js
set NODE_OPTIONS=--openssl-legacy-provider

REM Check if gh-pages package is installed
call npm list gh-pages --depth=0 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Installing gh-pages package...
  call npm install --save-dev gh-pages
)

REM Check if shx package is installed
call npm list shx --depth=0 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Installing shx package...
  call npm install --save-dev shx
)

echo Building React app with HashRouter for GitHub Pages...
call npm run build

echo Creating 404.html in build directory...
call npm run postbuild

echo Deploying to GitHub Pages...
call npm run deploy

echo ===== Deployment Complete =====
echo Your app should be available at https://roshankro7.github.io/DiGiHealthAdv/
echo If you encounter 404 errors when refreshing, make sure you:
echo 1. Use HashRouter in App.js
echo 2. Have 404.html and index.html with proper redirect scripts
echo 3. Use relative links in your app

pause 