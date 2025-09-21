USE Internship_db;

-- ==============================================
-- 1. CONDITIONAL OPERATORS (WHERE CLAUSE)
-- ==============================================

-- Students with specific age range
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    email,
    city,
    state
FROM students
WHERE age BETWEEN 20 AND 25
ORDER BY age;

-- Students from specific states
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state,
    email
FROM students
WHERE state IN ('CA', 'NY', 'TX', 'IL')
ORDER BY state, city;

-- Students with specific status
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    status,
    email
FROM students
WHERE status = 'Available'
ORDER BY last_name;

-- ==============================================
-- 2. LOGICAL OPERATORS (AND, OR, NOT)
-- ==============================================

-- Students with specific age and status
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    status,
    city,
    state
FROM students
WHERE age >= 22 AND status = 'Available'
ORDER BY age DESC;

-- Students from specific cities OR states
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state,
    email
FROM students
WHERE city = 'San Francisco' OR state = 'CA'
ORDER BY city, last_name;

-- Students NOT from specific states
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state,
    email
FROM students
WHERE NOT state IN ('CA', 'NY')
ORDER BY state, city;

-- Complex logical conditions
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    status,
    city,
    state
FROM students
WHERE (age BETWEEN 21 AND 24) AND (status = 'Available' OR status = 'Selected')
ORDER BY age, last_name;

-- ==============================================
-- 3. LIKE / NOT LIKE OPERATORS
-- ==============================================

-- Students with names starting with 'A'
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email
FROM students
WHERE first_name LIKE 'A%'
ORDER BY first_name;

-- Students with names containing 'son'
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email
FROM students
WHERE last_name LIKE '%son%'
ORDER BY last_name;

-- Students with email domains
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email
FROM students
WHERE email LIKE '%@email.com'
ORDER BY email;

-- Students with names NOT starting with 'A'
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email
FROM students
WHERE first_name NOT LIKE 'A%'
ORDER BY first_name;

-- Students with complex name patterns
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email
FROM students
WHERE (first_name LIKE 'A%' OR first_name LIKE 'B%') AND last_name LIKE '%son'
ORDER BY first_name, last_name;

-- ==============================================
-- 4. IN / NOT IN OPERATORS
-- ==============================================

-- Students with specific IDs
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email,
    status
FROM students
WHERE stud_id IN (1, 3, 5, 7, 9)
ORDER BY stud_id;

-- Students NOT in specific IDs
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email,
    status
FROM students
WHERE stud_id NOT IN (2, 4, 6, 8, 10)
ORDER BY stud_id;

-- Students with specific status values
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    status
FROM students
WHERE status IN ('Available', 'Selected')
ORDER BY status, last_name;

-- Students NOT with specific status values
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    status
FROM students
WHERE status NOT IN ('Not Available')
ORDER BY status, last_name;

-- ==============================================
-- 5. BETWEEN...AND OPERATORS
-- ==============================================

-- Students with age range
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    city,
    state
FROM students
WHERE age BETWEEN 21 AND 24
ORDER BY age;

-- Jobs with salary range
SELECT 
    job_id,
    title as job_title,
    salary,
    job_type,
    city,
    state
FROM jobs
WHERE salary BETWEEN 2500 AND 3500
ORDER BY salary DESC;

-- Applications within date range
SELECT 
    app_id,
    stud_id,
    job_id,
    status,
    application_date
FROM application
WHERE application_date BETWEEN '2024-01-01' AND '2024-02-29'
ORDER BY application_date;

-- Students with age NOT in range
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    city,
    state
FROM students
WHERE age NOT BETWEEN 22 AND 24
ORDER BY age;

-- ==============================================
-- 6. IS NULL / IS NOT NULL OPERATORS
-- ==============================================

-- Students with middle names
SELECT 
    stud_id,
    CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) as full_name,
    email
FROM students
WHERE middle_name IS NOT NULL
ORDER BY last_name;

-- Students without middle names
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as full_name,
    email
FROM students
WHERE middle_name IS NULL
ORDER BY last_name;

-- Interviews with scores
SELECT 
    interview_id,
    stud_id,
    interview_date,
    interview_score,
    status
FROM interview
WHERE interview_score IS NOT NULL
ORDER BY interview_score DESC;

-- Interviews without scores
SELECT 
    interview_id,
    stud_id,
    interview_date,
    interview_score,
    status
FROM interview
WHERE interview_score IS NULL
ORDER BY interview_date;

-- ==============================================
-- 7. ORDER BY CLAUSE
-- ==============================================

-- Students ordered by last name
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email,
    city,
    state
FROM students
ORDER BY last_name ASC;

-- Students ordered by age descending
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    city,
    state
FROM students
ORDER BY age DESC;

-- Multiple column ordering
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state,
    age
FROM students
ORDER BY state ASC, city ASC, age DESC;

-- Jobs ordered by salary and title
SELECT 
    job_id,
    title as job_title,
    salary,
    job_type,
    city,
    state
FROM jobs
ORDER BY salary DESC, title ASC;

