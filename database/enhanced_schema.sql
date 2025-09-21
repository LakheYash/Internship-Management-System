-- Enhanced Database Schema for Internship Management System
-- Based on ER Diagram Analysis
-- This file contains additional DDL statements to enhance the existing schema

USE Internship_db;

-- ==============================================
-- ADDITIONAL DDL STATEMENTS
-- ==============================================

-- 1. Add missing columns to match ER diagram exactly
ALTER TABLE students 
ADD COLUMN profile_v VARCHAR(50) DEFAULT 'v1.0' AFTER stud_id,
ADD COLUMN pin_code VARCHAR(10) AFTER pin;

-- 2. Add missing columns to jobs table
ALTER TABLE jobs 
ADD COLUMN pin_code VARCHAR(10) AFTER state;

-- 3. Add missing columns to company table  
ALTER TABLE company 
ADD COLUMN pin_code VARCHAR(10) AFTER pin;

-- 4. Create HR Details table (as per ER diagram)
CREATE TABLE IF NOT EXISTS hr_details (
    hr_id INT PRIMARY KEY AUTO_INCREMENT,
    comp_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    hr_phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comp_id) REFERENCES company(comp_id) ON DELETE CASCADE
);

-- 5. Create Job-Skills junction table (M:M relationship)
CREATE TABLE IF NOT EXISTS job_skills (
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

-- 6. Create Application Status History table
CREATE TABLE IF NOT EXISTS application_status_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    app_id INT NOT NULL,
    old_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    new_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    changed_by INT, -- admin_id who made the change
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES application(app_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);

-- 7. Create Student Profile table for additional details
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
    preferred_job_types JSON, -- Array of preferred job types
    preferred_locations JSON, -- Array of preferred locations
    salary_expectation DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_profile (stud_id)
);

-- 8. Create Company Reviews table
CREATE TABLE IF NOT EXISTS company_reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    comp_id INT NOT NULL,
    stud_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    work_environment_rating INT CHECK (work_environment_rating >= 1 AND work_environment_rating <= 5),
    learning_opportunity_rating INT CHECK (learning_opportunity_rating >= 1 AND learning_opportunity_rating <= 5),
    management_rating INT CHECK (management_rating >= 1 AND management_rating <= 5),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comp_id) REFERENCES company(comp_id) ON DELETE CASCADE,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_company_review (stud_id, comp_id)
);

-- 9. Create Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    eval_id INT PRIMARY KEY AUTO_INCREMENT,
    app_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    evaluator_type ENUM('supervisor', 'intern', 'admin') NOT NULL,
    technical_skills INT CHECK (technical_skills >= 1 AND technical_skills <= 5),
    communication INT CHECK (communication >= 1 AND communication <= 5),
    teamwork INT CHECK (teamwork >= 1 AND teamwork <= 5),
    punctuality INT CHECK (punctuality >= 1 AND punctuality <= 5),
    overall_rating DECIMAL(3,2),
    comments TEXT,
    evaluation_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES application(app_id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES admin(admin_id) ON DELETE CASCADE
);

-- 10. Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    app_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed', 'Overdue') DEFAULT 'Pending',
    assigned_date DATE DEFAULT (CURRENT_DATE),
    due_date DATE,
    completed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES application(app_id) ON DELETE CASCADE
);

-- 11. Create System Logs table
CREATE TABLE IF NOT EXISTS system_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT, -- Can be student_id or admin_id
    user_type ENUM('student', 'admin'),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- 10. Create Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
    template_id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    variables JSON, -- Available variables for this template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 11. Create Email Queue table
CREATE TABLE IF NOT EXISTS email_queue (
    email_id INT PRIMARY KEY AUTO_INCREMENT,
    to_email VARCHAR(100) NOT NULL,
    to_name VARCHAR(100),
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    template_id INT,
    status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES email_templates(template_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 12. Create File Uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    file_id INT PRIMARY KEY AUTO_INCREMENT,
    stud_id INT,
    admin_id INT,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    upload_type ENUM('resume', 'cover_letter', 'transcript', 'certificate', 'other') NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE CASCADE,
    INDEX idx_upload_type (upload_type),
    INDEX idx_created_at (created_at)
);

-- 13. Create System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for new tables
CREATE INDEX idx_hr_details_company_id ON hr_details(comp_id);
CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);
CREATE INDEX idx_application_status_history_app_id ON application_status_history(app_id);
CREATE INDEX idx_application_status_history_changed_by ON application_status_history(changed_by);
CREATE INDEX idx_student_profile_student_id ON student_profile(stud_id);
CREATE INDEX idx_company_reviews_company_id ON company_reviews(comp_id);
CREATE INDEX idx_company_reviews_student_id ON company_reviews(stud_id);
CREATE INDEX idx_company_reviews_rating ON company_reviews(rating);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_file_uploads_student_id ON file_uploads(stud_id);
CREATE INDEX idx_file_uploads_admin_id ON file_uploads(admin_id);
CREATE INDEX idx_file_uploads_upload_type ON file_uploads(upload_type);

-- ==============================================
-- TRIGGERS FOR DATA INTEGRITY
-- ==============================================

-- Trigger to update application status history
DELIMITER //
CREATE TRIGGER tr_application_status_update
AFTER UPDATE ON application
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO application_status_history (app_id, old_status, new_status, changed_by, change_reason)
        VALUES (NEW.app_id, OLD.status, NEW.status, NEW.updated_at, 'Status updated');
    END IF;
