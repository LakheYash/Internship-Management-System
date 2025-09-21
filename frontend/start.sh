#!/bin/bash

echo "Starting Internship Management System Frontend..."
echo

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found"
    echo "Please run this script from the frontend directory"
    exit 1
fi

# Try to start a simple HTTP server
echo "Starting HTTP server..."
echo "Frontend will be available at: http://localhost:8000"
echo
echo "Make sure the backend is running on http://localhost:3000"
echo
echo "Press Ctrl+C to stop the server"
echo

# Try Python first
if command -v python3 &> /dev/null; then
    echo "Using Python3 HTTP server..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server..."
    python -m http.server 8000
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    npx http-server -p 8000
else
    echo "Error: No HTTP server found"
    echo "Please install Python or Node.js"
    echo "Or simply open index.html in your browser"
    exit 1
fi
