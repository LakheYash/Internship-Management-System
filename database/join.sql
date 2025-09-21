USE Internship_db;

-- ==============================================
-- 1. EQUIJOIN QUERIES
-- ==============================================

-- Equijoin: Students with their applications
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    a.app_id,
    a.status as application_status,
    a.application_date
FROM students s
JOIN application a ON s.stud_id = a.stud_id
ORDER BY s.stud_id, a.application_date;

-- Equijoin: Jobs with their companies
SELECT 
    j.job_id,
    j.title as job_title,
    j.salary,
    j.job_type,
    c.name as company_name,
    c.industry,
    c.city as company_city
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
ORDER BY j.job_id;

-- Equijoin: Applications with interviews
SELECT 
    a.app_id,
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    a.status as application_status,
    i.interview_date,
    i.interview_score,
    i.status as interview_status
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN interview i ON a.app_id = i.app_id
ORDER BY a.app_id;

-- Equijoin: Students with their skills
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    sk.skill_name,
    sk.category,
    ss.proficiency_level,
    ss.years_experience
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
ORDER BY s.stud_id, sk.skill_name;

-- ==============================================
-- 2. NON-EQUIJOIN QUERIES
-- ==============================================

-- Non-equijoin: Students with salary expectations higher than job salaries
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.job_id,
    j.title as job_title,
    j.salary as job_salary,
    'Student expects higher salary' as note
FROM students s
CROSS JOIN jobs j
WHERE j.salary < 3000  -- Assuming students expect at least 3000
ORDER BY s.stud_id, j.salary;

-- Non-equijoin: Students with interview scores in different ranges
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    i.interview_score,
    CASE 
        WHEN i.interview_score >= 90 THEN 'Excellent'
        WHEN i.interview_score >= 80 THEN 'Good'
        WHEN i.interview_score >= 70 THEN 'Average'
        WHEN i.interview_score >= 60 THEN 'Below Average'
        ELSE 'Poor'
    END as performance_category
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_score IS NOT NULL
ORDER BY i.interview_score DESC;

-- Non-equijoin: Jobs posted within specific date ranges
SELECT 
    j.job_id,
    j.title as job_title,
    j.posted_date,
    c.name as company_name,
    CASE 
        WHEN j.posted_date >= '2024-02-01' THEN 'Recent'
        WHEN j.posted_date >= '2024-01-01' THEN 'This Month'
        ELSE 'Older'
    END as posting_period
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
ORDER BY j.posted_date DESC;

-- ==============================================
-- 3. SELF JOIN QUERIES
-- ==============================================

-- Self join: Students with same skills
SELECT 
    s1.stud_id as student1_id,
    CONCAT(s1.first_name, ' ', s1.last_name) as student1_name,
    s2.stud_id as student2_id,
    CONCAT(s2.first_name, ' ', s2.last_name) as student2_name,
    sk.skill_name as common_skill,
    ss1.proficiency_level as student1_level,
    ss2.proficiency_level as student2_level
FROM students s1
JOIN student_skills ss1 ON s1.stud_id = ss1.stud_id
JOIN student_skills ss2 ON ss1.skill_id = ss2.skill_id
JOIN students s2 ON ss2.stud_id = s2.stud_id
JOIN skills sk ON ss1.skill_id = sk.skill_id
WHERE s1.stud_id < s2.stud_id  -- Avoid duplicates and self-matches
ORDER BY s1.stud_id, s2.stud_id;

-- Self join: Applications with same status
SELECT 
    a1.app_id as app1_id,
    a1.status as status,
    CONCAT(s1.first_name, ' ', s1.last_name) as student1_name,
    j1.title as job1_title,
    a2.app_id as app2_id,
    CONCAT(s2.first_name, ' ', s2.last_name) as student2_name,
    j2.title as job2_title
FROM application a1
JOIN students s1 ON a1.stud_id = s1.stud_id
JOIN jobs j1 ON a1.job_id = j1.job_id
JOIN application a2 ON a1.status = a2.status
JOIN students s2 ON a2.stud_id = s2.stud_id
JOIN jobs j2 ON a2.job_id = j2.job_id
WHERE a1.app_id < a2.app_id  -- Avoid duplicates
ORDER BY a1.status, a1.app_id;

-- Self join: Companies in same industry
SELECT 
    c1.comp_id as company1_id,
    c1.name as company1_name,
    c1.industry,
    c2.comp_id as company2_id,
    c2.name as company2_name,
    c1.city as company1_city,
    c2.city as company2_city
FROM company c1
JOIN company c2 ON c1.industry = c2.industry
WHERE c1.comp_id < c2.comp_id  -- Avoid duplicates
ORDER BY c1.industry, c1.name;

-- ==============================================
-- 4. NATURAL JOIN QUERIES
-- ==============================================

-- Natural join: Students with applications (using common column names)
-- Note: Natural join automatically matches columns with same names
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    app_id,
    status as application_status,
    application_date
FROM students
NATURAL JOIN application
ORDER BY stud_id;

-- Natural join: Jobs with applications
SELECT 
    job_id,
    title as job_title,
    salary,
    app_id,
    status as application_status
FROM jobs
NATURAL JOIN application
ORDER BY job_id;

-- Natural join: Students with interviews (through application)
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    interview_id,
    interview_date,
    interview_score
