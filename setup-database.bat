@echo off
echo ========================================
echo  Database Setup for Internship System
echo ========================================
echo.

REM Check if MySQL is available
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: MySQL is not installed or not in PATH
    echo Please install MySQL from https://dev.mysql.com/downloads/
    pause
    exit /b 1
)

echo Setting up database...
echo.

REM Create database
echo Creating database 'Internship_db'...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS Internship_db;"
if %errorlevel% neq 0 (
    echo Error: Failed to create database
    echo Please check your MySQL credentials
    pause
    exit /b 1
)

REM Import schema
echo Importing database schema...
mysql -u root -p Internship_db < backend\database\schema.sql
if %errorlevel% neq 0 (
    echo Error: Failed to import schema
    echo Please check the schema file and MySQL credentials
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Database Setup Completed Successfully!
echo ========================================
echo.
echo Database: Internship_db
echo Default admin user: admin / password
echo Sample data has been inserted
echo.
echo You can now start the application using start-system.bat
echo.
pause
