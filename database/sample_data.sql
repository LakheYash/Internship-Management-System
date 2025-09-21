-- Sample Data for Internship Management System
-- This file contains comprehensive DML statements for testing and demonstration

USE Internship_db;

-- ==============================================
-- SAMPLE DATA INSERTIONS
-- ==============================================

-- Insert additional HR details
INSERT INTO hr_details (comp_id, name, hr_phone, email) VALUES
(1, 'John Smith', '+1-555-0101', 'john@techcorp.com'),
(1, 'Jane Doe', '+1-555-0102', 'jane@techcorp.com'),
(2, 'Sarah Johnson', '+1-555-0103', 'sarah@dataflow.com'),
(2, 'Mike Chen', '+1-555-0104', 'mike@dataflow.com'),
(3, 'Mike Wilson', '+1-555-0105', 'mike@greenenergy.com'),
(4, 'Lisa Brown', '+1-555-0106', 'lisa@financefirst.com'),
(5, 'Dr. Robert Davis', '+1-555-0107', 'robert@healthtech.com');

-- Insert additional skills
INSERT INTO skills (skill_name, category) VALUES
('Vue.js', 'Frontend'),
('Angular', 'Frontend'),
('Django', 'Backend'),
('Flask', 'Backend'),
('PostgreSQL', 'Database'),
('MongoDB', 'Database'),
('Redis', 'Database'),
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),
('AWS', 'Cloud'),
('Azure', 'Cloud'),
('GCP', 'Cloud'),
('TensorFlow', 'AI/ML'),
('PyTorch', 'AI/ML'),
('Pandas', 'Data Science'),
('NumPy', 'Data Science'),
('Scikit-learn', 'Data Science'),
('Tableau', 'Analytics'),
('Power BI', 'Analytics'),
('Figma', 'Design'),
('Adobe XD', 'Design'),
('Photoshop', 'Design'),
('Agile', 'Methodology'),
('Scrum', 'Methodology'),
('Leadership', 'Soft Skills'),
('Communication', 'Soft Skills'),
('Problem Solving', 'Soft Skills'),
('Teamwork', 'Soft Skills');

-- Insert job-skills relationships
INSERT INTO job_skills (job_id, skill_id, required_level, is_mandatory) VALUES
-- Software Development Intern (Job ID 1)
(1, 1, 'Advanced', TRUE),   -- JavaScript
(1, 3, 'Advanced', TRUE),   -- React
(1, 4, 'Intermediate', TRUE), -- Node.js
(1, 5, 'Intermediate', FALSE), -- SQL
(1, 8, 'Beginner', FALSE),  -- Docker

-- Data Analytics Intern (Job ID 2)
(2, 2, 'Advanced', TRUE),   -- Python
(2, 5, 'Advanced', TRUE),   -- SQL
(2, 6, 'Advanced', TRUE),   -- Machine Learning
(2, 8, 'Intermediate', FALSE), -- Data Analysis
(2, 15, 'Intermediate', FALSE), -- Pandas

-- Business Development Intern (Job ID 3)
(3, 7, 'Advanced', TRUE),   -- Project Management
(3, 8, 'Intermediate', TRUE), -- Data Analysis
(3, 12, 'Advanced', TRUE),  -- Marketing
(3, 25, 'Advanced', TRUE),  -- Leadership
(3, 26, 'Advanced', TRUE),  -- Communication

-- Engineering Intern (Job ID 4)
(4, 9, 'Advanced', TRUE),   -- Java
(4, 10, 'Advanced', TRUE),  -- C++
(4, 11, 'Intermediate', TRUE), -- System Design
(4, 8, 'Intermediate', FALSE), -- Data Analysis
(4, 27, 'Advanced', TRUE),  -- Problem Solving

-- Environmental Research Intern (Job ID 5)
(5, 8, 'Advanced', TRUE),   -- Data Analysis
(5, 13, 'Advanced', TRUE),  -- Sustainability
(5, 14, 'Advanced', TRUE),  -- Research
(5, 2, 'Intermediate', FALSE), -- Python
(5, 5, 'Intermediate', FALSE); -- SQL

