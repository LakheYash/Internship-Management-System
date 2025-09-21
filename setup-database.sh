#!/bin/bash

echo "========================================"
echo " Database Setup for Internship System"
echo "========================================"
echo

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL is not installed or not in PATH"
    echo "Please install MySQL from https://dev.mysql.com/downloads/"
    exit 1
fi

echo "Setting up database..."
echo

# Create database
echo "Creating database 'Internship_db'..."
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS Internship_db;"
if [ $? -ne 0 ]; then
    echo "Error: Failed to create database"
    echo "Please check your MySQL credentials"
    exit 1
fi

# Import schema
echo "Importing database schema..."
mysql -u root -p Internship_db < database/schema.sql
if [ $? -ne 0 ]; then
    echo "Error: Failed to import schema"
    echo "Please check the schema file and MySQL credentials"
    exit 1
fi

echo
echo "========================================"
echo " Database Setup Completed Successfully!"
echo "========================================"
echo
echo "Database: Internship_db"
echo "Default admin user: admin / password"
echo "Sample data has been inserted"
echo
echo "You can now start the application using ./start-system.sh"
echo
