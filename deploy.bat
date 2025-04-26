@echo off
echo DigiHealth GitHub Pages Deployment Script

REM Set Node.js environment for OpenSSL compatibility
set NODE_OPTIONS=--openssl-legacy-provider

echo Running build and deploy...
call npm run deploy

echo.
echo Deployment complete!
echo Your app should be available at: https://RoshanKrO7.github.io/DiGiHealthAdv/
pause 