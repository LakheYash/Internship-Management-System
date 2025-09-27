USE Internship_db;

-- ==============================================
-- 1. EQUIJOIN QUERIES (CORRECTED)
-- ==============================================

-- Equijoin: Students with their applications
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name) as student_name,
    s.email,
    s.phone,
    a.app_id,
    a.status as application_status,
    a.application_date
FROM students s
JOIN application a ON s.stud_id = a.stud_id
ORDER BY s.stud_id, a.application_date;

-- Equijoin: Jobs with their companies and HR contacts
SELECT 
    j.job_id,
    j.title as job_title,
    j.salary,
    j.job_type,
    c.name as company_name,
    c.industry,
    c.city as company_city,
    c.state as company_state,
    GROUP_CONCAT(DISTINCT h.hr_name ORDER BY h.hr_name SEPARATOR ', ') as hr_contacts,
    GROUP_CONCAT(DISTINCT h.hr_email ORDER BY h.hr_email SEPARATOR ', ') as hr_emails
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN hr h ON c.comp_id = h.comp_id
GROUP BY j.job_id, j.title, j.salary, j.job_type, c.name, c.industry, c.city, c.state
ORDER BY j.job_id;

-- Equijoin: Applications with interviews and HR details
SELECT 
    a.app_id,
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    a.status as application_status,
    i.interview_id,
    i.interview_date,
    i.interview_score,
    i.mode as interview_mode,
    i.status as interview_status,
    h.hr_name as interviewer_hr,
    h.hr_email as interviewer_hr_email
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
JOIN interview i ON a.app_id = i.app_id
LEFT JOIN hr h ON i.hr_id = h.hr_id
ORDER BY a.app_id, i.interview_date;

-- Equijoin: Students with their skills including experience details
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    sk.skill_name,
    sk.category,
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

-- Equijoin: Jobs with their skill requirements
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    sk.skill_name,
    sk.category as skill_category,
    js.required_level,
    js.is_mandatory,
    js.weightage,
    CASE 
        WHEN js.required_level = 'Expert' THEN 4
        WHEN js.required_level = 'Advanced' THEN 3
        WHEN js.required_level = 'Intermediate' THEN 2
        WHEN js.required_level = 'Beginner' THEN 1
        ELSE 0
    END as requirement_score
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
JOIN job_skills js ON j.job_id = js.job_id
JOIN skills sk ON js.skill_id = sk.skill_id
ORDER BY j.job_id, js.is_mandatory DESC, js.weightage DESC, sk.skill_name;

-- ==============================================
-- 2. NON-EQUIJOIN QUERIES (CORRECTED)
-- ==============================================

-- Non-equijoin: Students with salary expectations compared to job salaries
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    sp.salary_expectation,
    j.job_id,
    j.title as job_title,
    j.salary as job_salary,
    c.name as company_name,
    CASE 
        WHEN sp.salary_expectation > j.salary THEN 'Student expects more'
        WHEN sp.salary_expectation < j.salary THEN 'Job pays more'
        ELSE 'Salary match'
    END as salary_comparison
FROM students s
LEFT JOIN student_profile sp ON s.stud_id = sp.stud_id
CROSS JOIN jobs j
JOIN company c ON j.comp_id = c.comp_id
WHERE j.salary IS NOT NULL 
    AND sp.salary_expectation IS NOT NULL
    AND j.status = 'Active'
ORDER BY s.stud_id, j.salary DESC;

-- Non-equijoin: Students with interview scores in different performance ranges
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    i.interview_score,
    i.interview_date,
    CASE 
        WHEN i.interview_score >= 90 THEN 'Excellent (90-100)'
        WHEN i.interview_score >= 80 THEN 'Good (80-89)'
        WHEN i.interview_score >= 70 THEN 'Average (70-79)'
        WHEN i.interview_score >= 60 THEN 'Below Average (60-69)'
        WHEN i.interview_score < 60 THEN 'Poor (<60)'
        ELSE 'Not Scored'
    END as performance_category
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_score IS NOT NULL
ORDER BY i.interview_score DESC, s.stud_id;

