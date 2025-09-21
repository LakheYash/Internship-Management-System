@echo off
echo ========================================
echo  Internship Management System Launcher
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo Starting the Internship Management System...
echo.

REM Start backend in a new window
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && start.bat"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && start.bat"

echo.
echo ========================================
echo  System Started Successfully!
echo ========================================
echo.
echo Backend API: http://localhost:3000
echo Frontend UI: http://localhost:8000
echo.
echo Default Login Credentials:
echo Username: admin
echo Password: password
echo.
echo Press any key to exit this launcher...
pause >nul