-- Insert student profiles
INSERT INTO student_profile (stud_id, bio, linkedin_url, github_url, portfolio_url, availability_start, availability_end, preferred_job_types, preferred_locations, salary_expectation) VALUES
(1, 'Passionate full-stack developer with 3+ years of experience in web development. Love creating innovative solutions and learning new technologies.', 'https://linkedin.com/in/alice-johnson', 'https://github.com/alicejohnson', 'https://alicejohnson.dev', '2024-06-01', '2024-08-31', '["Internship", "Full-time"]', '["San Francisco", "Palo Alto", "Remote"]', 3500.00),
(2, 'Data science enthusiast with strong background in machine learning and statistical analysis. Excited to apply my skills in real-world projects.', 'https://linkedin.com/in/bob-smith', 'https://github.com/bobsmith', 'https://bobsmith.portfolio.com', '2024-06-01', '2024-12-31', '["Internship", "Full-time", "Part-time"]', '["New York", "Boston", "Remote"]', 4000.00),
(3, 'Business administration graduate with focus on marketing and strategy. Experienced in digital marketing campaigns and business analysis.', 'https://linkedin.com/in/carol-davis', 'https://github.com/caroldavis', 'https://caroldavis.business', '2024-05-15', '2024-09-15', '["Internship", "Full-time"]', '["San Francisco", "Los Angeles", "Chicago"]', 3000.00),
(4, 'Engineering student passionate about software development and system design. Strong problem-solving skills and attention to detail.', 'https://linkedin.com/in/david-wilson', 'https://github.com/davidwilson', 'https://davidwilson.engineer', '2024-06-01', '2024-08-31', '["Internship", "Full-time"]', '["Chicago", "Boston", "Austin"]', 3800.00),
(5, 'Environmental science major with focus on sustainability and renewable energy. Committed to making a positive impact on the environment.', 'https://linkedin.com/in/emma-brown', 'https://github.com/emmabrown', 'https://emmabrown.environment', '2024-05-01', '2024-12-31', '["Internship", "Full-time", "Part-time"]', '["Austin", "Portland", "Remote"]', 2800.00);

-- Insert sample evaluations
INSERT INTO evaluations (app_id, evaluator_id, evaluator_type, technical_skills, communication, teamwork, punctuality, overall_rating, comments, evaluation_date) VALUES
(1, 1, 'supervisor', 4, 5, 4, 5, 4.5, 'Excellent technical skills and communication. Shows great potential.', '2024-07-15'),
(2, 1, 'supervisor', 5, 4, 5, 4, 4.5, 'Outstanding data analysis skills. Very collaborative team player.', '2024-07-20'),
(3, 1, 'supervisor', 3, 5, 4, 5, 4.25, 'Strong business acumen and excellent communication skills.', '2024-07-25'),
(4, 1, 'supervisor', 5, 4, 4, 4, 4.25, 'Excellent engineering skills and problem-solving abilities.', '2024-08-01'),
(5, 1, 'supervisor', 4, 4, 5, 4, 4.25, 'Great research skills and environmental awareness.', '2024-08-05');