-- Non-equijoin: Jobs posted within specific date ranges with application counts
SELECT 
    j.job_id,
    j.title as job_title,
    j.posted_date,
    j.deadline,
    c.name as company_name,
    c.industry,
    COUNT(DISTINCT a.app_id) as application_count,
    CASE 
        WHEN j.posted_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 'This Week'
        WHEN j.posted_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 'This Month'
        WHEN j.posted_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN 'Last 3 Months'
        ELSE 'Older'
    END as posting_period,
    CASE 
        WHEN j.deadline >= CURDATE() THEN 'Open'
        ELSE 'Expired'
    END as deadline_status
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
GROUP BY j.job_id, j.title, j.posted_date, j.deadline, c.name, c.industry
ORDER BY j.posted_date DESC;

-- Non-equijoin: Skill proficiency vs job requirements mismatch analysis
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.job_id,
    j.title as job_title,
    sk.skill_name,
    ss.proficiency_level as student_level,
    js.required_level as job_requirement,
    CASE 
        WHEN ss.proficiency_level = 'Expert' AND js.required_level IN ('Advanced', 'Intermediate', 'Beginner') THEN 'Overqualified'
        WHEN ss.proficiency_level = 'Advanced' AND js.required_level IN ('Intermediate', 'Beginner') THEN 'Overqualified'
        WHEN ss.proficiency_level = 'Intermediate' AND js.required_level = 'Beginner' THEN 'Overqualified'
        WHEN ss.proficiency_level = js.required_level THEN 'Perfect Match'
        ELSE 'Underqualified'
    END as skill_match_analysis
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
CROSS JOIN jobs j
JOIN job_skills js ON j.job_id = js.job_id AND sk.skill_id = js.skill_id
WHERE j.status = 'Active'
ORDER BY s.stud_id, j.job_id, sk.skill_name;

-- ==============================================
-- 3. SELF JOIN QUERIES (CORRECTED)
-- ==============================================

-- Self join: Students with same skills and their proficiency comparison
SELECT 
    s1.stud_id as student1_id,
    CONCAT(s1.first_name, ' ', s1.last_name) as student1_name,
    s2.stud_id as student2_id,
    CONCAT(s2.first_name, ' ', s2.last_name) as student2_name,
    sk.skill_name as common_skill,
    sk.category as skill_category,
    ss1.proficiency_level as student1_level,
    ss2.proficiency_level as student2_level,
    ss1.years_experience as student1_experience,
    ss2.years_experience as student2_experience,
    CASE 
        WHEN ss1.proficiency_level = ss2.proficiency_level THEN 'Same Level'
        WHEN (ss1.proficiency_level = 'Expert' AND ss2.proficiency_level != 'Expert') THEN 'Student1 Better'
        WHEN (ss2.proficiency_level = 'Expert' AND ss1.proficiency_level != 'Expert') THEN 'Student2 Better'
        WHEN (ss1.proficiency_level = 'Advanced' AND ss2.proficiency_level IN ('Intermediate', 'Beginner')) THEN 'Student1 Better'
        WHEN (ss2.proficiency_level = 'Advanced' AND ss1.proficiency_level IN ('Intermediate', 'Beginner')) THEN 'Student2 Better'
        ELSE 'Different Levels'
    END as comparison
FROM students s1
JOIN student_skills ss1 ON s1.stud_id = ss1.stud_id
JOIN student_skills ss2 ON ss1.skill_id = ss2.skill_id
JOIN students s2 ON ss2.stud_id = s2.stud_id
JOIN skills sk ON ss1.skill_id = sk.skill_id
WHERE s1.stud_id < s2.stud_id  -- Avoid duplicates and self-matches
ORDER BY sk.skill_name, s1.stud_id, s2.stud_id;

-- Self join: Applications for same job comparison
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    a1.app_id as app1_id,
    CONCAT(s1.first_name, ' ', s1.last_name) as student1_name,
    a1.status as app1_status,
    a1.application_date as app1_date,
    a2.app_id as app2_id,
    CONCAT(s2.first_name, ' ', s2.last_name) as student2_name,
    a2.status as app2_status,
    a2.application_date as app2_date,
    DATEDIFF(a2.application_date, a1.application_date) as days_difference
