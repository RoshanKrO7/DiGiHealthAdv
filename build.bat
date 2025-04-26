@echo off
echo Simple Build Script for DigiHealth

REM Set Node.js environment for OpenSSL compatibility
set NODE_OPTIONS=--openssl-legacy-provider

echo Building frontend...
call npm install
call npm run build

echo Build completed successfully!
echo.
echo To deploy to GitHub Pages, run:
echo set NODE_OPTIONS=--openssl-legacy-provider
echo npm run deploy
echo To start the development server, run: npm start 