-- Insert sample tasks
INSERT INTO tasks (app_id, title, description, priority, status, assigned_date, due_date, completed_date) VALUES
(1, 'Implement User Authentication', 'Create login and registration functionality using JWT tokens', 'High', 'Completed', '2024-06-15', '2024-06-25', '2024-06-23'),
(1, 'Design Database Schema', 'Design and implement database tables for user management', 'Medium', 'Completed', '2024-06-20', '2024-06-30', '2024-06-28'),
(1, 'Create API Documentation', 'Write comprehensive API documentation for all endpoints', 'Low', 'In Progress', '2024-07-01', '2024-07-15', NULL),
(2, 'Data Analysis Report', 'Analyze customer data and create insights report', 'High', 'Completed', '2024-06-10', '2024-06-20', '2024-06-18'),
(2, 'Machine Learning Model', 'Develop predictive model for customer behavior', 'High', 'In Progress', '2024-06-25', '2024-07-10', NULL),
(3, 'Market Research', 'Conduct market analysis for new product launch', 'Medium', 'Completed', '2024-06-05', '2024-06-15', '2024-06-12'),
(3, 'Competitor Analysis', 'Analyze competitor strategies and pricing', 'Medium', 'Pending', '2024-07-01', '2024-07-15', NULL),
(4, 'System Architecture Design', 'Design scalable system architecture for new platform', 'High', 'Completed', '2024-06-01', '2024-06-15', '2024-06-13'),
(4, 'Code Review Process', 'Implement automated code review process', 'Medium', 'In Progress', '2024-06-20', '2024-07-05', NULL),
(5, 'Environmental Impact Assessment', 'Assess environmental impact of new manufacturing process', 'High', 'Completed', '2024-05-15', '2024-05-30', '2024-05-28'),
(5, 'Sustainability Report', 'Create comprehensive sustainability report', 'Medium', 'Pending', '2024-07-01', '2024-07-20', NULL);

-- Insert additional students
INSERT INTO students (first_name, middle_name, last_name, city, state, pin, age, email, phone, status) VALUES
('Michael', 'James', 'Taylor', 'Seattle', 'WA', '98101', 23, 'michael.taylor@email.com', '+1-555-1006', 'Available'),
('Sarah', 'Elizabeth', 'Anderson', 'Portland', 'OR', '97201', 22, 'sarah.anderson@email.com', '+1-555-1007', 'Available'),
('James', 'Robert', 'Martinez', 'Denver', 'CO', '80201', 24, 'james.martinez@email.com', '+1-555-1008', 'Available'),
('Emily', 'Grace', 'Thompson', 'Miami', 'FL', '33101', 21, 'emily.thompson@email.com', '+1-555-1009', 'Available'),
('Daniel', 'Christopher', 'Garcia', 'Phoenix', 'AZ', '85001', 25, 'daniel.garcia@email.com', '+1-555-1010', 'Available');

-- Insert additional education records
INSERT INTO education (stud_id, degree, college, cgpa, start_date, end_date) VALUES
(6, 'Bachelor of Science in Software Engineering', 'University of Washington', 3.9, '2020-09-01', '2024-06-01'),
(7, 'Bachelor of Arts in Digital Marketing', 'Portland State University', 3.6, '2020-09-01', '2024-06-01'),
(8, 'Master of Science in Computer Science', 'University of Colorado', 3.8, '2022-09-01', '2024-06-01'),
(9, 'Bachelor of Science in Environmental Engineering', 'University of Miami', 3.7, '2020-09-01', '2024-06-01'),
(10, 'Bachelor of Science in Information Technology', 'Arizona State University', 3.5, '2020-09-01', '2024-06-01');

-- Insert additional projects
INSERT INTO projects (stud_id, project_name, project_type, description, start_date, end_date, technologies_used) VALUES
(6, 'Mobile App for Task Management', 'Mobile Development', 'Cross-platform mobile app for personal and team task management', '2023-06-01', '2023-12-01', 'React Native, Firebase, JavaScript'),
(7, 'Social Media Marketing Campaign', 'Digital Marketing', 'Comprehensive social media strategy for local business', '2023-07-01', '2023-10-01', 'Facebook Ads, Instagram, Analytics'),
(8, 'Distributed System Architecture', 'System Design', 'Design and implementation of scalable microservices architecture', '2023-08-01', '2024-01-01', 'Docker, Kubernetes, Go, PostgreSQL'),
(9, 'Water Quality Monitoring System', 'Environmental Tech', 'IoT-based system for real-time water quality monitoring', '2023-09-01', '2024-02-01', 'Arduino, Python, IoT, Data Analysis'),
(10, 'E-learning Platform', 'Web Development', 'Full-stack platform for online education with video streaming', '2023-10-01', '2024-03-01', 'Vue.js, Node.js, MongoDB, AWS');