FROM application a1
JOIN students s1 ON a1.stud_id = s1.stud_id
JOIN jobs j ON a1.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
JOIN application a2 ON a1.job_id = a2.job_id
JOIN students s2 ON a2.stud_id = s2.stud_id
WHERE a1.app_id < a2.app_id  -- Avoid duplicates
ORDER BY j.job_id, a1.application_date, a2.application_date;

-- Self join: Companies in same industry and location comparison
SELECT 
    c1.comp_id as company1_id,
    c1.name as company1_name,
    c1.industry,
    c1.city as company1_city,
    c1.state as company1_state,
    c2.comp_id as company2_id,
    c2.name as company2_name,
    c2.city as company2_city,
    c2.state as company2_state,
    COUNT(DISTINCT j1.job_id) as company1_jobs,
    COUNT(DISTINCT j2.job_id) as company2_jobs,
    AVG(j1.salary) as company1_avg_salary,
    AVG(j2.salary) as company2_avg_salary
FROM company c1
JOIN company c2 ON c1.industry = c2.industry
LEFT JOIN jobs j1 ON c1.comp_id = j1.comp_id
LEFT JOIN jobs j2 ON c2.comp_id = j2.comp_id
WHERE c1.comp_id < c2.comp_id  -- Avoid duplicates
GROUP BY c1.comp_id, c1.name, c1.industry, c1.city, c1.state, 
         c2.comp_id, c2.name, c2.city, c2.state
ORDER BY c1.industry, c1.name;

-- Self join: Students with similar education backgrounds
SELECT 
    s1.stud_id as student1_id,
    CONCAT(s1.first_name, ' ', s1.last_name) as student1_name,
    e1.degree as student1_degree,
    e1.college as student1_college,
    e1.cgpa as student1_cgpa,
    s2.stud_id as student2_id,
    CONCAT(s2.first_name, ' ', s2.last_name) as student2_name,
    e2.degree as student2_degree,
    e2.college as student2_college,
    e2.cgpa as student2_cgpa,
    ABS(e1.cgpa - e2.cgpa) as cgpa_difference
FROM students s1
JOIN education e1 ON s1.stud_id = e1.stud_id
JOIN education e2 ON e1.degree = e2.degree
JOIN students s2 ON e2.stud_id = s2.stud_id
WHERE s1.stud_id < s2.stud_id
    AND e1.cgpa IS NOT NULL
    AND e2.cgpa IS NOT NULL
ORDER BY e1.degree, cgpa_difference;

-- ==============================================
-- 4. EXPLICIT JOIN QUERIES (REPLACING NATURAL JOINS)
-- ==============================================

-- Explicit join: Students with their applications (safer than natural join)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.status as student_status,
    a.app_id,
    a.status as application_status,
    a.application_date,
    a.cover_letter
FROM students s
JOIN application a ON s.stud_id = a.stud_id
ORDER BY s.stud_id, a.application_date DESC;

-- Explicit join: Jobs with applications and company details
SELECT 
    j.job_id,
    j.title as job_title,
    j.salary,
    j.job_type,
    j.status as job_status,
    c.name as company_name,
    c.industry,
    a.app_id,
    a.status as application_status,
    CONCAT(s.first_name, ' ', s.last_name) as applicant_name
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN students s ON a.stud_id = s.stud_id
ORDER BY j.job_id, a.application_date;

-- Explicit join: Students with interviews through application relationship
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    i.interview_id,
    i.interview_date,
    i.interview_score,
    i.mode as interview_mode,
    i.status as interview_status,
    j.title as job_title,
    c.name as company_name
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN interview i ON a.app_id = i.app_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
ORDER BY s.stud_id, i.interview_date DESC;

-- ==============================================
-- 5. OUTER JOIN QUERIES (CORRECTED)
-- ==============================================

-- LEFT OUTER JOIN: All students with their applications (including those without applications)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.phone,
    s.city,
    s.state,
    s.status as student_status,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    COUNT(CASE WHEN a.status = 'Pending' THEN 1 END) as pending_applications,
    MAX(a.application_date) as latest_application_date,
    CASE 
        WHEN COUNT(a.app_id) = 0 THEN 'No Applications Yet'
        WHEN COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) > 0 THEN 'Has Selections'
        WHEN COUNT(CASE WHEN a.status = 'Pending' THEN 1 END) > 0 THEN 'Has Pending Applications'
        ELSE 'Has Applications (No Selections)'
    END as application_summary
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.phone, s.city, s.state, s.status
ORDER BY total_applications DESC, s.stud_id;