END//
DELIMITER ;

-- Trigger to log system activities
DELIMITER //
CREATE TRIGGER tr_student_update_log
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (user_id, user_type, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.stud_id, 'student', 'UPDATE', 'students', NEW.stud_id, 
            JSON_OBJECT('email', OLD.email, 'status', OLD.status),
            JSON_OBJECT('email', NEW.email, 'status', NEW.status));
END//
DELIMITER ;

-- ==============================================
-- STORED PROCEDURES
-- ==============================================

-- Procedure to get student statistics
DELIMITER //
CREATE PROCEDURE GetStudentStatistics(IN student_id INT)
BEGIN
    SELECT 
        s.stud_id,
        CONCAT(s.first_name, ' ', s.last_name) as full_name,
        s.status,
        COUNT(DISTINCT a.app_id) as total_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
        COUNT(DISTINCT i.interview_id) as total_interviews,
        AVG(i.interview_score) as avg_interview_score,
        COUNT(DISTINCT p.proj_id) as total_projects,
        COUNT(DISTINCT ss.skill_id) as total_skills
    FROM students s
    LEFT JOIN application a ON s.stud_id = a.stud_id
    LEFT JOIN interview i ON a.app_id = i.app_id
    LEFT JOIN projects p ON s.stud_id = p.stud_id
    LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
    WHERE s.stud_id = student_id
    GROUP BY s.stud_id, s.first_name, s.last_name, s.status;
END//
DELIMITER ;

-- Procedure to get company statistics
DELIMITER //
CREATE PROCEDURE GetCompanyStatistics(IN company_id INT)
BEGIN
    SELECT 
        c.comp_id,
        c.name,
        c.industry,
        COUNT(DISTINCT j.job_id) as total_jobs,
        COUNT(DISTINCT a.app_id) as total_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
        AVG(cr.rating) as avg_rating,
        COUNT(DISTINCT cr.review_id) as total_reviews
    FROM company c
    LEFT JOIN jobs j ON c.comp_id = j.comp_id
    LEFT JOIN application a ON j.job_id = a.job_id
    LEFT JOIN company_reviews cr ON c.comp_id = cr.comp_id
    WHERE c.comp_id = company_id
    GROUP BY c.comp_id, c.name, c.industry;
END//
DELIMITER ;

-- Procedure to clean up old logs
DELIMITER //
CREATE PROCEDURE CleanupOldLogs(IN days_to_keep INT)
BEGIN
    DELETE FROM system_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    SELECT ROW_COUNT() as deleted_logs;
END//
DELIMITER ;

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to calculate application success rate
DELIMITER //
CREATE FUNCTION CalculateSuccessRate(student_id INT) 
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total_apps INT DEFAULT 0;
    DECLARE selected_apps INT DEFAULT 0;
    DECLARE success_rate DECIMAL(5,2) DEFAULT 0.00;
    
    SELECT COUNT(*) INTO total_apps
    FROM application 
    WHERE stud_id = student_id;
    
    SELECT COUNT(*) INTO selected_apps
    FROM application 
    WHERE stud_id = student_id AND status = 'Selected';
    
    IF total_apps > 0 THEN
        SET success_rate = (selected_apps / total_apps) * 100;
    END IF;
    
    RETURN success_rate;
END//
DELIMITER ;

-- Function to get student full name
DELIMITER //
CREATE FUNCTION GetStudentFullName(student_id INT) 
RETURNS VARCHAR(200)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE full_name VARCHAR(200);
    
    SELECT CONCAT(COALESCE(first_name, ''), ' ', COALESCE(middle_name, ''), ' ', COALESCE(last_name, ''))
    INTO full_name
    FROM students 
    WHERE stud_id = student_id;
    
    RETURN TRIM(full_name);
END//
DELIMITER ;

-- ==============================================
-- EVENTS (SCHEDULED TASKS)
-- ==============================================

-- Event to clean up old logs every week
CREATE EVENT IF NOT EXISTS cleanup_old_logs
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
  CALL CleanupOldLogs(30);

-- Event to update application statuses (mark expired applications)
CREATE EVENT IF NOT EXISTS update_expired_applications
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  UPDATE application a
  JOIN jobs j ON a.job_id = j.job_id
  SET a.status = 'Rejected'
  WHERE a.status = 'Pending' 
    AND j.deadline < CURDATE()
    AND j.status = 'Closed';

-- ==============================================
-- GRANTS AND PERMISSIONS
-- ==============================================

-- Create read-only user for reports
-- CREATE USER 'internship_readonly'@'localhost' IDENTIFIED BY 'readonly_password';
-- GRANT SELECT ON Internship_db.* TO 'internship_readonly'@'localhost';

-- Create application user with limited permissions
-- CREATE USER 'internship_app'@'localhost' IDENTIFIED BY 'app_password';
-- GRANT SELECT, INSERT, UPDATE ON Internship_db.* TO 'internship_app'@'localhost';
-- GRANT DELETE ON Internship_db.system_logs TO 'internship_app'@'localhost';

-- ==============================================
-- FINAL MESSAGE
-- ==============================================

SELECT 'Enhanced database schema created successfully!' as Status;
SELECT 'Additional tables, triggers, procedures, and functions added' as Details;
SELECT 'System is ready for advanced operations' as Ready_Status;
