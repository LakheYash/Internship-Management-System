#!/bin/bash

echo "Starting Internship Management System Backend..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found"
    echo "Please run this script from the backend directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Check if config.env exists
if [ ! -f "config.env" ]; then
    echo "Warning: config.env not found"
    echo "Please create config.env with your database configuration"
    echo "See config.env.example for reference"
    read -p "Press Enter to continue..."
fi

# Start the server
echo "Starting server..."
echo "Backend will be available at: http://localhost:3000"
echo "API endpoints will be available at: http://localhost:3000/api"
echo
echo "Press Ctrl+C to stop the server"
echo

npm start