-- RIGHT OUTER JOIN: All jobs with their applications (including jobs without applications)
SELECT 
    j.job_id,
    j.title as job_title,
    j.salary,
    j.job_type,
    j.status as job_status,
    j.posted_date,
    j.deadline,
    c.name as company_name,
    c.industry,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    COUNT(CASE WHEN a.status = 'Under Review' THEN 1 END) as under_review_applications,
    GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as required_skills,
    CASE 
        WHEN COUNT(a.app_id) = 0 THEN 'No Applications'
        WHEN COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) > 0 THEN 'Has Selections'
        ELSE 'Has Applications (No Selections Yet)'
    END as application_summary
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN job_skills js ON j.job_id = js.job_id
LEFT JOIN skills sk ON js.skill_id = sk.skill_id
GROUP BY j.job_id, j.title, j.salary, j.job_type, j.status, j.posted_date, j.deadline, c.name, c.industry
ORDER BY total_applications ASC, j.posted_date DESC;

-- LEFT OUTER JOIN: Students with their education (including those without education records)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    COUNT(e.edu_id) as education_records,
    GROUP_CONCAT(DISTINCT e.degree ORDER BY e.end_date DESC SEPARATOR '; ') as degrees,
    GROUP_CONCAT(DISTINCT e.college ORDER BY e.end_date DESC SEPARATOR '; ') as colleges,
    AVG(e.cgpa) as avg_cgpa,
    MAX(e.end_date) as latest_graduation,
    CASE 
        WHEN COUNT(e.edu_id) = 0 THEN 'No Education Record'
        WHEN COUNT(e.edu_id) = 1 THEN 'Single Education Record'
        ELSE 'Multiple Education Records'
    END as education_status
FROM students s
LEFT JOIN education e ON s.stud_id = e.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email
ORDER BY education_records DESC, s.stud_id;

-- LEFT OUTER JOIN: All skills with students who have them and jobs that require them
SELECT 
    sk.skill_id,
    sk.skill_name,
    sk.category,
    COUNT(DISTINCT ss.stud_id) as students_with_skill,
    COUNT(DISTINCT js.job_id) as jobs_requiring_skill,
    COUNT(DISTINCT CASE WHEN js.is_mandatory = TRUE THEN js.job_id END) as jobs_requiring_mandatory,
    GROUP_CONCAT(DISTINCT ss.proficiency_level ORDER BY ss.proficiency_level SEPARATOR ', ') as student_proficiency_levels,
    GROUP_CONCAT(DISTINCT js.required_level ORDER BY js.required_level SEPARATOR ', ') as job_requirement_levels,
    CASE 
        WHEN COUNT(DISTINCT ss.stud_id) = 0 AND COUNT(DISTINCT js.job_id) = 0 THEN 'Unused Skill'
        WHEN COUNT(DISTINCT ss.stud_id) = 0 THEN 'Required but No Students'
        WHEN COUNT(DISTINCT js.job_id) = 0 THEN 'Available but Not Required'
        ELSE 'Active Skill'
    END as skill_status
FROM skills sk
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
GROUP BY sk.skill_id, sk.skill_name, sk.category
ORDER BY jobs_requiring_skill DESC, students_with_skill DESC, sk.skill_name;

-- ==============================================
-- 6. COMPLEX MULTI-TABLE JOIN QUERIES (CORRECTED)
-- ==============================================

