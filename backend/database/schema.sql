-- Corrected Internship Management System Database Schema
-- Based on the provided ER Diagram
-- Database: Internship_db

CREATE DATABASE IF NOT EXISTS Internship_db;
USE Internship_db;

-- ==========================================
-- CORE ENTITIES FROM ER DIAGRAM
-- ==========================================

-- Students table (matches ER diagram structure)
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

-- Company table (matches ER diagram)
CREATE TABLE IF NOT EXISTS company (
    comp_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(50),
    pin VARCHAR(10),
    contact_no VARCHAR(20),
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- HR table (separate entity as shown in ER diagram)
CREATE TABLE IF NOT EXISTS hr (
    hr_id INT PRIMARY KEY AUTO_INCREMENT,
    comp_id INT NOT NULL,
    hr_name VARCHAR(100) NOT NULL,
    hr_phone VARCHAR(20),
    hr_email VARCHAR(100),
    position VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comp_id) REFERENCES company(comp_id) ON DELETE CASCADE
);

-- Admin table (matches ER diagram)
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

-- Skills table (matches ER diagram)
CREATE TABLE IF NOT EXISTS skills (
    skill_id INT PRIMARY KEY AUTO_INCREMENT,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table (matches ER diagram structure)
CREATE TABLE IF NOT EXISTS jobs (
    job_id INT PRIMARY KEY AUTO_INCREMENT,
    comp_id INT NOT NULL,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    salary DECIMAL(10,2),
    job_type ENUM('Internship', 'Full-time', 'Part-time', 'Contract') DEFAULT 'Internship',
    city VARCHAR(100),
    state VARCHAR(50),
    pin VARCHAR(10),
    posted_date DATE NOT NULL,
    deadline DATE,
    status ENUM('Active', 'Closed', 'Paused') DEFAULT 'Active',
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comp_id) REFERENCES company(comp_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE CASCADE
);

-- Education table (matches ER diagram)
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

-- Projects table (matches ER diagram)
CREATE TABLE IF NOT EXISTS projects (
    proj_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(50),
    description TEXT,
    start_date DATE,
    end_date DATE,
    technologies_used TEXT,
    project_url VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE
);

-- ==========================================
-- RELATIONSHIP TABLES FROM ER DIAGRAM
-- ==========================================

-- Application table (Students-Jobs relationship as shown in ER diagram)
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

-- Interview table (related to Application as shown in ER diagram)
CREATE TABLE IF NOT EXISTS interview (
    interview_id INT PRIMARY KEY AUTO_INCREMENT,
    app_id INT NOT NULL,
    stud_id INT NOT NULL,
    hr_id INT,
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
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    FOREIGN KEY (hr_id) REFERENCES hr(hr_id) ON DELETE SET NULL
);

-- Student-Skills junction table (M:M relationship from ER diagram)
CREATE TABLE IF NOT EXISTS student_skills (
    stud_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    years_experience INT DEFAULT 0,
    certified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (stud_id, skill_id),
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

-- Job-Skills junction table (M:M relationship from ER diagram)
CREATE TABLE IF NOT EXISTS job_skills (
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    is_mandatory BOOLEAN DEFAULT TRUE,
    weightage INT DEFAULT 1, -- Importance of this skill for the job (1-5)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

-- Notifications table (matches ER diagram)
CREATE TABLE IF NOT EXISTS notifications (
    not_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT,
    admin_id INT,
    msg TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error', 'reminder') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    sent_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE CASCADE
);

-- ==========================================
-- ADDITIONAL SUPPORTING TABLES
-- ==========================================

-- Application Status History (for tracking status changes)
CREATE TABLE IF NOT EXISTS application_status_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    app_id INT NOT NULL,
    old_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    new_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    changed_by INT, -- admin_id who made the change
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES application(app_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);

-- Student Profile (additional details)
CREATE TABLE IF NOT EXISTS student_profile (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT NOT NULL,
    bio TEXT,
    linkedin_url VARCHAR(200),
    github_url VARCHAR(200),
    portfolio_url VARCHAR(200),
    resume_file_path VARCHAR(500),
    profile_picture VARCHAR(500),
    availability_start DATE,
    availability_end DATE,
    salary_expectation DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_profile (stud_id)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Students table indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_name ON students(first_name, last_name);

-- Company table indexes
CREATE INDEX idx_company_name ON company(name);
CREATE INDEX idx_company_industry ON company(industry);
CREATE INDEX idx_company_location ON company(city, state);

-- HR table indexes
CREATE INDEX idx_hr_company_id ON hr(comp_id);
CREATE INDEX idx_hr_email ON hr(hr_email);

-- Jobs table indexes
CREATE INDEX idx_jobs_company_id ON jobs(comp_id);
CREATE INDEX idx_jobs_admin_id ON jobs(admin_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_dates ON jobs(posted_date, deadline);
CREATE INDEX idx_jobs_location ON jobs(city, state);
CREATE INDEX idx_jobs_type ON jobs(job_type);

-- Application table indexes
CREATE INDEX idx_application_student_id ON application(stud_id);
CREATE INDEX idx_application_job_id ON application(job_id);
CREATE INDEX idx_application_status ON application(status);
CREATE INDEX idx_application_date ON application(application_date);

-- Interview table indexes
CREATE INDEX idx_interview_application_id ON interview(app_id);
CREATE INDEX idx_interview_student_id ON interview(stud_id);
CREATE INDEX idx_interview_hr_id ON interview(hr_id);
CREATE INDEX idx_interview_date ON interview(interview_date);
CREATE INDEX idx_interview_status ON interview(status);

-- Skills and relationships indexes
CREATE INDEX idx_skills_name ON skills(skill_name);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_student_skills_student_id ON student_skills(stud_id);
CREATE INDEX idx_student_skills_skill_id ON student_skills(skill_id);
CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);

-- Education and Projects indexes
CREATE INDEX idx_education_student_id ON education(stud_id);
CREATE INDEX idx_education_degree ON education(degree);
CREATE INDEX idx_projects_student_id ON projects(stud_id);
CREATE INDEX idx_projects_type ON projects(project_type);

-- Notifications indexes
CREATE INDEX idx_notifications_student_id ON notifications(stud_id);
CREATE INDEX idx_notifications_admin_id ON notifications(admin_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read_status ON notifications(is_read);

-- ==========================================
-- SAMPLE DATA INSERTION
-- ==========================================

-- Insert default admin user
INSERT INTO admin (name, email, password_hash, role) 
VALUES ('System Admin', 'admin@internship.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample companies
INSERT INTO company (name, industry, city, state, pin, contact_no, website) VALUES
('TechCorp Solutions', 'Technology', 'San Francisco', 'CA', '94105', '+1-555-0101', 'https://techcorp.com'),
('DataFlow Inc', 'Data Analytics', 'New York', 'NY', '10001', '+1-555-0102', 'https://dataflow.com'),
('GreenEnergy Ltd', 'Renewable Energy', 'Austin', 'TX', '73301', '+1-555-0103', 'https://greenenergy.com'),
('FinanceFirst', 'Financial Services', 'Chicago', 'IL', '60601', '+1-555-0104', 'https://financefirst.com'),
('HealthTech Innovations', 'Healthcare Technology', 'Boston', 'MA', '02101', '+1-555-0105', 'https://healthtech.com');

-- Insert HR representatives
INSERT INTO hr (comp_id, hr_name, hr_phone, hr_email, position) VALUES
(1, 'John Smith', '+1-555-0101', 'john@techcorp.com', 'Senior HR Manager'),
(2, 'Sarah Johnson', '+1-555-0102', 'sarah@dataflow.com', 'Talent Acquisition Lead'),
(3, 'Mike Wilson', '+1-555-0103', 'mike@greenenergy.com', 'HR Business Partner'),
(4, 'Lisa Brown', '+1-555-0104', 'lisa@financefirst.com', 'Recruitment Manager'),
(5, 'Dr. Robert Davis', '+1-555-0105', 'robert@healthtech.com', 'Head of Talent');

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
('Digital Marketing', 'Marketing'),
('Sustainability', 'Environmental'),
('Research Methodology', 'Research');

-- Insert sample students
INSERT INTO students (first_name, last_name, city, state, pin, age, email, phone, status) VALUES
('Alice', 'Johnson', 'Palo Alto', 'CA', '94301', 22, 'alice.johnson@email.com', '+1-555-1001', 'Available'),
('Bob', 'Smith', 'Cambridge', 'MA', '02139', 23, 'bob.smith@email.com', '+1-555-1002', 'Available'),
('Carol', 'Davis', 'Berkeley', 'CA', '94720', 21, 'carol.davis@email.com', '+1-555-1003', 'Available'),
('David', 'Wilson', 'Cambridge', 'MA', '02138', 24, 'david.wilson@email.com', '+1-555-1004', 'Available'),
('Emma', 'Brown', 'New Haven', 'CT', '06511', 22, 'emma.brown@email.com', '+1-555-1005', 'Available');

-- Insert sample education records
INSERT INTO education (stud_id, degree, college, cgpa, start_date, end_date) VALUES
(1, 'Bachelor of Science in Computer Science', 'Stanford University', 3.8, '2020-09-01', '2024-06-01'),
(2, 'Master of Science in Data Science', 'MIT', 3.9, '2022-09-01', '2024-06-01'),
(3, 'Bachelor of Business Administration', 'UC Berkeley', 3.7, '2020-09-01', '2024-06-01'),
(4, 'Bachelor of Engineering', 'Harvard University', 3.6, '2020-09-01', '2024-06-01'),
(5, 'Bachelor of Science in Environmental Science', 'Yale University', 3.8, '2020-09-01', '2024-06-01');

-- Insert sample projects
INSERT INTO projects (stud_id, project_name, project_type, description, start_date, end_date, technologies_used) VALUES
(1, 'E-commerce Platform', 'Web Development', 'Full-stack e-commerce platform with React and Node.js', '2023-01-01', '2023-06-01', 'React, Node.js, MongoDB, Express'),
(2, 'Stock Price Predictor', 'Machine Learning', 'ML model for predicting stock market trends', '2023-03-01', '2023-08-01', 'Python, TensorFlow, Pandas, Scikit-learn'),
(3, 'Digital Marketing Dashboard', 'Analytics', 'Analytics dashboard for marketing campaign performance', '2023-02-01', '2023-05-01', 'Tableau, SQL, Google Analytics'),
(4, 'IoT Smart Home System', 'IoT Engineering', 'Smart home automation system using IoT devices', '2023-04-01', '2023-09-01', 'Arduino, C++, Python, MQTT'),
(5, 'Environmental Impact Analysis', 'Research', 'Research on renewable energy adoption patterns', '2023-01-01', '2023-12-01', 'R, GIS, Statistical Analysis');

-- Insert sample jobs
INSERT INTO jobs (comp_id, admin_id, title, description, salary, job_type, city, state, posted_date, deadline, status, requirements) VALUES
(1, 1, 'Software Development Intern', 'Full-stack development internship focusing on web applications', 3000.00, 'Internship', 'San Francisco', 'CA', '2024-01-01', '2024-03-01', 'Active', 'JavaScript, React, Node.js experience required'),
(2, 1, 'Data Analytics Intern', 'Data analysis and machine learning internship', 2800.00, 'Internship', 'New York', 'NY', '2024-01-05', '2024-03-05', 'Active', 'Python, SQL, Statistics knowledge required'),
(3, 1, 'Environmental Research Intern', 'Sustainability and environmental research internship', 2500.00, 'Internship', 'Austin', 'TX', '2024-01-10', '2024-03-10', 'Active', 'Environmental science background required'),
(4, 1, 'Finance Technology Intern', 'Fintech development and analysis internship', 3200.00, 'Internship', 'Chicago', 'IL', '2024-01-15', '2024-03-15', 'Active', 'Finance background, programming skills required'),
(5, 1, 'Healthcare Data Analyst Intern', 'Healthcare technology and data analysis internship', 2900.00, 'Internship', 'Boston', 'MA', '2024-01-20', '2024-03-20', 'Active', 'Healthcare background, data analysis skills required');

-- Insert student-skills relationships
INSERT INTO student_skills (stud_id, skill_id, proficiency_level, years_experience) VALUES
(1, 1, 'Advanced', 2), (1, 3, 'Advanced', 2), (1, 4, 'Intermediate', 1), (1, 5, 'Intermediate', 1),
(2, 2, 'Expert', 3), (2, 5, 'Advanced', 2), (2, 6, 'Advanced', 2), (2, 8, 'Expert', 3),
(3, 7, 'Advanced', 2), (3, 8, 'Intermediate', 1), (3, 12, 'Advanced', 2),
(4, 9, 'Advanced', 2), (4, 10, 'Expert', 3), (4, 11, 'Intermediate', 1),
(5, 8, 'Advanced', 2), (5, 13, 'Expert', 4), (5, 14, 'Advanced', 3);

-- Insert job-skills requirements
INSERT INTO job_skills (job_id, skill_id, required_level, is_mandatory) VALUES
(1, 1, 'Intermediate', TRUE), (1, 3, 'Intermediate', TRUE), (1, 4, 'Beginner', FALSE),
(2, 2, 'Intermediate', TRUE), (2, 5, 'Intermediate', TRUE), (2, 6, 'Beginner', FALSE),
(3, 13, 'Intermediate', TRUE), (3, 14, 'Advanced', TRUE), (3, 8, 'Beginner', FALSE),
(4, 9, 'Intermediate', TRUE), (4, 5, 'Intermediate', TRUE), (4, 7, 'Beginner', FALSE),
(5, 2, 'Intermediate', TRUE), (5, 8, 'Advanced', TRUE), (5, 6, 'Beginner', FALSE);

USE Internship_db;

-- ADD MISSING APPLICATIONS 
INSERT INTO application (stud_id, job_id, status, application_date, cover_letter) VALUES
(1, 1, 'Selected', '2024-01-02', 'Perfect match for Software Development - JavaScript, React, Node.js skills'),
(2, 2, 'Under Review', '2024-01-06', 'Interested in Data Analytics - Python, SQL, ML expertise'),
(2, 5, 'Pending', '2024-01-22', 'Healthcare Data Analyst - My data science background fits well'),
(3, 4, 'Rejected', '2024-01-16', 'Finance Technology role - Project management experience'),
(4, 4, 'Shortlisted', '2024-01-17', 'Finance Technology - Java and system design skills'),
(5, 3, 'Selected', '2024-01-12', 'Environmental Research - Research methodology and sustainability expertise'),
(1, 2, 'Rejected', '2024-01-08', 'Exploring data analytics from web development background'),
(3, 1, 'Under Review', '2024-01-14', 'Software Development - Expanding technical skills'),
(4, 2, 'Pending', '2024-01-18', 'System design perspective for data analytics'),
(5, 2, 'Rejected', '2024-01-24', 'Research skills applicable to data analytics');

-- ADD CORRESPONDING INTERVIEWS
INSERT INTO interview (app_id, stud_id, mode, interview_date, interview_score, status, interviewer_name, interviewer_email) VALUES
(1, 1, 'Online', '2024-01-15 10:00:00', 92, 'Completed', 'John Smith', 'john@techcorp.com'),
(6, 5, 'Video', '2024-01-25 14:00:00', 88, 'Completed', 'Mike Wilson', 'mike@greenenergy.com'),
(5, 4, 'Offline', '2024-01-30 11:00:00', 85, 'Completed', 'Lisa Brown', 'lisa@financefirst.com'),
(2, 2, 'Online', '2024-02-05 15:00:00', NULL, 'Scheduled', 'Sarah Johnson', 'sarah@dataflow.com'),
(8, 3, 'Phone', '2024-01-28 16:00:00', 65, 'Completed', 'Tech Interviewer', 'tech@techcorp.com');

-- ADD NOTIFICATIONS
INSERT INTO notifications (stud_id, admin_id, msg, type, is_read) VALUES
(1, 1, 'Congratulations! Selected for Software Development Intern position.', 'success', TRUE),
(5, 1, 'Congratulations! Selected for Environmental Research Intern position.', 'success', FALSE),
(4, 1, 'Shortlisted for Finance Technology Intern interview.', 'info', FALSE),
(2, 1, 'Interview scheduled for Data Analytics position - Feb 5th.', 'reminder', FALSE),
(3, 1, 'Application status updated - moving forward with other candidates.', 'info', TRUE);

-- UPDATE STUDENT STATUS
UPDATE students SET status = 'Selected' WHERE stud_id IN (1, 5);
UPDATE students SET status = 'Applied' WHERE stud_id IN (2, 3, 4);