-- Insert additional jobs
INSERT INTO jobs (comp_id, admin_id, title, description, required_skills, salary, job_type, city, state, posted_date, deadline, status, requirements) VALUES
(1, 1, 'Frontend Development Intern', 'React and Vue.js development internship', 'JavaScript, React, Vue.js, CSS', 3200.00, 'Internship', 'San Francisco', 'CA', '2024-02-01', '2024-02-15', 'Active', 'Strong frontend development skills required'),
(2, 1, 'Machine Learning Intern', 'ML model development and deployment internship', 'Python, TensorFlow, PyTorch, Statistics', 3500.00, 'Internship', 'New York', 'NY', '2024-02-05', '2024-02-20', 'Active', 'ML and deep learning experience required'),
(3, 1, 'Sustainability Analyst Intern', 'Environmental impact analysis internship', 'Data Analysis, Sustainability, Research', 2400.00, 'Internship', 'Austin', 'TX', '2024-02-10', '2024-02-25', 'Active', 'Environmental science background preferred'),
(4, 1, 'Financial Technology Intern', 'FinTech application development internship', 'Java, Spring Boot, SQL, Financial Knowledge', 3300.00, 'Internship', 'Chicago', 'IL', '2024-02-15', '2024-03-01', 'Active', 'Finance and programming skills required'),
(5, 1, 'Healthcare Data Analyst Intern', 'Medical data analysis and visualization internship', 'Python, SQL, Healthcare Data, Statistics', 3100.00, 'Internship', 'Boston', 'MA', '2024-02-20', '2024-03-05', 'Active', 'Healthcare and data analysis experience required');

-- Insert additional applications
INSERT INTO application (stud_id, job_id, status, application_date, cover_letter) VALUES
(6, 6, 'Pending', '2024-02-02', 'I am excited to apply for the Frontend Development Intern position...'),
(7, 7, 'Under Review', '2024-02-06', 'I am interested in the Machine Learning Intern position...'),
(8, 8, 'Shortlisted', '2024-02-11', 'I would like to apply for the Sustainability Analyst Intern position...'),
(9, 9, 'Pending', '2024-02-16', 'I am applying for the Financial Technology Intern position...'),
(10, 10, 'Under Review', '2024-02-21', 'I am interested in the Healthcare Data Analyst Intern position...'),
(1, 6, 'Pending', '2024-02-03', 'I am also interested in the Frontend Development Intern position...'),
(2, 7, 'Pending', '2024-02-07', 'I would like to apply for the Machine Learning Intern position...'),
(3, 8, 'Pending', '2024-02-12', 'I am interested in the Sustainability Analyst Intern position...');

-- Insert additional interviews
INSERT INTO interview (app_id, stud_id, mode, interview_date, interview_score, status, interviewer_name, interviewer_email) VALUES
(6, 6, 'Online', '2024-02-25 10:00:00', NULL, 'Scheduled', 'Jane Doe', 'jane@techcorp.com'),
(7, 7, 'Video', '2024-02-28 14:00:00', NULL, 'Scheduled', 'Mike Chen', 'mike@dataflow.com'),
(8, 8, 'Online', '2024-03-05 11:00:00', NULL, 'Scheduled', 'Mike Wilson', 'mike@greenenergy.com'),
(9, 9, 'Offline', '2024-03-10 09:00:00', NULL, 'Scheduled', 'Lisa Brown', 'lisa@financefirst.com'),
(10, 10, 'Phone', '2024-03-15 15:00:00', NULL, 'Scheduled', 'Dr. Robert Davis', 'robert@healthtech.com');