-- Complete application lifecycle with all related data
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.phone,
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    c.industry,
    GROUP_CONCAT(DISTINCT h.hr_name ORDER BY h.hr_name SEPARATOR ', ') as hr_contacts,
    a.app_id,
    a.status as application_status,
    a.application_date,
    COUNT(DISTINCT i.interview_id) as interview_count,
    AVG(i.interview_score) as avg_interview_score,
    GROUP_CONCAT(DISTINCT i.interview_date ORDER BY i.interview_date SEPARATOR ', ') as interview_dates,
    GROUP_CONCAT(DISTINCT i.mode ORDER BY i.interview_date SEPARATOR ', ') as interview_modes,
    -- Skill matching analysis
    COUNT(DISTINCT matching_skills.skill_id) as matching_skills_count,
    COUNT(DISTINCT required_skills.skill_id) as total_required_skills,
    ROUND((COUNT(DISTINCT matching_skills.skill_id) / COUNT(DISTINCT required_skills.skill_id)) * 100, 2) as skill_match_percentage
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN hr h ON c.comp_id = h.comp_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN job_skills required_skills ON j.job_id = required_skills.job_id
LEFT JOIN (
    SELECT ss.stud_id, js.job_id, ss.skill_id
    FROM student_skills ss
    JOIN job_skills js ON ss.skill_id = js.skill_id
    WHERE (ss.proficiency_level = js.required_level 
           OR (ss.proficiency_level = 'Expert' AND js.required_level IN ('Advanced', 'Intermediate', 'Beginner'))
           OR (ss.proficiency_level = 'Advanced' AND js.required_level IN ('Intermediate', 'Beginner'))
           OR (ss.proficiency_level = 'Intermediate' AND js.required_level = 'Beginner'))
) matching_skills ON s.stud_id = matching_skills.stud_id AND j.job_id = matching_skills.job_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.phone, j.job_id, j.title, c.name, c.industry, a.app_id, a.status, a.application_date
ORDER BY s.stud_id, a.application_date DESC;

-- Company performance analysis with detailed metrics
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    c.city,
    c.state,
    c.website,
    COUNT(DISTINCT h.hr_id) as hr_contacts,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'Active' THEN j.job_id END) as active_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Under Review' THEN a.app_id END) as under_review_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Rejected' THEN a.app_id END) as rejected_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as selection_rate,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score,
    AVG(j.salary) as avg_job_salary,
    MIN(j.salary) as min_job_salary,
    MAX(j.salary) as max_job_salary,
    COUNT(DISTINCT required_skills.skill_id) as unique_skills_required,
    GROUP_CONCAT(DISTINCT top_skills.skill_name ORDER BY skill_frequency DESC LIMIT 5) as top_required_skills
FROM company c
LEFT JOIN hr h ON c.comp_id = h.comp_id
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN job_skills required_skills ON j.job_id = required_skills.job_id
LEFT JOIN (
    SELECT js.job_id, sk.skill_name, COUNT(*) as skill_frequency
    FROM job_skills js
    JOIN skills sk ON js.skill_id = sk.skill_id
    GROUP BY js.job_id, sk.skill_name
) top_skills ON j.job_id = top_skills.job_id
GROUP BY c.comp_id, c.name, c.industry, c.city, c.state, c.website
HAVING COUNT(DISTINCT j.job_id) > 0  -- Only companies with jobs
ORDER BY selection_rate DESC, total_applications DESC;

-- Student comprehensive profile with skills, education, and application history
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.phone,
    s.city,
    s.state,
    s.age,
    s.status as student_status,
    -- Profile information
    sp.bio,
    sp.linkedin_url,
    sp.github_url,
    sp.salary_expectation,
    -- Education summary
    COUNT(DISTINCT e.edu_id) as education_count,
    GROUP_CONCAT(DISTINCT e.degree ORDER BY e.end_date DESC SEPARATOR '; ') as degrees,
    AVG(e.cgpa) as avg_cgpa,
    -- Skills summary
    COUNT(DISTINCT ss.skill_id) as total_skills,
    COUNT(DISTINCT sk.category) as skill_categories,
    COUNT(DISTINCT CASE WHEN ss.certified = TRUE THEN ss.skill_id END) as certified_skills,
    AVG(ss.years_experience) as avg_skill_experience,
    -- Projects summary
    COUNT(DISTINCT p.proj_id) as total_projects,
    GROUP_CONCAT(DISTINCT p.project_type ORDER BY p.project_type SEPARATOR ', ') as project_types,
    -- Application summary
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.app_id END) as pending_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as success_rate,
    -- Interview summary
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score
FROM students s
LEFT JOIN student_profile sp ON s.stud_id = sp.stud_id
LEFT JOIN education e ON s.stud_id = e.stud_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
LEFT JOIN projects p ON s.stud_id = p.stud_id
LEFT JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.phone, s.city, s.state, s.age, s.status, 
         sp.bio, sp.linkedin_url, sp.github_url, sp.salary_expectation
