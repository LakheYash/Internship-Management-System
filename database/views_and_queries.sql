-- Corrected Views and Complex Queries for Internship Management System
-- This file contains useful views and complex queries aligned with the corrected schema

USE Internship_db;

-- ==============================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- ==============================================

-- 1. Student Dashboard View (corrected)
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

-- 2. Company Dashboard View (corrected to use hr table)
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
    COUNT(DISTINCT h.hr_id) as total_hr_contacts,
    GROUP_CONCAT(DISTINCT h.hr_name ORDER BY h.hr_name SEPARATOR ', ') as hr_names
FROM company c
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN hr h ON c.comp_id = h.comp_id
GROUP BY c.comp_id, c.name, c.industry, c.city, c.state, c.contact_no, c.website, c.is_active;

-- 3. Job Application Summary View (corrected)
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
    j.admin_id,
    ad.name as admin_name,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.app_id END) as pending_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Under Review' THEN a.app_id END) as under_review_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Shortlisted' THEN a.app_id END) as shortlisted_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Rejected' THEN a.app_id END) as rejected_applications,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score,
    GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as required_skills
FROM jobs j
LEFT JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN admin ad ON j.admin_id = ad.admin_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN job_skills js ON j.job_id = js.job_id
LEFT JOIN skills sk ON js.skill_id = sk.skill_id
GROUP BY j.job_id, j.title, c.name, c.industry, j.job_type, j.salary, j.city, j.state, j.posted_date, j.deadline, j.status, j.admin_id, ad.name;

-- 4. Interview Schedule View (corrected with HR relationship)
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
    h.hr_name,
    h.hr_email,
    a.status as application_status,
    a.application_date
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN hr h ON i.hr_id = h.hr_id
ORDER BY i.interview_date;

-- 5. Student Skills Matrix View (corrected with years_experience)
CREATE OR REPLACE VIEW v_student_skills_matrix AS
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    sk.skill_name,
    sk.category as skill_category,
    ss.proficiency_level,
    ss.years_experience,
    ss.certified,
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

-- 6. Job Skills Requirements View (new)
CREATE OR REPLACE VIEW v_job_skills_requirements AS
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    sk.skill_name,
    sk.category as skill_category,
    js.required_level,
    js.is_mandatory,
    js.weightage,
    COUNT(ss.stud_id) as students_with_skill,
    COUNT(CASE WHEN ss.proficiency_level = js.required_level 
               OR (ss.proficiency_level = 'Expert' AND js.required_level IN ('Advanced', 'Intermediate', 'Beginner'))
               OR (ss.proficiency_level = 'Advanced' AND js.required_level IN ('Intermediate', 'Beginner'))
               OR (ss.proficiency_level = 'Intermediate' AND js.required_level = 'Beginner')
          THEN ss.stud_id END) as qualified_students
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
JOIN job_skills js ON j.job_id = js.job_id
JOIN skills sk ON js.skill_id = sk.skill_id
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
GROUP BY j.job_id, j.title, c.name, sk.skill_name, sk.category, js.required_level, js.is_mandatory, js.weightage
ORDER BY j.job_id, js.is_mandatory DESC, js.weightage DESC;

-- 7. Application Timeline View (corrected)
CREATE OR REPLACE VIEW v_application_timeline AS
SELECT 
    a.app_id,
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    a.application_date,
    a.status as current_status,
    ash.old_status,
    ash.new_status,
    ash.changed_at as status_change_date,
    ash.change_reason,
    admin.name as changed_by_name,
    i.interview_date,
    i.interview_score
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN application_status_history ash ON a.app_id = ash.app_id
LEFT JOIN admin ON ash.changed_by = admin.admin_id
LEFT JOIN interview i ON a.app_id = i.app_id
ORDER BY a.app_id, ash.changed_at;

