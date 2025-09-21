@echo off
echo Starting Internship Management System Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist package.json (
    echo Error: package.json not found
    echo Please run this script from the backend directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if config.env exists
if not exist config.env (
    echo Warning: config.env not found
    echo Please create config.env with your database configuration
    echo See config.env.example for reference
    pause
)

REM Start the server
echo Starting server...
echo Backend will be available at: http://localhost:3000
echo API endpoints will be available at: http://localhost:3000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