-- ==============================================
-- 8. GROUP BY CLAUSE
-- ==============================================

-- Students grouped by status
SELECT 
    status,
    COUNT(*) as student_count,
    AVG(age) as avg_age,
    MIN(age) as min_age,
    MAX(age) as max_age
FROM students
GROUP BY status
ORDER BY student_count DESC;

-- Students grouped by state
SELECT 
    state,
    COUNT(*) as student_count,
    COUNT(DISTINCT city) as city_count,
    AVG(age) as avg_age
FROM students
GROUP BY state
ORDER BY student_count DESC;

-- Jobs grouped by company
SELECT 
    c.name as company_name,
    c.industry,
    COUNT(j.job_id) as job_count,
    AVG(j.salary) as avg_salary,
    MIN(j.salary) as min_salary,
    MAX(j.salary) as max_salary
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
GROUP BY c.comp_id, c.name, c.industry
ORDER BY job_count DESC;

-- Applications grouped by status
SELECT 
    status,
    COUNT(*) as application_count,
    COUNT(DISTINCT stud_id) as unique_students,
    COUNT(DISTINCT job_id) as unique_jobs
FROM application
GROUP BY status
ORDER BY application_count DESC;

-- ==============================================
-- 9. AGGREGATE FUNCTIONS
-- ==============================================

-- Student statistics
SELECT 
    COUNT(*) as total_students,
    COUNT(DISTINCT state) as unique_states,
    COUNT(DISTINCT city) as unique_cities,
    AVG(age) as avg_age,
    MIN(age) as min_age,
    MAX(age) as max_age,
    SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_students,
    SUM(CASE WHEN status = 'Selected' THEN 1 ELSE 0 END) as selected_students
FROM students;

-- Job statistics
SELECT 
    COUNT(*) as total_jobs,
    COUNT(DISTINCT comp_id) as unique_companies,
    AVG(salary) as avg_salary,
    MIN(salary) as min_salary,
    MAX(salary) as max_salary,
    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_jobs,
    SUM(CASE WHEN job_type = 'Internship' THEN 1 ELSE 0 END) as internship_jobs
FROM jobs;

-- Application statistics
SELECT 
    COUNT(*) as total_applications,
    COUNT(DISTINCT stud_id) as unique_students,
    COUNT(DISTINCT job_id) as unique_jobs,
    SUM(CASE WHEN status = 'Selected' THEN 1 ELSE 0 END) as selected_applications,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_applications,
    SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_applications
FROM application;

-- Interview statistics
SELECT 
    COUNT(*) as total_interviews,
    COUNT(CASE WHEN interview_score IS NOT NULL THEN 1 END) as scored_interviews,
    AVG(interview_score) as avg_score,
    MIN(interview_score) as min_score,
    MAX(interview_score) as max_score,
    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_interviews
FROM interview
WHERE interview_score IS NOT NULL;

-- ==============================================
-- 10. HAVING CLAUSE
-- ==============================================

-- States with more than 1 student
SELECT 
    state,
    COUNT(*) as student_count,
    AVG(age) as avg_age
FROM students
GROUP BY state
HAVING COUNT(*) > 1
ORDER BY student_count DESC;

-- Companies with more than 2 jobs
SELECT 
    c.name as company_name,
    c.industry,
    COUNT(j.job_id) as job_count,
    AVG(j.salary) as avg_salary
FROM company c
JOIN jobs j ON c.comp_id = j.comp_id
GROUP BY c.comp_id, c.name, c.industry
HAVING COUNT(j.job_id) > 2
ORDER BY job_count DESC;

-- Students with more than 2 applications
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    COUNT(a.app_id) as application_count,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_count
FROM students s
JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name
HAVING COUNT(a.app_id) > 2
ORDER BY application_count DESC;

-- Jobs with average salary above 3000
SELECT 
    c.name as company_name,
    c.industry,
    COUNT(j.job_id) as job_count,
    AVG(j.salary) as avg_salary
FROM company c
JOIN jobs j ON c.comp_id = j.comp_id
GROUP BY c.comp_id, c.name, c.industry
HAVING AVG(j.salary) > 3000
ORDER BY avg_salary DESC;

-- ==============================================
-- 11. SET OPERATORS
-- ==============================================

-- Students from CA or NY (UNION)
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state
FROM students
WHERE state = 'CA'
UNION
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state
FROM students
WHERE state = 'NY'
ORDER BY state, last_name;

-- Students with applications (INTERSECT - simulated)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email
FROM students s
WHERE s.stud_id IN (
    SELECT DISTINCT stud_id FROM application
)
ORDER BY s.stud_id;

-- Students without applications (EXCEPT - simulated)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email
FROM students s
WHERE s.stud_id NOT IN (
    SELECT DISTINCT stud_id FROM application
)
ORDER BY s.stud_id;

-- ==============================================
-- 12. SQL SINGLE ROW FUNCTIONS
-- ==============================================