-- 8. Monthly Statistics View (corrected)
CREATE OR REPLACE VIEW v_monthly_statistics AS
SELECT 
    YEAR(j.posted_date) as year,
    MONTH(j.posted_date) as month,
    MONTHNAME(j.posted_date) as month_name,
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
GROUP BY YEAR(j.posted_date), MONTH(j.posted_date), MONTHNAME(j.posted_date)
ORDER BY year DESC, month DESC;

-- ==============================================
-- COMPLEX QUERIES AND JOINS (CORRECTED)
-- ==============================================

-- 1. Find students with highest interview scores
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    AVG(i.interview_score) as avg_interview_score,
    COUNT(i.interview_id) as total_interviews,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_score IS NOT NULL
GROUP BY s.stud_id, s.first_name, s.last_name, s.email
HAVING COUNT(i.interview_id) >= 2
ORDER BY avg_interview_score DESC
LIMIT 10;

-- 2. Find companies with most applications (corrected)
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    CASE 
        WHEN COUNT(DISTINCT a.app_id) > 0 THEN 
            ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / COUNT(DISTINCT a.app_id)) * 100, 2)
        ELSE 0 
    END as selection_rate_percentage
FROM company c
JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
GROUP BY c.comp_id, c.name, c.industry
HAVING COUNT(DISTINCT a.app_id) > 0
ORDER BY total_applications DESC;

-- 3. Find students with matching skills for specific jobs (corrected)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as matching_skills,
    COUNT(DISTINCT js.skill_id) as matching_skills_count,
    (SELECT COUNT(DISTINCT skill_id) FROM job_skills WHERE job_id = j.job_id) as total_required_skills,
    ROUND((COUNT(DISTINCT js.skill_id) / (SELECT COUNT(DISTINCT skill_id) FROM job_skills WHERE job_id = j.job_id)) * 100, 2) as skill_match_percentage
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
JOIN job_skills js ON sk.skill_id = js.skill_id
JOIN jobs j ON js.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE j.status = 'Active'
    AND (ss.proficiency_level = js.required_level 
         OR (ss.proficiency_level = 'Expert' AND js.required_level IN ('Advanced', 'Intermediate', 'Beginner'))
         OR (ss.proficiency_level = 'Advanced' AND js.required_level IN ('Intermediate', 'Beginner'))
         OR (ss.proficiency_level = 'Intermediate' AND js.required_level = 'Beginner'))
GROUP BY s.stud_id, s.first_name, s.last_name, j.job_id, j.title, c.name
HAVING skill_match_percentage >= 50
ORDER BY skill_match_percentage DESC, matching_skills_count DESC;

-- 4. Find students who haven't applied for any jobs
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.phone,
    s.status,
    s.city,
    s.state,
    s.created_at as registration_date,
    COUNT(DISTINCT ss.skill_id) as skills_count,
    COUNT(DISTINCT p.proj_id) as projects_count,
    GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as skills_list
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
LEFT JOIN projects p ON s.stud_id = p.stud_id
WHERE a.app_id IS NULL
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.phone, s.status, s.city, s.state, s.created_at
ORDER BY s.created_at DESC;

-- 5. Find jobs with no applications
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    j.job_type,
    j.salary,
    j.city,
    j.state,
    j.posted_date,
    j.deadline,
    j.status,
    CASE 
        WHEN j.deadline >= CURDATE() THEN DATEDIFF(j.deadline, CURDATE())
        ELSE DATEDIFF(CURDATE(), j.deadline) * -1
    END as days_until_deadline,
    GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as required_skills
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN job_skills js ON j.job_id = js.job_id
LEFT JOIN skills sk ON js.skill_id = sk.skill_id
WHERE a.app_id IS NULL AND j.status = 'Active'
GROUP BY j.job_id, j.title, c.name, j.job_type, j.salary, j.city, j.state, j.posted_date, j.deadline, j.status
ORDER BY j.posted_date DESC;