ORDER BY success_rate DESC, total_applications DESC, s.stud_id;

-- ==============================================
-- 7. JOIN WITH AGGREGATE FUNCTIONS (CORRECTED)
-- ==============================================

-- Students with comprehensive application statistics
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.city,
    s.state,
    s.status as student_status,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.app_id END) as pending_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Under Review' THEN a.app_id END) as under_review_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Rejected' THEN a.app_id END) as rejected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Shortlisted' THEN a.app_id END) as shortlisted_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as success_rate,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score,
    COUNT(DISTINCT ss.skill_id) as total_skills,
    COUNT(DISTINCT p.proj_id) as total_projects,
    MIN(a.application_date) as first_application_date,
    MAX(a.application_date) as latest_application_date
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
LEFT JOIN projects p ON s.stud_id = p.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.city, s.state, s.status
ORDER BY success_rate DESC, total_applications DESC;

-- Companies with detailed job and application statistics
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    c.city,
    c.state,
    c.website,
    COUNT(DISTINCT h.hr_id) as hr_contacts_count,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'Active' THEN j.job_id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.job_type = 'Internship' THEN j.job_id END) as internship_jobs,
    COUNT(DISTINCT CASE WHEN j.job_type = 'Full-time' THEN j.job_id END) as fulltime_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    ROUND(COUNT(DISTINCT a.app_id) / NULLIF(COUNT(DISTINCT j.job_id), 0), 2) as avg_applications_per_job,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as selection_rate,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score,
    AVG(j.salary) as avg_job_salary,
    MIN(j.salary) as min_salary,
    MAX(j.salary) as max_salary,
    COUNT(DISTINCT js.skill_id) as unique_skills_required,
    MIN(j.posted_date) as first_job_posted,
    MAX(j.posted_date) as latest_job_posted
FROM company c
LEFT JOIN hr h ON c.comp_id = h.comp_id
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN job_skills js ON j.job_id = js.job_id
GROUP BY c.comp_id, c.name, c.industry, c.city, c.state, c.website
ORDER BY total_applications DESC, selection_rate DESC;

-- Skills demand and supply analysis with aggregations
SELECT 
    sk.skill_id,
    sk.skill_name,
    sk.category,
    -- Demand side (jobs)
    COUNT(DISTINCT js.job_id) as jobs_requiring_skill,
    COUNT(DISTINCT CASE WHEN js.is_mandatory = TRUE THEN js.job_id END) as jobs_requiring_mandatory,
    COUNT(DISTINCT CASE WHEN js.required_level = 'Expert' THEN js.job_id END) as jobs_requiring_expert,
    COUNT(DISTINCT CASE WHEN js.required_level = 'Advanced' THEN js.job_id END) as jobs_requiring_advanced,
    COUNT(DISTINCT CASE WHEN js.required_level = 'Intermediate' THEN js.job_id END) as jobs_requiring_intermediate,
    COUNT(DISTINCT CASE WHEN js.required_level = 'Beginner' THEN js.job_id END) as jobs_requiring_beginner,
    AVG(js.weightage) as avg_skill_weightage,
    -- Supply side (students)
    COUNT(DISTINCT ss.stud_id) as students_with_skill,
    COUNT(DISTINCT CASE WHEN ss.proficiency_level = 'Expert' THEN ss.stud_id END) as expert_students,
    COUNT(DISTINCT CASE WHEN ss.proficiency_level = 'Advanced' THEN ss.stud_id END) as advanced_students,
    COUNT(DISTINCT CASE WHEN ss.proficiency_level = 'Intermediate' THEN ss.stud_id END) as intermediate_students,
    COUNT(DISTINCT CASE WHEN ss.proficiency_level = 'Beginner' THEN ss.stud_id END) as beginner_students,
    COUNT(DISTINCT CASE WHEN ss.certified = TRUE THEN ss.stud_id END) as certified_students,
    AVG(ss.years_experience) as avg_student_experience,
    -- Supply vs Demand ratio
    ROUND(COUNT(DISTINCT ss.stud_id) / NULLIF(COUNT(DISTINCT js.job_id), 0), 2) as supply_demand_ratio,
    CASE 
        WHEN COUNT(DISTINCT js.job_id) = 0 THEN 'No Demand'
        WHEN COUNT(DISTINCT ss.stud_id) = 0 THEN 'High Demand, No Supply'
        WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) > 2 THEN 'Oversupply'
        WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) > 1 THEN 'Balanced'
        ELSE 'Undersupply'
    END as market_status