FROM students
NATURAL JOIN application
NATURAL JOIN interview
ORDER BY stud_id;

-- ==============================================
-- 5. OUTER JOIN QUERIES
-- ==============================================

-- LEFT OUTER JOIN: All students with their applications (including those without applications)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    a.app_id,
    a.status as application_status,
    a.application_date,
    CASE 
        WHEN a.app_id IS NULL THEN 'No Applications'
        ELSE 'Has Applications'
    END as application_status_note
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
ORDER BY s.stud_id, a.application_date;

-- RIGHT OUTER JOIN: All jobs with their applications (including jobs without applications)
SELECT 
    j.job_id,
    j.title as job_title,
    j.salary,
    j.status as job_status,
    a.app_id,
    a.status as application_status,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    CASE 
        WHEN a.app_id IS NULL THEN 'No Applications'
        ELSE 'Has Applications'
    END as application_status_note
FROM jobs j
RIGHT JOIN application a ON j.job_id = a.job_id
LEFT JOIN students s ON a.stud_id = s.stud_id
ORDER BY j.job_id, a.app_id;

-- FULL OUTER JOIN (simulated using UNION): All students and all jobs
SELECT 
    'Student' as record_type,
    s.stud_id as id,
    CONCAT(s.first_name, ' ', s.last_name) as name,
    s.email as contact,
    s.city,
    s.state
FROM students s
UNION ALL
SELECT 
    'Job' as record_type,
    j.job_id as id,
    j.title as name,
    c.name as contact,
    j.city,
    j.state
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
ORDER BY record_type, id;

-- LEFT OUTER JOIN: Students with their education (including those without education records)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    e.edu_id,
    e.degree,
    e.college,
    e.cgpa,
    CASE 
        WHEN e.edu_id IS NULL THEN 'No Education Record'
        ELSE 'Has Education Record'
    END as education_status
FROM students s
LEFT JOIN education e ON s.stud_id = e.stud_id
ORDER BY s.stud_id, e.edu_id;

-- RIGHT OUTER JOIN: All skills with students who have them
SELECT 
    sk.skill_id,
    sk.skill_name,
    sk.category,
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    ss.proficiency_level,
    CASE 
        WHEN s.stud_id IS NULL THEN 'No Students'
        ELSE 'Has Students'
    END as student_status
FROM skills sk
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
LEFT JOIN students s ON ss.stud_id = s.stud_id
ORDER BY sk.skill_name, s.stud_id;

-- ==============================================
-- 6. COMPLEX JOIN QUERIES
-- ==============================================

-- Multiple table join: Complete application details
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    c.industry,
    a.app_id,
    a.status as application_status,
    a.application_date,
    i.interview_id,
    i.interview_date,
    i.interview_score,
    i.status as interview_status
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
LEFT JOIN interview i ON a.app_id = i.app_id
ORDER BY s.stud_id, a.application_date;

-- Multiple table join: Student skills with job requirements
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    sk.skill_name,
    ss.proficiency_level as student_level,
    js.required_level as job_requirement,
    js.is_mandatory,
    CASE 
        WHEN ss.proficiency_level = js.required_level THEN 'Exact Match'
        WHEN (ss.proficiency_level = 'Expert' AND js.required_level = 'Advanced') THEN 'Overqualified'
        WHEN (ss.proficiency_level = 'Advanced' AND js.required_level = 'Expert') THEN 'Underqualified'
        WHEN (ss.proficiency_level = 'Intermediate' AND js.required_level = 'Beginner') THEN 'Overqualified'
        WHEN (ss.proficiency_level = 'Beginner' AND js.required_level = 'Intermediate') THEN 'Underqualified'
        ELSE 'Different Level'
    END as skill_match_status
FROM students s
JOIN student_skills ss ON s.stud_id = ss.stud_id
JOIN skills sk ON ss.skill_id = sk.skill_id
JOIN job_skills js ON sk.skill_id = js.skill_id
JOIN jobs j ON js.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE j.status = 'Active'
ORDER BY s.stud_id, j.job_id, sk.skill_name;

-- Multiple table join: Company performance analysis
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / COUNT(DISTINCT a.app_id)) * 100, 2) as selection_rate,
    AVG(i.interview_score) as avg_interview_score,
    AVG(cr.rating) as avg_company_rating,
    COUNT(DISTINCT cr.review_id) as total_reviews
FROM company c
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN company_reviews cr ON c.comp_id = cr.comp_id
GROUP BY c.comp_id, c.name, c.industry
ORDER BY selection_rate DESC;

-- ==============================================
-- 7. JOIN PERFORMANCE ANALYSIS
-- ==============================================

-- Analyze join performance with EXPLAIN
EXPLAIN SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    a.app_id,
    a.status,
    j.title as job_title,
    c.name as company_name
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id;

-- ==============================================
-- 8. JOIN WITH AGGREGATE FUNCTIONS
-- ==============================================

-- Students with application statistics
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    COUNT(CASE WHEN a.status = 'Pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) as rejected_applications,
    ROUND((COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) / COUNT(a.app_id)) * 100, 2) as success_rate
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name
ORDER BY success_rate DESC;

-- Companies with job and application statistics
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    AVG(j.salary) as avg_job_salary,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score
FROM company c
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
GROUP BY c.comp_id, c.name, c.industry
ORDER BY total_applications DESC;


