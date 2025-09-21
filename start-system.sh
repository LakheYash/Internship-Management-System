#!/bin/bash

echo "========================================"
echo " Internship Management System Launcher"
echo "========================================"
echo

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo "Starting the Internship Management System..."
echo

# Start backend in background
echo "Starting Backend Server..."
cd backend
gnome-terminal --title="Backend Server" -- bash -c "./start.sh; exec bash" 2>/dev/null || \
xterm -title "Backend Server" -e "./start.sh" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && ./start.sh"' 2>/dev/null || \
echo "Please start the backend manually: cd backend && ./start.sh"

cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting Frontend Server..."
cd frontend
gnome-terminal --title="Frontend Server" -- bash -c "./start.sh; exec bash" 2>/dev/null || \
xterm -title "Frontend Server" -e "./start.sh" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && ./start.sh"' 2>/dev/null || \
echo "Please start the frontend manually: cd frontend && ./start.sh"

cd ..

echo
echo "========================================"
echo " System Started Successfully!"
echo "========================================"
echo
echo "Backend API: http://localhost:3000"
echo "Frontend UI: http://localhost:8000"
echo
echo "Default Login Credentials:"
echo "Username: admin"
echo "Password: password"
echo
echo "Press Enter to exit this launcher..."
read