-- String functions
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as full_name,
    UPPER(first_name) as first_name_upper,
    LOWER(last_name) as last_name_lower,
    LENGTH(CONCAT(first_name, last_name)) as name_length,
    SUBSTRING(email, 1, 10) as email_prefix,
    REPLACE(email, '@email.com', '@university.edu') as new_email
FROM students
ORDER BY last_name;

-- Date functions
SELECT 
    app_id,
    stud_id,
    job_id,
    status,
    application_date,
    DATE(application_date) as application_date_only,
    TIME(application_date) as application_time_only,
    YEAR(application_date) as application_year,
    MONTH(application_date) as application_month,
    DAY(application_date) as application_day,
    DAYNAME(application_date) as day_name,
    MONTHNAME(application_date) as month_name,
    DATEDIFF(CURDATE(), application_date) as days_since_application
FROM application
ORDER BY application_date DESC;

-- Time functions
SELECT 
    interview_id,
    stud_id,
    interview_date,
    DATE(interview_date) as interview_date_only,
    TIME(interview_date) as interview_time_only,
    HOUR(interview_date) as interview_hour,
    MINUTE(interview_date) as interview_minute,
    SECOND(interview_date) as interview_second,
    DATE_FORMAT(interview_date, '%Y-%m-%d %H:%i:%s') as formatted_datetime,
    DATE_FORMAT(interview_date, '%W, %M %d, %Y at %h:%i %p') as readable_datetime
FROM interview
ORDER BY interview_date;

-- Mathematical functions
SELECT 
    job_id,
    title as job_title,
    salary,
    ROUND(salary, 0) as rounded_salary,
    CEIL(salary) as ceiling_salary,
    FLOOR(salary) as floor_salary,
    ABS(salary - 3000) as salary_difference_from_3000,
    POWER(salary, 0.5) as salary_square_root,
    LOG(salary) as salary_logarithm
FROM jobs
ORDER BY salary DESC;

-- ==============================================
-- 13. CORRELATED AND NESTED QUERIES
-- ==============================================

-- Students with above-average interview scores (Correlated)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    i.interview_score,
    (SELECT AVG(interview_score) FROM interview WHERE interview_score IS NOT NULL) as avg_score
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_score > (
    SELECT AVG(interview_score) 
    FROM interview 
    WHERE interview_score IS NOT NULL
)
ORDER BY i.interview_score DESC;

-- Students with more applications than average (Nested)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    COUNT(a.app_id) as application_count,
    (SELECT AVG(app_count) FROM (
        SELECT COUNT(app_id) as app_count 
        FROM application 
        GROUP BY stud_id
    ) as avg_apps) as avg_applications
FROM students s
JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name
HAVING COUNT(a.app_id) > (
    SELECT AVG(app_count) FROM (
        SELECT COUNT(app_id) as app_count 
        FROM application 
        GROUP BY stud_id
    ) as avg_apps
)
ORDER BY application_count DESC;

-- Companies with above-average job salaries (Correlated)
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    AVG(j.salary) as avg_company_salary,
    (SELECT AVG(salary) FROM jobs) as overall_avg_salary
FROM company c
JOIN jobs j ON c.comp_id = j.comp_id
GROUP BY c.comp_id, c.name, c.industry
HAVING AVG(j.salary) > (SELECT AVG(salary) FROM jobs)
ORDER BY avg_company_salary DESC;

-- Students with highest interview score per job (Nested)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    i.interview_score
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_score = (
    SELECT MAX(interview_score)
    FROM interview i2
    JOIN application a2 ON i2.app_id = a2.app_id
    WHERE a2.job_id = j.job_id
)
ORDER BY j.job_id, i.interview_score DESC;

-- ==============================================
-- 14. COMPLEX COMBINED QUERIES
-- ==============================================

-- Top performing students with comprehensive statistics
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.city,
    s.state,
    s.age,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    ROUND((COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) / COUNT(a.app_id)) * 100, 2) as success_rate,
    AVG(i.interview_score) as avg_interview_score,
    COUNT(DISTINCT ss.skill_id) as total_skills,
    COUNT(DISTINCT p.proj_id) as total_projects
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
LEFT JOIN projects p ON s.stud_id = p.stud_id
WHERE s.status = 'Available'
GROUP BY s.stud_id, s.first_name, s.last_name, s.city, s.state, s.age
HAVING COUNT(a.app_id) >= 1
ORDER BY success_rate DESC, avg_interview_score DESC, total_skills DESC;

-- Company performance analysis with detailed metrics
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    c.city,
    c.state,
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / COUNT(DISTINCT a.app_id)) * 100, 2) as selection_rate,
    AVG(j.salary) as avg_job_salary,
    AVG(i.interview_score) as avg_interview_score,
    AVG(cr.rating) as avg_company_rating,
    COUNT(DISTINCT cr.review_id) as total_reviews
FROM company c
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN company_reviews cr ON c.comp_id = cr.comp_id
WHERE c.is_active = TRUE
GROUP BY c.comp_id, c.name, c.industry, c.city, c.state
HAVING COUNT(DISTINCT a.app_id) > 0
ORDER BY selection_rate DESC, avg_interview_score DESC, total_applications DESC;
