@echo off
echo Starting Internship Management System Frontend...
echo.

REM Check if index.html exists
if not exist index.html (
    echo Error: index.html not found
    echo Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Try to start a simple HTTP server
echo Starting HTTP server...
echo Frontend will be available at: http://localhost:8000
echo.
echo Make sure the backend is running on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Try Python first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Python HTTP server...
    python -m http.server 8000
) else (
    REM Try Node.js http-server
    npx --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Using Node.js http-server...
        npx http-server -p 8000
    ) else (
        echo Error: No HTTP server found
        echo Please install Python or Node.js
        echo Or simply open index.html in your browser
        pause
        exit /b 1
    )
)