-- Insert additional notifications
INSERT INTO notifications (stud_id, admin_id, msg, type, month, day) VALUES
(6, 1, 'Your application has been received and is under review', 'info', 2, 2),
(7, 1, 'Congratulations! You have been shortlisted for the interview', 'success', 2, 6),
(8, 1, 'Your interview is scheduled for next week', 'reminder', 2, 11),
(9, 1, 'Please submit your additional documents by the deadline', 'warning', 2, 16),
(10, 1, 'Your application status has been updated', 'info', 2, 21),
(1, 1, 'New job opportunities matching your profile are available', 'info', 2, 3),
(2, 1, 'Your interview performance was excellent', 'success', 2, 7),
(3, 1, 'Additional information required for your application', 'warning', 2, 12);

-- Insert student-skills relationships for new students
INSERT INTO student_skills (stud_id, skill_id, proficiency_level) VALUES
(6, 1, 'Expert'), (6, 3, 'Advanced'), (6, 16, 'Advanced'), (6, 17, 'Intermediate'),
(7, 12, 'Advanced'), (7, 8, 'Advanced'), (7, 18, 'Expert'), (7, 19, 'Advanced'),
(8, 2, 'Expert'), (8, 9, 'Advanced'), (8, 10, 'Advanced'), (8, 11, 'Intermediate'),
(9, 13, 'Expert'), (9, 2, 'Advanced'), (9, 8, 'Advanced'), (9, 14, 'Advanced'),
(10, 1, 'Advanced'), (10, 2, 'Advanced'), (10, 4, 'Advanced'), (10, 5, 'Advanced');

-- Insert company reviews
INSERT INTO company_reviews (comp_id, stud_id, rating, review_text, work_environment_rating, learning_opportunity_rating, management_rating, is_anonymous) VALUES
(1, 1, 5, 'Excellent work environment with great learning opportunities. The team is very supportive and the projects are challenging.', 5, 5, 5, FALSE),
(2, 2, 4, 'Great company for data science work. Learned a lot about machine learning and big data processing.', 4, 5, 4, FALSE),
(3, 3, 4, 'Good experience in business development. The team is professional and the work is meaningful.', 4, 4, 4, FALSE),
(4, 4, 5, 'Outstanding engineering culture. Great mentors and cutting-edge technology projects.', 5, 5, 5, FALSE),
(5, 5, 4, 'Meaningful work in healthcare technology. Good work-life balance and supportive management.', 4, 4, 5, FALSE);

-- Insert email templates
INSERT INTO email_templates (template_name, subject, body, variables, is_active) VALUES
('application_received', 'Application Received - {{job_title}}', 'Dear {{student_name}},\n\nThank you for your application for the {{job_title}} position at {{company_name}}. We have received your application and it is currently under review.\n\nWe will get back to you within 5-7 business days.\n\nBest regards,\nHR Team', '["student_name", "job_title", "company_name"]', TRUE),
('interview_scheduled', 'Interview Scheduled - {{job_title}}', 'Dear {{student_name}},\n\nCongratulations! You have been selected for an interview for the {{job_title}} position at {{company_name}}.\n\nInterview Details:\nDate: {{interview_date}}\nTime: {{interview_time}}\nMode: {{interview_mode}}\nInterviewer: {{interviewer_name}}\n\nPlease confirm your attendance.\n\nBest regards,\nHR Team', '["student_name", "job_title", "company_name", "interview_date", "interview_time", "interview_mode", "interviewer_name"]', TRUE),
('application_rejected', 'Application Update - {{job_title}}', 'Dear {{student_name}},\n\nThank you for your interest in the {{job_title}} position at {{company_name}}. After careful consideration, we have decided to move forward with other candidates.\n\nWe encourage you to apply for other opportunities that match your profile.\n\nBest regards,\nHR Team', '["student_name", "job_title", "company_name"]', TRUE),
('application_selected', 'Congratulations! You have been selected - {{job_title}}', 'Dear {{student_name}},\n\nCongratulations! We are pleased to inform you that you have been selected for the {{job_title}} position at {{company_name}}.\n\nNext steps will be communicated shortly.\n\nWelcome to the team!\n\nBest regards,\nHR Team', '["student_name", "job_title", "company_name"]', TRUE);

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('application_deadline_days', '30', 'number', 'Default number of days for application deadline', FALSE),
('max_file_size_mb', '10', 'number', 'Maximum file upload size in MB', TRUE),
('allowed_file_types', '["pdf", "doc", "docx", "jpg", "png"]', 'json', 'Allowed file types for uploads', TRUE),
('email_notifications_enabled', 'true', 'boolean', 'Enable email notifications', FALSE),
('interview_reminder_hours', '24', 'number', 'Hours before interview to send reminder', FALSE),
('max_applications_per_student', '10', 'number', 'Maximum applications per student', TRUE),
('system_maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', FALSE),
('default_application_status', 'Pending', 'string', 'Default status for new applications', FALSE);

