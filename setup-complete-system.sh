#!/bin/bash

echo "========================================"
echo "Internship Management System Setup"
echo "========================================"
echo

echo "[1/6] Setting up database..."
echo "Running enhanced database setup..."
./setup-enhanced-database.sh
if [ $? -ne 0 ]; then
    echo "ERROR: Database setup failed!"
    exit 1
fi
echo "Database setup completed successfully!"
echo

echo "[2/6] Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install backend dependencies!"
        exit 1
    fi
else
    echo "Backend dependencies already installed."
fi
echo "Backend dependencies ready!"
echo

echo "[3/6] Starting backend server..."
echo "Starting backend server in background..."
npm start &
BACKEND_PID=$!
sleep 3
echo "Backend server started with PID: $BACKEND_PID"
echo

echo "[4/6] Setting up frontend..."
cd ../frontend
echo "Frontend files are ready!"
echo

echo "[5/6] Opening frontend..."
echo "Opening frontend in default browser..."
if command -v xdg-open > /dev/null; then
    xdg-open index.html
elif command -v open > /dev/null; then
    open index.html
else
    echo "Please open index.html in your browser manually"
fi
echo "Frontend opened in browser!"
echo

echo "[6/6] System Status Check..."
echo "Checking if backend is running..."
sleep 5
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend server is running on http://localhost:3000"
    echo "✓ API endpoints are available"
else
    echo "⚠ Backend server may not be ready yet. Please wait a moment and refresh the frontend."
fi
echo

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo
echo "System Components:"
echo "- Database: Enhanced with new tables, views, and stored procedures"
echo "- Backend: Updated with new routes and API endpoints"
echo "- Frontend: Modern responsive interface with analytics"
echo
echo "Access Points:"
echo "- Frontend: Open index.html in your browser"
echo "- Backend API: http://localhost:3000/api"
echo "- Health Check: http://localhost:3000/health"
echo
echo "New Features Added:"
echo "- Student profiles with bio, social links, and preferences"
echo "- Company reviews and ratings system"
echo "- Advanced analytics and reporting"
echo "- Stored procedures for complex operations"
echo "- Enhanced skills management"
echo "- Real-time dashboard with charts"
echo "- Modern responsive UI with Bootstrap 5"
echo
echo "Press Enter to continue..."
read