-- 6. Find students with most diverse skill sets (corrected)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    COUNT(DISTINCT ss.skill_id) as total_skills,
    COUNT(DISTINCT sk.category) as skill_categories,
    GROUP_CONCAT(DISTINCT sk.category ORDER BY sk.category SEPARATOR ', ') as categories,
    AVG(CASE 
        WHEN ss.proficiency_level = 'Expert' THEN 4
        WHEN ss.proficiency_level = 'Advanced' THEN 3
        WHEN ss.proficiency_level = 'Intermediate' THEN 2
        WHEN ss.proficiency_level = 'Beginner' THEN 1
        ELSE 0
    END) as avg_proficiency_score,
    AVG(ss.years_experience) as avg_years_experience,
    COUNT(CASE WHEN ss.certified = TRUE THEN 1 END) as certified_skills_count
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email
HAVING COUNT(DISTINCT sk.category) >= 3
ORDER BY skill_categories DESC, total_skills DESC, avg_proficiency_score DESC;

-- 7. Find students with best application success rate (corrected)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    COUNT(CASE WHEN a.status = 'Shortlisted' THEN 1 END) as shortlisted_applications,
    ROUND((COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) / COUNT(a.app_id)) * 100, 2) as success_rate,
    AVG(i.interview_score) as avg_interview_score,
    COUNT(DISTINCT i.interview_id) as total_interviews
FROM students s
JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email
HAVING COUNT(a.app_id) >= 3
ORDER BY success_rate DESC, avg_interview_score DESC;

-- 8. Find upcoming interviews (corrected)
SELECT 
    i.interview_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email as student_email,
    s.phone as student_phone,
    j.title as job_title,
    c.name as company_name,
    i.interview_date,
    i.mode,
    i.interviewer_name,
    i.interviewer_email,
    h.hr_name as hr_contact,
    h.hr_email as hr_email,
    DATEDIFF(DATE(i.interview_date), CURDATE()) as days_until_interview
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN hr h ON i.hr_id = h.hr_id
WHERE i.status = 'Scheduled' 
    AND i.interview_date >= NOW()
    AND i.interview_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY i.interview_date;

-- 9. Find expired applications that need attention
SELECT 
    a.app_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email as student_email,
    j.title as job_title,
    c.name as company_name,
    a.application_date,
    j.deadline,
    a.status,
    DATEDIFF(CURDATE(), j.deadline) as days_since_deadline
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE j.deadline < CURDATE() 
    AND a.status IN ('Pending', 'Under Review')
ORDER BY days_since_deadline DESC;

-- ==============================================
-- ANALYTICS QUERIES (CORRECTED)
-- ==============================================

-- 1. Monthly application trends
SELECT 
    DATE_FORMAT(a.application_date, '%Y-%m') as month,
    COUNT(a.app_id) as applications,
    COUNT(DISTINCT a.stud_id) as unique_students,
    COUNT(DISTINCT a.job_id) as unique_jobs,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    ROUND((COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) / COUNT(a.app_id)) * 100, 2) as selection_rate
FROM application a
WHERE a.application_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(a.application_date, '%Y-%m')
ORDER BY month DESC;

-- 2. Skill demand analysis (corrected)
SELECT 
    sk.skill_name,
    sk.category,
    COUNT(DISTINCT js.job_id) as jobs_requiring_skill,
    COUNT(DISTINCT ss.stud_id) as students_with_skill,
    COUNT(DISTINCT CASE WHEN js.is_mandatory = TRUE THEN js.job_id END) as jobs_requiring_mandatory,
    AVG(CASE 
        WHEN js.required_level = 'Expert' THEN 4
        WHEN js.required_level = 'Advanced' THEN 3
        WHEN js.required_level = 'Intermediate' THEN 2
        WHEN js.required_level = 'Beginner' THEN 1
        ELSE 0
    END) as avg_required_level,
    CASE 
        WHEN COUNT(DISTINCT js.job_id) > 0 THEN 
            ROUND((COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id)), 2)
        ELSE 0
    END as supply_demand_ratio
