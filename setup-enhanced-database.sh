#!/bin/bash

echo "========================================"
echo "Enhanced Database Setup for Internship Management System"
echo "========================================"
echo

echo "Step 1: Setting up enhanced database schema..."
mysql -u root -p < database/enhanced_schema.sql
if [ $? -ne 0 ]; then
    echo "Error: Failed to set up enhanced schema"
    exit 1
fi
echo "Enhanced schema setup completed successfully!"
echo

echo "Step 2: Loading sample data..."
mysql -u root -p < database/sample_data.sql
if [ $? -ne 0 ]; then
    echo "Error: Failed to load sample data"
    exit 1
fi
echo "Sample data loaded successfully!"
echo

echo "Step 3: Creating views and complex queries..."
mysql -u root -p < database/views_and_queries.sql
if [ $? -ne 0 ]; then
    echo "Error: Failed to create views and queries"
    exit 1
fi
echo "Views and queries created successfully!"
echo

echo "Step 4: Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi
echo "Backend dependencies installed successfully!"
echo

echo "Step 5: Starting backend server..."
npm start &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"
echo

echo "Step 6: Opening frontend..."
cd ../frontend
if command -v xdg-open &> /dev/null; then
    xdg-open index.html
elif command -v open &> /dev/null; then
    open index.html
else
    echo "Please open index.html in your browser"
fi
echo "Frontend opened in browser!"
echo

echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo
echo "The system now includes:"
echo "- Enhanced database schema with additional tables"
echo "- Comprehensive views for analytics"
echo "- Complex queries and joins"
echo "- Advanced backend API endpoints"
echo "- Enhanced frontend with analytics"
echo
echo "Backend API: http://localhost:3000"
echo "Frontend: Check your browser"
echo
echo "Press Ctrl+C to stop the backend server"
wait $BACKEND_PID
