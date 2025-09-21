-- Database Setup Script for Internship Management System
-- Run this script to set up the database and sample data

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS Internship_db;
USE Internship_db;

-- Source the main schema file
SOURCE schema.sql;

-- Display success message
SELECT 'Database setup completed successfully!' as Status;
SELECT 'Default admin user created: admin / password' as Login_Info;
SELECT 'Sample data has been inserted' as Data_Status;
