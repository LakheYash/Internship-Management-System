-- Views and Complex Queries for Internship Management System
-- This file contains useful views and complex queries for reporting and analytics

USE Internship_db;

-- ==============================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- ==============================================

-- 1. Student Dashboard View
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
    COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.app_id END) as pending_applications,
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

-- 2. Company Dashboard View
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

-- 3. Job Application Summary View
CREATE OR REPLACE VIEW v_job_application_summary AS
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    c.industry,
    j.job_type,
    j.salary,
    j.city,
    j.state,
    j.posted_date,
    j.deadline,
    j.status as job_status,
    a.admin_id,
    CONCAT(ad.name) as admin_name,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.app_id END) as pending_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Under Review' THEN a.app_id END) as under_review_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Shortlisted' THEN a.app_id END) as shortlisted_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Rejected' THEN a.app_id END) as rejected_applications,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score
FROM jobs j
LEFT JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN admin ad ON j.admin_id = ad.admin_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
GROUP BY j.job_id, j.title, c.name, c.industry, j.job_type, j.salary, j.city, j.state, j.posted_date, j.deadline, j.status, a.admin_id, ad.name;

-- 4. Interview Schedule View
CREATE OR REPLACE VIEW v_interview_schedule AS
SELECT 
    i.interview_id,
    i.interview_date,
    i.mode,
    i.status as interview_status,
    i.interview_score,
    i.interviewer_name,
    i.interviewer_email,
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email as student_email,
    s.phone as student_phone,
    j.title as job_title,
    c.name as company_name,
    a.status as application_status,
    a.application_date
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
ORDER BY i.interview_date;

-- 5. Student Skills Matrix View
CREATE OR REPLACE VIEW v_student_skills_matrix AS
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    sk.skill_name,
    sk.category as skill_category,
    ss.proficiency_level,
    CASE 
        WHEN ss.proficiency_level = 'Expert' THEN 4
        WHEN ss.proficiency_level = 'Advanced' THEN 3
        WHEN ss.proficiency_level = 'Intermediate' THEN 2
        WHEN ss.proficiency_level = 'Beginner' THEN 1
        ELSE 0
    END as proficiency_score
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
ORDER BY s.stud_id, sk.category, sk.skill_name;

-- 6. Company Reviews Summary View
CREATE OR REPLACE VIEW v_company_reviews_summary AS
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    COUNT(cr.review_id) as total_reviews,
    AVG(cr.rating) as avg_rating,
    AVG(cr.work_environment_rating) as avg_work_environment_rating,
    AVG(cr.learning_opportunity_rating) as avg_learning_opportunity_rating,
    AVG(cr.management_rating) as avg_management_rating,
    COUNT(CASE WHEN cr.rating >= 4 THEN 1 END) as positive_reviews,
    COUNT(CASE WHEN cr.rating <= 2 THEN 1 END) as negative_reviews
FROM company c
LEFT JOIN company_reviews cr ON c.comp_id = cr.comp_id
GROUP BY c.comp_id, c.name, c.industry;

-- 7. Application Timeline View
CREATE OR REPLACE VIEW v_application_timeline AS
SELECT 
    a.app_id,
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    a.application_date,
    a.status as current_status,
    ash.new_status as status_change,
    ash.created_at as status_change_date,
    ash.change_reason,
    i.interview_date,
    i.interview_score
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN application_status_history ash ON a.app_id = ash.app_id
LEFT JOIN interview i ON a.app_id = i.app_id
ORDER BY a.app_id, ash.created_at;

-- 8. Monthly Statistics View
CREATE OR REPLACE VIEW v_monthly_statistics AS
SELECT 
    YEAR(j.posted_date) as year,
    MONTH(j.posted_date) as month,
    COUNT(DISTINCT j.job_id) as jobs_posted,
    COUNT(DISTINCT a.app_id) as applications_received,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as applications_selected,
    COUNT(DISTINCT i.interview_id) as interviews_conducted,
    AVG(i.interview_score) as avg_interview_score,
    COUNT(DISTINCT s.stud_id) as active_students,
    COUNT(DISTINCT c.comp_id) as active_companies
FROM jobs j
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN students s ON a.stud_id = s.stud_id
LEFT JOIN company c ON j.comp_id = c.comp_id
GROUP BY YEAR(j.posted_date), MONTH(j.posted_date)
ORDER BY year DESC, month DESC;

-- ==============================================
-- COMPLEX QUERIES AND JOINS
-- ==============================================

-- 1. Find students with highest interview scores
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

-- 2. Find companies with most applications
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

-- 3. Find students with matching skills for specific jobs
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

-- 4. Find students who haven't applied for any jobs
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.status,
    s.created_at as registration_date,
    COUNT(DISTINCT ss.skill_id) as skills_count,
    COUNT(DISTINCT p.proj_id) as projects_count
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
LEFT JOIN projects p ON s.stud_id = p.stud_id
WHERE a.app_id IS NULL
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.status, s.created_at
ORDER BY s.created_at DESC;

-- 5. Find jobs with no applications
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    j.job_type,
    j.salary,
    j.posted_date,
    j.deadline,
    j.status,
    DATEDIFF(j.deadline, CURDATE()) as days_until_deadline
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
WHERE a.app_id IS NULL AND j.status = 'Active'
ORDER BY j.posted_date DESC;

