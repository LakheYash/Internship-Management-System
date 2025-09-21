-- Internship Management System Database Schema
-- Database: Internship_db
-- Based on ERD Design

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS Internship_db;
USE Internship_db;

-- Students table (renamed from interns to match ERD)
CREATE TABLE IF NOT EXISTS students (
    stud_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    pin VARCHAR(10),
    age INT,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    status ENUM('Available', 'Applied', 'Selected', 'Completed', 'Inactive') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    skill_id INT PRIMARY KEY AUTO_INCREMENT,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Education table
CREATE TABLE IF NOT EXISTS education (
    edu_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT NOT NULL,
    degree VARCHAR(100) NOT NULL,
    college VARCHAR(200) NOT NULL,
    cgpa DECIMAL(3,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    proj_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(50),
    description TEXT,
    start_date DATE,
    end_date DATE,
    technologies_used TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE
);

-- Company table (renamed from companies to match ERD)
CREATE TABLE IF NOT EXISTS company (
    comp_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(50),
    pin VARCHAR(10),
    contact_no VARCHAR(20),
    hr_name VARCHAR(100),
    hr_phone VARCHAR(20),
    hr_email VARCHAR(100),
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin table (renamed from users to match ERD)
CREATE TABLE IF NOT EXISTS admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Jobs table (renamed from internships to match ERD)
CREATE TABLE IF NOT EXISTS jobs (
    job_id INT PRIMARY KEY AUTO_INCREMENT,
    comp_id INT NOT NULL,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    required_skills TEXT,
    salary DECIMAL(10,2),
    job_type ENUM('Internship', 'Full-time', 'Part-time', 'Contract') DEFAULT 'Internship',
    city VARCHAR(100),
    state VARCHAR(50),
    posted_date DATE NOT NULL,
    deadline DATE,
    status ENUM('Active', 'Closed', 'Paused') DEFAULT 'Active',
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comp_id) REFERENCES company(comp_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE CASCADE
);

-- Application table (associative entity for Students-Jobs M:M relationship)
CREATE TABLE IF NOT EXISTS application (
    app_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT NOT NULL,
    job_id INT NOT NULL,
    status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected') DEFAULT 'Pending',
    application_date DATE NOT NULL,
    cover_letter TEXT,
    resume_url VARCHAR(500),
    additional_documents TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (stud_id, job_id)
);

-- Interview table
CREATE TABLE IF NOT EXISTS interview (
    interview_id INT PRIMARY KEY AUTO_INCREMENT,
    app_id INT NOT NULL,
    stud_id INT NOT NULL,
    mode ENUM('Online', 'Offline', 'Phone', 'Video') NOT NULL,
    interview_date DATETIME NOT NULL,
    interview_score INT CHECK (interview_score >= 0 AND interview_score <= 100),
    feedback TEXT,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'Rescheduled') DEFAULT 'Scheduled',
    interviewer_name VARCHAR(100),
    interviewer_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES application(app_id) ON DELETE CASCADE,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    not_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT,
    admin_id INT,
    msg TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error', 'reminder') DEFAULT 'info',
    month INT,
    day INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE CASCADE
);

-- Student-Skills junction table (M:M relationship)
CREATE TABLE IF NOT EXISTS student_skills (
    stud_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (stud_id, skill_id),
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO admin (name, email, password_hash, role) 
VALUES ('Admin User', 'admin@internship.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample companies
INSERT INTO company (name, industry, city, state, pin, contact_no, hr_name, hr_phone, hr_email, website) VALUES
('TechCorp Solutions', 'Technology', 'San Francisco', 'CA', '94105', '+1-555-0101', 'John Smith', '+1-555-0101', 'john@techcorp.com', 'https://techcorp.com'),
('DataFlow Inc', 'Data Analytics', 'New York', 'NY', '10001', '+1-555-0102', 'Sarah Johnson', '+1-555-0102', 'sarah@dataflow.com', 'https://dataflow.com'),
('GreenEnergy Ltd', 'Renewable Energy', 'Austin', 'TX', '73301', '+1-555-0103', 'Mike Wilson', '+1-555-0103', 'mike@greenenergy.com', 'https://greenenergy.com'),
('FinanceFirst', 'Financial Services', 'Chicago', 'IL', '60601', '+1-555-0104', 'Lisa Brown', '+1-555-0104', 'lisa@financefirst.com', 'https://financefirst.com'),
('HealthTech Innovations', 'Healthcare Technology', 'Boston', 'MA', '02101', '+1-555-0105', 'Dr. Robert Davis', '+1-555-0105', 'robert@healthtech.com', 'https://healthtech.com');

-- Insert sample students
INSERT INTO students (first_name, last_name, city, state, pin, age, email, phone, status) VALUES
('Alice', 'Johnson', 'Palo Alto', 'CA', '94301', 22, 'alice.johnson@email.com', '+1-555-1001', 'Available'),
('Bob', 'Smith', 'Cambridge', 'MA', '02139', 23, 'bob.smith@email.com', '+1-555-1002', 'Available'),
('Carol', 'Davis', 'Berkeley', 'CA', '94720', 21, 'carol.davis@email.com', '+1-555-1003', 'Available'),
('David', 'Wilson', 'Cambridge', 'MA', '02138', 24, 'david.wilson@email.com', '+1-555-1004', 'Available'),
('Emma', 'Brown', 'New Haven', 'CT', '06511', 22, 'emma.brown@email.com', '+1-555-1005', 'Available');

-- Insert sample skills
INSERT INTO skills (skill_name, category) VALUES
('JavaScript', 'Programming'),
('Python', 'Programming'),
('React', 'Frontend'),
('Node.js', 'Backend'),
('SQL', 'Database'),
('Machine Learning', 'AI/ML'),
('Project Management', 'Management'),
('Data Analysis', 'Analytics'),
('Java', 'Programming'),
('C++', 'Programming'),
('System Design', 'Architecture'),
('Marketing', 'Business'),
('Sustainability', 'Environmental'),
('Research', 'Academic');

-- Insert sample education records
INSERT INTO education (stud_id, degree, college, cgpa, start_date, end_date) VALUES
(1, 'Bachelor of Science in Computer Science', 'Stanford University', 3.8, '2020-09-01', '2024-06-01'),
(2, 'Master of Science in Data Science', 'MIT', 3.9, '2022-09-01', '2024-06-01'),
(3, 'Bachelor of Business Administration', 'UC Berkeley', 3.7, '2020-09-01', '2024-06-01'),
(4, 'Bachelor of Engineering', 'Harvard University', 3.6, '2020-09-01', '2024-06-01'),
(5, 'Bachelor of Science in Environmental Science', 'Yale University', 3.8, '2020-09-01', '2024-06-01');

-- Insert sample projects
INSERT INTO projects (stud_id, project_name, project_type, description, start_date, end_date, technologies_used) VALUES
(1, 'E-commerce Website', 'Web Development', 'Full-stack e-commerce platform with React and Node.js', '2023-01-01', '2023-06-01', 'React, Node.js, MongoDB, Express'),
(2, 'Machine Learning Model', 'Data Science', 'Predictive model for stock market analysis', '2023-03-01', '2023-08-01', 'Python, TensorFlow, Pandas, Scikit-learn'),
(3, 'Marketing Campaign Analysis', 'Business', 'Analysis of digital marketing campaign effectiveness', '2023-02-01', '2023-05-01', 'Excel, Google Analytics, Tableau'),
(4, 'IoT Home Automation', 'Engineering', 'Smart home system using Arduino and sensors', '2023-04-01', '2023-09-01', 'Arduino, C++, Python, IoT'),
(5, 'Environmental Impact Study', 'Research', 'Study on renewable energy adoption in urban areas', '2023-01-01', '2023-12-01', 'R, GIS, Statistical Analysis');

-- Insert sample jobs
INSERT INTO jobs (comp_id, admin_id, title, description, required_skills, salary, job_type, city, state, posted_date, deadline, status, requirements) VALUES
(1, 1, 'Software Development Intern', 'Full-stack development internship focusing on web applications', 'JavaScript, React, Node.js', 3000.00, 'Internship', 'San Francisco', 'CA', '2024-01-01', '2024-01-15', 'Active', 'JavaScript, React, Node.js experience required'),
(2, 1, 'Data Analytics Intern', 'Data analysis and visualization internship', 'Python, SQL, Statistics', 2800.00, 'Internship', 'New York', 'NY', '2024-01-05', '2024-01-20', 'Active', 'Python, SQL, Statistics knowledge required'),
(1, 1, 'Business Development Intern', 'Marketing and business strategy internship', 'Marketing, Communication, Analytics', 2500.00, 'Internship', 'San Francisco', 'CA', '2024-01-10', '2024-01-25', 'Active', 'Business background, communication skills required'),
(4, 1, 'Engineering Intern', 'Hardware and software engineering internship', 'Java, C++, System Design', 3200.00, 'Internship', 'Chicago', 'IL', '2024-01-15', '2024-01-30', 'Active', 'Engineering background, problem-solving skills required'),
(3, 1, 'Environmental Research Intern', 'Sustainability and environmental research internship', 'Research, Sustainability, Data Analysis', 2200.00, 'Internship', 'Austin', 'TX', '2024-01-20', '2024-02-05', 'Active', 'Environmental science background required');

-- Insert sample applications
INSERT INTO application (stud_id, job_id, status, application_date, cover_letter) VALUES
(1, 1, 'Pending', '2024-01-02', 'I am excited to apply for the Software Development Intern position...'),
(2, 2, 'Under Review', '2024-01-06', 'I am interested in the Data Analytics Intern position...'),
(3, 3, 'Shortlisted', '2024-01-11', 'I would like to apply for the Business Development Intern position...'),
(4, 4, 'Pending', '2024-01-16', 'I am applying for the Engineering Intern position...'),
(5, 5, 'Under Review', '2024-01-21', 'I am interested in the Environmental Research Intern position...');

-- Insert sample interviews
INSERT INTO interview (app_id, stud_id, mode, interview_date, interview_score, status, interviewer_name, interviewer_email) VALUES
(1, 1, 'Online', '2024-01-20 10:00:00', 85, 'Completed', 'John Smith', 'john@techcorp.com'),
(2, 2, 'Video', '2024-01-25 14:00:00', 92, 'Completed', 'Sarah Johnson', 'sarah@dataflow.com'),
(3, 3, 'Online', '2024-01-30 11:00:00', 78, 'Scheduled', 'Marketing Team Lead', 'marketing@techcorp.com'),
(4, 4, 'Offline', '2024-02-05 09:00:00', NULL, 'Scheduled', 'Engineering Manager', 'engineering@financefirst.com'),
(5, 5, 'Phone', '2024-02-10 15:00:00', NULL, 'Scheduled', 'Dr. Robert Davis', 'robert@greenenergy.com');

-- Insert sample notifications
INSERT INTO notifications (stud_id, admin_id, msg, type, month, day) VALUES
(1, 1, 'Your application has been received and is under review', 'info', 1, 2),
(2, 1, 'Congratulations! You have been shortlisted for the interview', 'success', 1, 6),
(3, 1, 'Your interview is scheduled for tomorrow at 11:00 AM', 'reminder', 1, 29),
(4, 1, 'Please submit your additional documents by the deadline', 'warning', 1, 16),
(5, 1, 'Your application status has been updated', 'info', 1, 21);

-- Insert student-skills relationships
INSERT INTO student_skills (stud_id, skill_id, proficiency_level) VALUES
(1, 1, 'Advanced'), (1, 2, 'Intermediate'), (1, 3, 'Advanced'), (1, 4, 'Intermediate'),
(2, 2, 'Expert'), (2, 5, 'Advanced'), (2, 6, 'Advanced'), (2, 8, 'Expert'),
(3, 7, 'Advanced'), (3, 8, 'Intermediate'), (3, 12, 'Advanced'),
(4, 9, 'Advanced'), (4, 10, 'Expert'), (4, 11, 'Intermediate'),
(5, 8, 'Advanced'), (5, 13, 'Expert'), (5, 14, 'Advanced');

-- Create indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_company_name ON company(name);
CREATE INDEX idx_jobs_company_id ON jobs(comp_id);
CREATE INDEX idx_jobs_admin_id ON jobs(admin_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_dates ON jobs(posted_date, deadline);
CREATE INDEX idx_application_student_id ON application(stud_id);
CREATE INDEX idx_application_job_id ON application(job_id);
CREATE INDEX idx_application_status ON application(status);
CREATE INDEX idx_interview_application_id ON interview(app_id);
CREATE INDEX idx_interview_student_id ON interview(stud_id);
CREATE INDEX idx_notifications_student_id ON notifications(stud_id);
CREATE INDEX idx_notifications_admin_id ON notifications(admin_id);
CREATE INDEX idx_education_student_id ON education(stud_id);
CREATE INDEX idx_projects_student_id ON projects(stud_id);
CREATE INDEX idx_student_skills_student_id ON student_skills(stud_id);
CREATE INDEX idx_student_skills_skill_id ON student_skills(skill_id);
