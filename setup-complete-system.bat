@echo off
echo ========================================
echo Internship Management System Setup
echo ========================================
echo.

echo [1/6] Setting up database...
echo Running enhanced database setup...
call setup-enhanced-database.bat
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed!
    pause
    exit /b 1
)
echo Database setup completed successfully!
echo.

echo [2/6] Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Installing Node.js dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies!
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)
echo Backend dependencies ready!
echo.

echo [3/6] Starting backend server...
echo Starting backend server in background...
start "Backend Server" cmd /k "npm start"
timeout /t 3 /nobreak > nul
echo Backend server started!
echo.

echo [4/6] Setting up frontend...
cd ..\frontend
echo Frontend files are ready!
echo.

echo [5/6] Opening frontend...
echo Opening frontend in default browser...
start index.html
echo Frontend opened in browser!
echo.

echo [6/6] System Status Check...
echo Checking if backend is running...
timeout /t 5 /nobreak > nul
curl -s http://localhost:3000/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend server is running on http://localhost:3000
    echo ✓ API endpoints are available
) else (
    echo ⚠ Backend server may not be ready yet. Please wait a moment and refresh the frontend.
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo System Components:
echo - Database: Enhanced with new tables, views, and stored procedures
echo - Backend: Updated with new routes and API endpoints
echo - Frontend: Modern responsive interface with analytics
echo.
echo Access Points:
echo - Frontend: Open index.html in your browser
echo - Backend API: http://localhost:3000/api
echo - Health Check: http://localhost:3000/health
echo.
echo New Features Added:
echo - Student profiles with bio, social links, and preferences
echo - Company reviews and ratings system
echo - Advanced analytics and reporting
echo - Stored procedures for complex operations
echo - Enhanced skills management
echo - Real-time dashboard with charts
echo - Modern responsive UI with Bootstrap 5
echo.
echo Press any key to continue...
pause > nul