-- 6. Find students with most diverse skill sets
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    COUNT(DISTINCT ss.skill_id) as total_skills,
    COUNT(DISTINCT sk.category) as skill_categories,
    GROUP_CONCAT(DISTINCT sk.category ORDER BY sk.category SEPARATOR ', ') as categories,
    AVG(CASE 
        WHEN ss.proficiency_level = 'Expert' THEN 4
        WHEN ss.proficiency_level = 'Advanced' THEN 3
        WHEN ss.proficiency_level = 'Intermediate' THEN 2
        WHEN ss.proficiency_level = 'Beginner' THEN 1
        ELSE 0
    END) as avg_proficiency_score
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
GROUP BY s.stud_id, s.first_name, s.last_name
HAVING COUNT(DISTINCT sk.category) >= 3
ORDER BY skill_categories DESC, total_skills DESC;

-- 7. Find companies with highest rated internships
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    AVG(cr.rating) as avg_rating,
    COUNT(cr.review_id) as total_reviews,
    AVG(cr.work_environment_rating) as avg_work_environment,
    AVG(cr.learning_opportunity_rating) as avg_learning_opportunity,
    AVG(cr.management_rating) as avg_management
FROM company c
JOIN company_reviews cr ON c.comp_id = cr.comp_id
GROUP BY c.comp_id, c.name, c.industry
HAVING COUNT(cr.review_id) >= 2
ORDER BY avg_rating DESC;

-- 8. Find students with best application success rate
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    ROUND((COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) / COUNT(a.app_id)) * 100, 2) as success_rate,
    AVG(i.interview_score) as avg_interview_score
FROM students s
JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
GROUP BY s.stud_id, s.first_name, s.last_name
HAVING COUNT(a.app_id) >= 3
ORDER BY success_rate DESC, avg_interview_score DESC;

-- 9. Find upcoming interviews
SELECT 
    i.interview_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email as student_email,
    j.title as job_title,
    c.name as company_name,
    i.interview_date,
    i.mode,
    i.interviewer_name,
    i.interviewer_email,
    DATEDIFF(i.interview_date, NOW()) as days_until_interview
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE i.status = 'Scheduled' 
    AND i.interview_date >= NOW()
    AND i.interview_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY i.interview_date;

-- 10. Find expired applications that need attention
SELECT 
    a.app_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    a.application_date,
    j.deadline,
    a.status,
    DATEDIFF(NOW(), j.deadline) as days_since_deadline
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE j.deadline < NOW() 
    AND a.status IN ('Pending', 'Under Review')
ORDER BY days_since_deadline DESC;

-- ==============================================
-- ANALYTICS QUERIES
-- ==============================================

-- 1. Monthly application trends
SELECT 
    DATE_FORMAT(a.application_date, '%Y-%m') as month,
    COUNT(a.app_id) as applications,
    COUNT(DISTINCT a.stud_id) as unique_students,
    COUNT(DISTINCT a.job_id) as unique_jobs,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications
FROM application a
GROUP BY DATE_FORMAT(a.application_date, '%Y-%m')
ORDER BY month DESC;

-- 2. Skill demand analysis
SELECT 
    sk.skill_name,
    sk.category,
    COUNT(js.job_id) as jobs_requiring_skill,
    COUNT(ss.stud_id) as students_with_skill,
    ROUND((COUNT(ss.stud_id) / COUNT(js.job_id)) * 100, 2) as supply_demand_ratio
FROM skills sk
LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
GROUP BY sk.skill_id, sk.skill_name, sk.category
HAVING COUNT(js.job_id) > 0
ORDER BY jobs_requiring_skill DESC;

-- 3. Geographic distribution of opportunities
SELECT 
    j.city,
    j.state,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    AVG(j.salary) as avg_salary,
    COUNT(DISTINCT c.comp_id) as companies_in_area
FROM jobs j
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN company c ON j.comp_id = c.comp_id
WHERE j.status = 'Active'
GROUP BY j.city, j.state
ORDER BY total_jobs DESC;

-- 4. Interview performance analysis
SELECT 
    i.mode,
    COUNT(i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_score,
    MIN(i.interview_score) as min_score,
    MAX(i.interview_score) as max_score,
    COUNT(CASE WHEN i.interview_score >= 80 THEN 1 END) as high_performers,
    COUNT(CASE WHEN i.interview_score < 60 THEN 1 END) as low_performers
FROM interview i
WHERE i.interview_score IS NOT NULL
GROUP BY i.mode
ORDER BY avg_score DESC;

-- ==============================================
-- MAINTENANCE QUERIES
-- ==============================================

-- 1. Clean up old notifications (older than 30 days)
-- DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 2. Update student status based on application status
-- UPDATE students s
-- SET status = 'Selected'
-- WHERE s.stud_id IN (
--     SELECT DISTINCT a.stud_id 
--     FROM application a 
--     WHERE a.status = 'Selected'
-- );

-- 3. Archive completed applications older than 1 year
-- CREATE TABLE application_archive AS 
-- SELECT * FROM application 
-- WHERE application_date < DATE_SUB(NOW(), INTERVAL 1 YEAR)
-- AND status IN ('Selected', 'Rejected');

-- ==============================================
-- FINAL MESSAGE
-- ==============================================

SELECT 'Views and complex queries created successfully!' as Status;
SELECT 'System is ready for advanced reporting and analytics' as Ready_Status;