-- Insert file uploads
INSERT INTO file_uploads (stud_id, file_name, original_name, file_path, file_size, file_type, upload_type, is_public) VALUES
(1, 'resume_alice_johnson_2024.pdf', 'Alice_Johnson_Resume.pdf', '/uploads/resumes/resume_alice_johnson_2024.pdf', 1024000, 'application/pdf', 'resume', FALSE),
(2, 'resume_bob_smith_2024.pdf', 'Bob_Smith_Resume.pdf', '/uploads/resumes/resume_bob_smith_2024.pdf', 1152000, 'application/pdf', 'resume', FALSE),
(3, 'resume_carol_davis_2024.pdf', 'Carol_Davis_Resume.pdf', '/uploads/resumes/resume_carol_davis_2024.pdf', 980000, 'application/pdf', 'resume', FALSE),
(4, 'resume_david_wilson_2024.pdf', 'David_Wilson_Resume.pdf', '/uploads/resumes/resume_david_wilson_2024.pdf', 1080000, 'application/pdf', 'resume', FALSE),
(5, 'resume_emma_brown_2024.pdf', 'Emma_Brown_Resume.pdf', '/uploads/resumes/resume_emma_brown_2024.pdf', 950000, 'application/pdf', 'resume', FALSE);

-- Insert application status history
INSERT INTO application_status_history (app_id, old_status, new_status, changed_by, change_reason) VALUES
(1, 'Pending', 'Under Review', 1, 'Application moved to review phase'),
(2, 'Under Review', 'Shortlisted', 1, 'Candidate meets requirements'),
(3, 'Shortlisted', 'Selected', 1, 'Excellent interview performance'),
(4, 'Pending', 'Under Review', 1, 'Application under review'),
(5, 'Under Review', 'Shortlisted', 1, 'Strong candidate profile');

-- Insert system logs
INSERT INTO system_logs (user_id, user_type, action, table_name, record_id, ip_address, user_agent) VALUES
(1, 'student', 'LOGIN', 'students', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, 'student', 'APPLICATION_CREATED', 'application', 2, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(1, 'admin', 'STATUS_UPDATE', 'application', 1, '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 'student', 'PROFILE_UPDATE', 'students', 3, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
(1, 'admin', 'JOB_CREATED', 'jobs', 6, '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- ==============================================
-- DATA VALIDATION QUERIES
-- ==============================================

-- Verify data integrity
SELECT 'Data insertion completed successfully!' as Status;
SELECT COUNT(*) as total_students FROM students;
SELECT COUNT(*) as total_companies FROM company;
SELECT COUNT(*) as total_jobs FROM jobs;
SELECT COUNT(*) as total_applications FROM application;
SELECT COUNT(*) as total_interviews FROM interview;
SELECT COUNT(*) as total_skills FROM skills;
SELECT COUNT(*) as total_projects FROM projects;
SELECT COUNT(*) as total_education FROM education;
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT COUNT(*) as total_reviews FROM company_reviews;
SELECT COUNT(*) as total_file_uploads FROM file_uploads;
SELECT COUNT(*) as total_email_templates FROM email_templates;
SELECT COUNT(*) as total_system_settings FROM system_settings;
