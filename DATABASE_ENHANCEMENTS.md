# Database Enhancements for Internship Management System

## Overview
This document outlines the comprehensive database enhancements made to the Internship Management System based on the provided ER diagram. The enhancements include additional DDL statements, DML operations, views, complex queries, and updated backend/frontend components.

## Database Schema Enhancements

### 1. Additional Tables Created

#### HR Details Table
```sql
CREATE TABLE hr_details (
    hr_id INT PRIMARY KEY AUTO_INCREMENT,
    comp_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    hr_phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comp_id) REFERENCES company(comp_id) ON DELETE CASCADE
);
```

#### Job-Skills Junction Table
```sql
CREATE TABLE job_skills (
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);
```

#### Application Status History Table
```sql
CREATE TABLE application_status_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    app_id INT NOT NULL,
    old_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    new_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    changed_by INT,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES application(app_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);
```

#### Student Profile Table
```sql
CREATE TABLE student_profile (
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
    preferred_job_types JSON,
    preferred_locations JSON,
    salary_expectation DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stud_id) REFERENCES students(stud_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_profile (stud_id)
);
```

#### Company Reviews Table
```sql
CREATE TABLE company_reviews (
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
```

#### System Logs Table
```sql
CREATE TABLE system_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
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
```

#### Email Templates and Queue Tables
```sql
CREATE TABLE email_templates (
    template_id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE email_queue (
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
```

#### File Uploads Table
```sql
CREATE TABLE file_uploads (
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
```

#### System Settings Table
```sql
CREATE TABLE system_settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Enhanced Views

#### Student Dashboard View
```sql
CREATE OR REPLACE VIEW v_student_dashboard AS
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name) as full_name,
    s.email,
    s.phone,
    s.status as student_status,
    s.city,
    s.state,
    sp.bio,
    sp.linkedin_url,
    sp.github_url,
    sp.portfolio_url,
    sp.salary_expectation,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score,
    COUNT(DISTINCT p.proj_id) as total_projects,
    COUNT(DISTINCT ss.skill_id) as total_skills,
    GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as skills_list
FROM students s
LEFT JOIN student_profile sp ON s.stud_id = sp.stud_id
LEFT JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN projects p ON s.stud_id = p.stud_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
GROUP BY s.stud_id, s.first_name, s.middle_name, s.last_name, s.email, s.phone, s.status, s.city, s.state, sp.bio, sp.linkedin_url, sp.github_url, sp.portfolio_url, sp.salary_expectation;
```

#### Company Dashboard View
```sql
CREATE OR REPLACE VIEW v_company_dashboard AS
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    c.city,
    c.state,
    c.contact_no,
    c.website,
    c.is_active,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'Active' THEN j.job_id END) as active_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    AVG(cr.rating) as avg_rating,
    COUNT(DISTINCT cr.review_id) as total_reviews,
    COUNT(DISTINCT hd.hr_id) as total_hr_contacts