FROM skills sk
LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
GROUP BY sk.skill_id, sk.skill_name, sk.category
HAVING COUNT(DISTINCT js.job_id) > 0
ORDER BY jobs_requiring_skill DESC, jobs_requiring_mandatory DESC;

-- 3. Geographic distribution of opportunities
SELECT 
    j.city,
    j.state,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    AVG(j.salary) as avg_salary,
    MIN(j.salary) as min_salary,
    MAX(j.salary) as max_salary,
    COUNT(DISTINCT c.comp_id) as companies_in_area,
    COUNT(DISTINCT j.comp_id) as active_companies
FROM jobs j
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN company c ON j.comp_id = c.comp_id
WHERE j.status = 'Active' AND j.city IS NOT NULL
GROUP BY j.city, j.state
HAVING COUNT(DISTINCT j.job_id) > 0
ORDER BY total_jobs DESC, total_applications DESC;

-- 4. Interview performance analysis (corrected)
SELECT 
    i.mode,
    COUNT(i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_score,
    MIN(i.interview_score) as min_score,
    MAX(i.interview_score) as max_score,
    STDDEV(i.interview_score) as score_std_dev,
    COUNT(CASE WHEN i.interview_score >= 80 THEN 1 END) as high_performers,
    COUNT(CASE WHEN i.interview_score < 60 THEN 1 END) as low_performers,
    ROUND((COUNT(CASE WHEN i.interview_score >= 80 THEN 1 END) / COUNT(i.interview_id)) * 100, 2) as high_performer_rate
FROM interview i
WHERE i.interview_score IS NOT NULL AND i.status = 'Completed'
GROUP BY i.mode
ORDER BY avg_score DESC;

-- 5. Job type and salary analysis
SELECT 
    j.job_type,
    COUNT(j.job_id) as total_jobs,
    AVG(j.salary) as avg_salary,
    MIN(j.salary) as min_salary,
    MAX(j.salary) as max_salary,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    ROUND(AVG(DATEDIFF(j.deadline, j.posted_date)), 0) as avg_application_period_days
FROM jobs j
LEFT JOIN application a ON j.job_id = a.job_id
WHERE j.salary IS NOT NULL
GROUP BY j.job_type
ORDER BY avg_salary DESC;

-- ==============================================
-- UTILITY QUERIES
-- ==============================================

-- 1. Get student skill gaps for specific jobs
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.job_id,
    j.title as job_title,
    GROUP_CONCAT(DISTINCT missing_skills.skill_name ORDER BY missing_skills.skill_name SEPARATOR ', ') as missing_skills,
    COUNT(DISTINCT missing_skills.skill_id) as missing_skills_count
FROM students s
CROSS JOIN jobs j
LEFT JOIN (
    SELECT js.job_id, js.skill_id, sk.skill_name
    FROM job_skills js
    JOIN skills sk ON js.skill_id = sk.skill_id
    WHERE js.is_mandatory = TRUE
) missing_skills ON j.job_id = missing_skills.job_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id AND missing_skills.skill_id = ss.skill_id
WHERE j.status = 'Active' 
    AND ss.stud_id IS NULL
    AND missing_skills.skill_id IS NOT NULL
GROUP BY s.stud_id, s.first_name, s.last_name, j.job_id, j.title
HAVING COUNT(DISTINCT missing_skills.skill_id) > 0
ORDER BY s.stud_id, missing_skills_count;

-- 2. Get notification summary
SELECT 
    n.type,
    COUNT(n.not_id) as total_notifications,
    COUNT(CASE WHEN n.is_read = FALSE THEN 1 END) as unread_notifications,
    COUNT(CASE WHEN n.stud_id IS NOT NULL THEN 1 END) as student_notifications,
    COUNT(CASE WHEN n.admin_id IS NOT NULL THEN 1 END) as admin_notifications
FROM notifications n
WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY n.type
ORDER BY total_notifications DESC;

