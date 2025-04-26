@echo off
echo DigiHealth Development Server

REM Set Node.js environment for OpenSSL compatibility
set NODE_OPTIONS=--openssl-legacy-provider

echo Starting development server...
call npm start

pause 