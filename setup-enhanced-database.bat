@echo off
echo ========================================
echo Enhanced Database Setup for Internship Management System
echo ========================================
echo.

echo Step 1: Setting up enhanced database schema...
mysql -u root -p < database\enhanced_schema.sql
if %errorlevel% neq 0 (
    echo Error: Failed to set up enhanced schema
    pause
    exit /b 1
)
echo Enhanced schema setup completed successfully!
echo.

echo Step 2: Loading sample data...
mysql -u root -p < database\sample_data.sql
if %errorlevel% neq 0 (
    echo Error: Failed to load sample data
    pause
    exit /b 1
)
echo Sample data loaded successfully!
echo.

echo Step 3: Creating views and complex queries...
mysql -u root -p < database\views_and_queries.sql
if %errorlevel% neq 0 (
    echo Error: Failed to create views and queries
    pause
    exit /b 1
)
echo Views and queries created successfully!
echo.

echo Step 4: Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo Step 5: Starting backend server...
start "Backend Server" cmd /k "npm start"
echo Backend server started!
echo.

echo Step 6: Opening frontend...
cd ..\frontend
start index.html
echo Frontend opened in browser!
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo The system now includes:
echo - Enhanced database schema with additional tables
echo - Comprehensive views for analytics
echo - Complex queries and joins
echo - Advanced backend API endpoints
echo - Enhanced frontend with analytics
echo.
echo Backend API: http://localhost:3000
echo Frontend: Check your browser
echo.
pause
