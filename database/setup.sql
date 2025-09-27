-- Run this script to set up the database and sample data

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS Internship_db;
USE Internship_db;

-- Source the main schema file
-- Ensure paths are correct when running from the project root or this directory
-- Load base schema
SOURCE ../backend/database/schema.sql;