FROM skills sk
LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
GROUP BY sk.skill_id, sk.skill_name, sk.category
HAVING COUNT(DISTINCT js.job_id) > 0 OR COUNT(DISTINCT ss.stud_id) > 0
ORDER BY jobs_requiring_skill DESC, students_with_skill DESC;

-- ==============================================
-- 8. PERFORMANCE ANALYSIS QUERIES
-- ==============================================

-- Query performance analysis using EXPLAIN
EXPLAIN FORMAT=JSON
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    a.app_id,
    a.status,
    j.title as job_title,
    c.name as company_name
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE a.status = 'Pending'
ORDER BY a.application_date DESC;

-- Index usage analysis
SHOW INDEX FROM students;
SHOW INDEX FROM application;
SHOW INDEX FROM jobs;
SHOW INDEX FROM company;

-- ==============================================
-- 9. SPECIALIZED JOIN QUERIES
-- ==============================================

-- Cross join for skill gap analysis (all students vs all job requirements)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    COUNT(DISTINCT required_skills.skill_id) as total_required_skills,
    COUNT(DISTINCT student_has_skills.skill_id) as student_has_skills,
    COUNT(DISTINCT missing_skills.skill_id) as missing_skills_count,
    ROUND((COUNT(DISTINCT student_has_skills.skill_id) / COUNT(DISTINCT required_skills.skill_id)) * 100, 2) as skill_coverage_percentage,
    GROUP_CONCAT(DISTINCT missing_skills.skill_name ORDER BY missing_skills.skill_name SEPARATOR ', ') as missing_skills_list
FROM students s
CROSS JOIN jobs j
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN job_skills js ON j.job_id = js.job_id
LEFT JOIN skills required_skills ON js.skill_id = required_skills.skill_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id AND required_skills.skill_id = ss.skill_id
LEFT JOIN skills student_has_skills ON ss.skill_id = student_has_skills.skill_id
LEFT JOIN skills missing_skills ON required_skills.skill_id = missing_skills.skill_id AND ss.stud_id IS NULL
WHERE j.status = 'Active'
    AND EXISTS (SELECT 1 FROM job_skills WHERE job_id = j.job_id)
GROUP BY s.stud_id, s.first_name, s.last_name, j.job_id, j.title, c.name
HAVING COUNT(DISTINCT required_skills.skill_id) > 0
ORDER BY skill_coverage_percentage DESC, missing_skills_count ASC;

-- ==============================================
-- 10. DATA QUALITY AND CONSISTENCY CHECKS
-- ==============================================

-- Check for orphaned records
SELECT 'Orphaned Applications' as check_type, COUNT(*) as count
FROM application a
LEFT JOIN students s ON a.stud_id = s.stud_id
LEFT JOIN jobs j ON a.job_id = j.job_id
WHERE s.stud_id IS NULL OR j.job_id IS NULL

UNION ALL

SELECT 'Orphaned Interviews' as check_type, COUNT(*) as count
FROM interview i
LEFT JOIN application a ON i.app_id = a.app_id
WHERE a.app_id IS NULL

UNION ALL

SELECT 'Orphaned Student Skills' as check_type, COUNT(*) as count
FROM student_skills ss
LEFT JOIN students s ON ss.stud_id = s.stud_id
LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
WHERE s.stud_id IS NULL OR sk.skill_id IS NULL

UNION ALL

SELECT 'Orphaned Job Skills' as check_type, COUNT(*) as count
FROM job_skills js
LEFT JOIN jobs j ON js.job_id = j.job_id
LEFT JOIN skills sk ON js.skill_id = sk.skill_id
WHERE j.job_id IS NULL OR sk.skill_id IS NULL;