FROM company c
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN company_reviews cr ON c.comp_id = cr.comp_id
LEFT JOIN hr_details hd ON c.comp_id = hd.comp_id
GROUP BY c.comp_id, c.name, c.industry, c.city, c.state, c.contact_no, c.website, c.is_active;
```

### 3. Complex Queries and Joins

#### Find Students with Highest Interview Scores
```sql
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    AVG(i.interview_score) as avg_interview_score,
    COUNT(i.interview_id) as total_interviews,
    COUNT(a.app_id) as total_applications
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_score IS NOT NULL
GROUP BY s.stud_id, s.first_name, s.last_name, s.email
HAVING COUNT(i.interview_id) >= 2
ORDER BY avg_interview_score DESC
LIMIT 10;
```

#### Find Companies with Most Applications
```sql
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / COUNT(DISTINCT a.app_id)) * 100, 2) as selection_rate
FROM company c
JOIN jobs j ON c.comp_id = j.comp_id
JOIN application a ON j.job_id = a.job_id
GROUP BY c.comp_id, c.name, c.industry
HAVING COUNT(DISTINCT a.app_id) > 0
ORDER BY total_applications DESC;
```

#### Find Students with Matching Skills for Jobs
```sql
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    GROUP_CONCAT(sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as matching_skills,
    COUNT(js.skill_id) as matching_skills_count,
    COUNT(DISTINCT js.skill_id) as total_required_skills,
    ROUND((COUNT(js.skill_id) / COUNT(DISTINCT js.skill_id)) * 100, 2) as skill_match_percentage
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
JOIN job_skills js ON sk.skill_id = js.skill_id
JOIN jobs j ON js.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE j.status = 'Active'
GROUP BY s.stud_id, s.first_name, s.last_name, j.title, c.name
HAVING skill_match_percentage >= 50
ORDER BY skill_match_percentage DESC, matching_skills_count DESC;
```

### 4. Stored Procedures

#### Get Student Statistics
```sql
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
```

### 5. Triggers

#### Application Status Update Trigger
```sql
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
```

### 6. Functions

#### Calculate Application Success Rate
```sql
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
```

## Backend Enhancements

### 1. New API Routes

#### Analytics Routes (`/api/analytics`)
- `GET /dashboard` - Get dashboard analytics
- `GET /students` - Get student analytics
- `GET /companies` - Get company analytics
- `GET /jobs` - Get job analytics
- `GET /interviews` - Get interview analytics
- `GET /skills` - Get skill analytics
- `GET /timeline` - Get application timeline
- `GET /monthly` - Get monthly statistics
- `GET /reviews` - Get company reviews analytics
- `GET /skills-matrix` - Get student skills matrix
- `GET /job-matches/:jobId` - Get matching students for jobs

#### Skills Routes (`/api/skills`)
- `GET /` - Get all skills with pagination and filtering
- `GET /:id` - Get skill by ID
- `POST /` - Create new skill
- `PUT /:id` - Update skill
- `DELETE /:id` - Delete skill
- `GET /categories/list` - Get skill categories
- `GET /stats/overview` - Get skill statistics

#### Student Skills Routes (`/api/student-skills`)
- `GET /student/:studId` - Get student skills
- `POST /` - Add skill to student
- `PUT /:studId/:skillId` - Update student skill proficiency
- `DELETE /:studId/:skillId` - Remove skill from student
- `POST /bulk` - Bulk add skills to student
- `GET /skill/:skillId` - Get students by skill

### 2. Enhanced Error Handling
- Comprehensive validation using express-validator
- Detailed error messages and status codes
- Proper error logging and monitoring

### 3. Database Connection Improvements
- Connection pooling for better performance
- Automatic reconnection handling
- Query timeout management

## Frontend Enhancements

### 1. Enhanced JavaScript (`enhanced-app.js`)
- Modern ES6+ features
- Improved error handling
- Real-time data updates
- Advanced analytics visualization

### 2. New Features
- Student skills management
- Advanced analytics dashboard
- Interactive charts and graphs
- Real-time notifications
- File upload capabilities

### 3. UI Improvements
- Responsive design
- Modern Bootstrap components
- Interactive data tables
- Advanced filtering and search

## Sample Data

### 1. Additional Skills
- 28 new skills across various categories
- Programming languages, frameworks, tools
- Soft skills and methodologies

### 2. Student Profiles
- Comprehensive student profiles with bio, social links
- Portfolio and resume information
- Availability and preferences

### 3. Company Reviews
- Rating system for companies
- Detailed feedback categories
- Anonymous review options

### 4. Email Templates
- Application received template
- Interview scheduled template
- Application status updates
- Customizable variables

## Performance Optimizations

### 1. Database Indexes
- Strategic indexing on frequently queried columns
- Composite indexes for complex queries
- Covering indexes for common operations

### 2. Query Optimization
- Efficient JOIN operations
- Proper use of subqueries and CTEs
- Query result caching

### 3. API Optimization
- Pagination for large datasets
- Response compression
- Efficient data serialization

## Security Enhancements

### 1. Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection

### 2. Access Control
- Role-based permissions
- API endpoint protection
- Data access restrictions

### 3. Audit Logging
- Comprehensive activity logging
- Change tracking
- Security event monitoring

## Setup Instructions

### 1. Database Setup
```bash
# Run the enhanced setup script
./setup-enhanced-database.sh

# Or on Windows
setup-enhanced-database.bat
```

### 2. Manual Setup
```bash
# 1. Create enhanced schema
mysql -u root -p < database/enhanced_schema.sql

# 2. Load sample data
mysql -u root -p < database/sample_data.sql

# 3. Create views and queries
mysql -u root -p < database/views_and_queries.sql

# 4. Install dependencies
cd backend && npm install

# 5. Start backend
npm start

# 6. Open frontend
cd ../frontend && open index.html
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All API endpoints require proper authentication headers.

### Response Format
```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "pages": 10
    }
}
```

### Error Format
```json
{
    "success": false,
    "message": "Error description",
    "error": "Detailed error information"
}
```

## Conclusion

The enhanced database structure provides a comprehensive foundation for the Internship Management System with:

- **Scalability**: Designed to handle large datasets efficiently
- **Flexibility**: Easily extensible for future requirements
- **Performance**: Optimized queries and proper indexing
- **Analytics**: Rich reporting and analytics capabilities
- **Security**: Robust data protection and access control
- **Maintainability**: Well-documented and structured code

The system now supports advanced features like skill matching, comprehensive analytics, real-time notifications, and detailed reporting, making it a complete solution for managing internship programs.
