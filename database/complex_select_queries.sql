USE Internship_db;

-- ==============================================
-- 1. CONDITIONAL OPERATORS (WHERE CLAUSE) - CORRECTED
-- ==============================================

-- Students with specific age range
SELECT 
    stud_id,
    CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) as student_name,
    age,
    email,
    phone,
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
    email,
    phone
FROM students
WHERE state IN ('CA', 'NY', 'TX', 'IL', 'MA', 'CT')
ORDER BY state, city;

-- Students with specific status
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    status,
    email,
    created_at
FROM students
WHERE status = 'Available'
ORDER BY last_name;

-- Jobs with specific status and salary range
SELECT 
    job_id,
    title as job_title,
    salary,
    job_type,
    status,
    city,
    state
FROM jobs
WHERE status = 'Active' AND salary >= 2500
ORDER BY salary DESC;

-- ==============================================
-- 2. LOGICAL OPERATORS (AND, OR, NOT) - CORRECTED
-- ==============================================

-- Students with specific age and status
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    status,
    city,
    state,
    email
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
WHERE city IN ('San Francisco', 'Palo Alto') OR state = 'CA'
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

-- Complex logical conditions with job applications
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.age,
    s.status,
    s.city,
    s.state,
    COUNT(a.app_id) as application_count
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
WHERE (s.age BETWEEN 21 AND 24) AND (s.status = 'Available' OR s.status = 'Applied')
GROUP BY s.stud_id, s.first_name, s.last_name, s.age, s.status, s.city, s.state
ORDER BY s.age, s.last_name;

-- Jobs with complex conditions
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    j.salary,
    j.job_type,
    j.city,
    j.state
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
WHERE (j.job_type = 'Internship' OR j.job_type = 'Full-time') 
    AND j.salary BETWEEN 2000 AND 4000
    AND j.status = 'Active'
ORDER BY j.salary DESC;

-- ==============================================
-- 3. LIKE / NOT LIKE OPERATORS - CORRECTED
-- ==============================================

-- Students with names starting with 'A'
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email,
    phone
FROM students
WHERE first_name LIKE 'A%'
ORDER BY first_name;

-- Students with names containing specific patterns
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email
FROM students
WHERE last_name LIKE '%son%' OR last_name LIKE '%man%'
ORDER BY last_name;

-- Students with email domains
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email
FROM students
WHERE email LIKE '%@email.com'
ORDER BY email;

-- Jobs with titles containing specific keywords
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    j.job_type,
    j.salary
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
WHERE j.title LIKE '%Developer%' OR j.title LIKE '%Engineer%' OR j.title LIKE '%Analyst%'
ORDER BY j.title;

-- Companies with names NOT starting with specific letters
SELECT 
    comp_id,
    name as company_name,
    industry,
    city,
    state
FROM company
WHERE name NOT LIKE 'A%' AND name NOT LIKE 'B%'
ORDER BY name;

-- Skills with names containing specific patterns
SELECT 
    skill_id,
    skill_name,
    category
FROM skills
WHERE skill_name LIKE '%Java%' OR skill_name LIKE '%Script%' OR skill_name LIKE '%SQL%'
ORDER BY category, skill_name;

-- ==============================================
-- 4. IN / NOT IN OPERATORS - CORRECTED
-- ==============================================

-- Students with specific IDs
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email,
    status,
    city,
    state
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

-- Students with applications in specific statuses
SELECT DISTINCT
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.status as student_status
FROM students s
JOIN application a ON s.stud_id = a.stud_id
WHERE a.status IN ('Selected', 'Shortlisted', 'Under Review')
ORDER BY s.last_name;

-- Jobs from companies in specific industries
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    c.industry,
    j.salary
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
WHERE c.industry IN ('Technology', 'Data Analytics', 'Healthcare Technology')
ORDER BY c.industry, j.title;

-- Skills NOT in specific categories
SELECT 
    skill_id,
    skill_name,
    category
FROM skills
WHERE category NOT IN ('Programming', 'Frontend')
ORDER BY category, skill_name;

-- ==============================================
-- 5. BETWEEN...AND OPERATORS - CORRECTED
-- ==============================================

-- Students with age range
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    city,
    state,
    status
FROM students
WHERE age BETWEEN 21 AND 24
ORDER BY age, last_name;

-- Jobs with salary range
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    j.salary,
    j.job_type,
    j.city,
    j.state
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
WHERE j.salary BETWEEN 2500 AND 3500
ORDER BY j.salary DESC;

-- Applications within date range
SELECT 
    a.app_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    a.status,
    a.application_date
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
WHERE a.application_date BETWEEN '2024-01-01' AND '2024-02-29'
ORDER BY a.application_date DESC;

-- Interview scores in range
SELECT 
    i.interview_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    i.interview_score,
    i.interview_date,
    i.status as interview_status
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
WHERE i.interview_score BETWEEN 80 AND 100
ORDER BY i.interview_score DESC;

-- Students with age NOT in specific range
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
-- 6. IS NULL / IS NOT NULL OPERATORS - CORRECTED
-- ==============================================

-- Students with middle names
SELECT 
    stud_id,
    CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) as full_name,
    email,
    middle_name
FROM students
WHERE middle_name IS NOT NULL AND middle_name != ''
ORDER BY last_name;

-- Students without middle names
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as full_name,
    email
FROM students
WHERE middle_name IS NULL OR middle_name = ''
ORDER BY last_name;

-- Interviews with scores
SELECT 
    i.interview_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    i.interview_date,
    i.interview_score,
    i.status as interview_status
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
WHERE i.interview_score IS NOT NULL
ORDER BY i.interview_score DESC;

-- Interviews without scores (scheduled/pending)
SELECT 
    i.interview_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    i.interview_date,
    i.status as interview_status
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
WHERE i.interview_score IS NULL
ORDER BY i.interview_date;

-- Students with profile information
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    sp.linkedin_url,
    sp.github_url,
    sp.salary_expectation
FROM students s
JOIN student_profile sp ON s.stud_id = sp.stud_id
WHERE sp.linkedin_url IS NOT NULL OR sp.github_url IS NOT NULL
ORDER BY s.last_name;

-- ==============================================
-- 7. ORDER BY CLAUSE - CORRECTED
-- ==============================================

-- Students ordered by last name with additional info
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    email,
    phone,
    city,
    state,
    status
FROM students
ORDER BY last_name ASC, first_name ASC;

-- Students ordered by age descending
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    age,
    city,
    state,
    status
FROM students
ORDER BY age DESC, last_name ASC;

-- Jobs ordered by company and salary
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    c.industry,
    j.salary,
    j.job_type,
    j.posted_date
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
ORDER BY c.name ASC, j.salary DESC, j.posted_date DESC;

-- Applications ordered by date and status
SELECT 
    a.app_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    c.name as company_name,
    a.status,
    a.application_date
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
ORDER BY a.application_date DESC, a.status ASC;

-- ==============================================
-- 8. GROUP BY CLAUSE - CORRECTED
-- ==============================================

-- Students grouped by status with enhanced metrics
SELECT 
    status,
    COUNT(*) as student_count,
    AVG(age) as avg_age,
    MIN(age) as min_age,
    MAX(age) as max_age,
    COUNT(DISTINCT city) as unique_cities,
    COUNT(DISTINCT state) as unique_states
FROM students
GROUP BY status
ORDER BY student_count DESC;

-- Students grouped by state with application metrics
SELECT 
    s.state,
    COUNT(DISTINCT s.stud_id) as student_count,
    COUNT(DISTINCT s.city) as city_count,
    AVG(s.age) as avg_age,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.state
ORDER BY student_count DESC;

-- Jobs grouped by company with comprehensive stats
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    COUNT(j.job_id) as job_count,
    COUNT(DISTINCT j.job_type) as job_types,
    AVG(j.salary) as avg_salary,
    MIN(j.salary) as min_salary,
    MAX(j.salary) as max_salary,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications
FROM company c
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
GROUP BY c.comp_id, c.name, c.industry
ORDER BY job_count DESC, total_applications DESC;

-- Applications grouped by status with time analysis
SELECT 
    status,
    COUNT(*) as application_count,
    COUNT(DISTINCT stud_id) as unique_students,
    COUNT(DISTINCT job_id) as unique_jobs,
    MIN(application_date) as earliest_application,
    MAX(application_date) as latest_application,
    AVG(DATEDIFF(CURDATE(), application_date)) as avg_days_since_application
FROM application
GROUP BY status
ORDER BY application_count DESC;

-- Skills grouped by category with usage stats
SELECT 
    sk.category,
    COUNT(DISTINCT sk.skill_id) as skill_count,
    COUNT(DISTINCT ss.stud_id) as students_with_skills,
    COUNT(DISTINCT js.job_id) as jobs_requiring_skills,
    AVG(ss.years_experience) as avg_student_experience
FROM skills sk
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
GROUP BY sk.category
ORDER BY skill_count DESC;

-- ==============================================
-- 9. AGGREGATE FUNCTIONS - CORRECTED
-- ==============================================

-- Comprehensive student statistics
SELECT 
    COUNT(*) as total_students,
    COUNT(DISTINCT state) as unique_states,
    COUNT(DISTINCT city) as unique_cities,
    AVG(age) as avg_age,
    MIN(age) as min_age,
    MAX(age) as max_age,
    STDDEV(age) as age_std_dev,
    SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_students,
    SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) as applied_students,
    SUM(CASE WHEN status = 'Selected' THEN 1 ELSE 0 END) as selected_students,
    SUM(CASE WHEN middle_name IS NOT NULL THEN 1 ELSE 0 END) as students_with_middle_names
FROM students;

-- Comprehensive job statistics
SELECT 
    COUNT(*) as total_jobs,
    COUNT(DISTINCT comp_id) as unique_companies,
    COUNT(DISTINCT job_type) as unique_job_types,
    AVG(salary) as avg_salary,
    MIN(salary) as min_salary,
    MAX(salary) as max_salary,
    STDDEV(salary) as salary_std_dev,
    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_jobs,
    SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_jobs,
    SUM(CASE WHEN job_type = 'Internship' THEN 1 ELSE 0 END) as internship_jobs,
    SUM(CASE WHEN job_type = 'Full-time' THEN 1 ELSE 0 END) as fulltime_jobs
FROM jobs;

-- Application and interview comprehensive statistics
SELECT 
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT a.stud_id) as unique_students_applied,
    COUNT(DISTINCT a.job_id) as unique_jobs_applied,
    SUM(CASE WHEN a.status = 'Selected' THEN 1 ELSE 0 END) as selected_applications,
    SUM(CASE WHEN a.status = 'Pending' THEN 1 ELSE 0 END) as pending_applications,
    SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) as rejected_applications,
    COUNT(DISTINCT i.interview_id) as total_interviews,
    COUNT(CASE WHEN i.interview_score IS NOT NULL THEN 1 END) as scored_interviews,
    AVG(i.interview_score) as avg_interview_score,
    MIN(i.interview_score) as min_interview_score,
    MAX(i.interview_score) as max_interview_score,
    COUNT(CASE WHEN i.status = 'Completed' THEN 1 END) as completed_interviews,
    COUNT(CASE WHEN i.status = 'Scheduled' THEN 1 END) as scheduled_interviews
FROM application a
LEFT JOIN interview i ON a.app_id = i.app_id;

-- Skills and education statistics
SELECT 
    'Skills' as category,
    COUNT(DISTINCT sk.skill_id) as total_items,
    COUNT(DISTINCT sk.category) as categories,
    COUNT(DISTINCT ss.stud_id) as students_involved,
    NULL as avg_numeric_value
FROM skills sk
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id

UNION ALL

SELECT 
    'Education' as category,
    COUNT(DISTINCT e.edu_id) as total_items,
    COUNT(DISTINCT e.degree) as categories,
    COUNT(DISTINCT e.stud_id) as students_involved,
    AVG(e.cgpa) as avg_numeric_value
FROM education e

UNION ALL

SELECT 
    'Projects' as category,
    COUNT(DISTINCT p.proj_id) as total_items,
    COUNT(DISTINCT p.project_type) as categories,
    COUNT(DISTINCT p.stud_id) as students_involved,
    NULL as avg_numeric_value
FROM projects p;

-- ==============================================
-- 10. HAVING CLAUSE - CORRECTED
-- ==============================================

-- States with more than 1 student and their application success
SELECT 
    s.state,
    COUNT(DISTINCT s.stud_id) as student_count,
    AVG(s.age) as avg_age,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    ROUND((COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) / NULLIF(COUNT(a.app_id), 0)) * 100, 2) as success_rate
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.state
HAVING COUNT(DISTINCT s.stud_id) > 1
ORDER BY student_count DESC, success_rate DESC;

-- Companies with multiple jobs and high performance
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    COUNT(DISTINCT j.job_id) as job_count,
    AVG(j.salary) as avg_salary,
    COUNT(a.app_id) as total_applications,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_applications,
    ROUND((COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) / NULLIF(COUNT(a.app_id), 0)) * 100, 2) as selection_rate
FROM company c
JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
GROUP BY c.comp_id, c.name, c.industry
HAVING COUNT(DISTINCT j.job_id) >= 2 AND AVG(j.salary) > 2500
ORDER BY job_count DESC, avg_salary DESC;

-- Students with multiple applications and good performance
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.city,
    s.state,
    COUNT(a.app_id) as application_count,
    COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_count,
    COUNT(CASE WHEN a.status = 'Shortlisted' THEN 1 END) as shortlisted_count,
    AVG(i.interview_score) as avg_interview_score
FROM students s
JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.city, s.state
HAVING COUNT(a.app_id) >= 2 
    AND (COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) > 0 
         OR AVG(i.interview_score) >= 80)
ORDER BY application_count DESC, avg_interview_score DESC;

-- Skills with high demand and good supply
SELECT 
    sk.skill_id,
    sk.skill_name,
    sk.category,
    COUNT(DISTINCT js.job_id) as jobs_requiring,
    COUNT(DISTINCT ss.stud_id) as students_with_skill,
    COUNT(CASE WHEN js.is_mandatory = TRUE THEN 1 END) as mandatory_requirements,
    AVG(ss.years_experience) as avg_student_experience
FROM skills sk
LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
GROUP BY sk.skill_id, sk.skill_name, sk.category
HAVING COUNT(DISTINCT js.job_id) >= 2 AND COUNT(DISTINCT ss.stud_id) >= 1
ORDER BY jobs_requiring DESC, students_with_skill DESC;

-- ==============================================
-- 11. SET OPERATORS - CORRECTED
-- ==============================================

-- Students from CA or NY with additional details (UNION)
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state,
    age,
    status,
    'California Student' as region_type
FROM students
WHERE state = 'CA'
UNION
SELECT 
    stud_id,
    CONCAT(first_name, ' ', last_name) as student_name,
    city,
    state,
    age,
    status,
    'New York Student' as region_type
FROM students
WHERE state = 'NY'
ORDER BY state, student_name;

-- Students with applications vs students with interviews (UNION ALL)
SELECT 
    DISTINCT s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    'Has Application' as activity_type,
    COUNT(a.app_id) as count
FROM students s
JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name
UNION ALL
SELECT 
    DISTINCT s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    'Has Interview' as activity_type,
    COUNT(i.interview_id) as count
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN interview i ON a.app_id = i.app_id
GROUP BY s.stud_id, s.first_name, s.last_name
ORDER BY stud_id, activity_type;

-- Students who have both applications and interviews (INTERSECT - simulated)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    COUNT(DISTINCT a.app_id) as applications,
    COUNT(DISTINCT i.interview_id) as interviews
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN interview i ON a.app_id = i.app_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email
ORDER BY s.stud_id;

-- Students with applications but no interviews (EXCEPT - simulated)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    COUNT(a.app_id) as applications
FROM students s
JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_id IS NULL
GROUP BY s.stud_id, s.first_name, s.last_name, s.email
ORDER BY s.stud_id;

-- ==============================================
-- 12. SQL SINGLE ROW FUNCTIONS - CORRECTED
-- ==============================================

-- Enhanced string functions with student data
SELECT 
    stud_id,
    CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) as full_name,
    UPPER(first_name) as first_name_upper,
    LOWER(last_name) as last_name_lower,
    INITCAP(CONCAT(first_name, ' ', last_name)) as proper_case_name,
    LENGTH(CONCAT(first_name, last_name)) as name_length,
    SUBSTRING(email, 1, LOCATE('@', email) - 1) as username,
    SUBSTRING(email, LOCATE('@', email) + 1) as domain,
    REPLACE(email, '@email.com', '@university.edu') as new_email,
    LEFT(phone, 3) as area_code,
    RIGHT(phone, 4) as last_four_digits
FROM students
WHERE email IS NOT NULL
ORDER BY last_name;

-- Enhanced date functions with application data
SELECT 
    a.app_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    a.status,
    a.application_date,
    DATE(a.application_date) as application_date_only,
    TIME(a.application_date) as application_time_only,
    YEAR(a.application_date) as application_year,
    MONTH(a.application_date) as application_month,
    DAY(a.application_date) as application_day,
    DAYNAME(a.application_date) as day_name,
    MONTHNAME(a.application_date) as month_name,
    DATEDIFF(CURDATE(), a.application_date) as days_since_application,
    WEEK(a.application_date) as week_of_year,
    QUARTER(a.application_date) as quarter,
    DATE_FORMAT(a.application_date, '%Y-%m-%d') as formatted_date,
    DATE_FORMAT(a.application_date, '%W, %M %d, %Y') as readable_date
FROM application a
JOIN students s ON a.stud_id = s.stud_id
JOIN jobs j ON a.job_id = j.job_id
ORDER BY a.application_date DESC;

-- Time functions with interview data
SELECT 
    i.interview_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    i.interview_date,
    DATE(i.interview_date) as interview_date_only,
    TIME(i.interview_date) as interview_time_only,
    HOUR(i.interview_date) as interview_hour,
    MINUTE(i.interview_date) as interview_minute,
    DAYOFWEEK(i.interview_date) as day_of_week_num,
    DAYNAME(i.interview_date) as day_name,
    DATE_FORMAT(i.interview_date, '%Y-%m-%d %H:%i:%s') as formatted_datetime,
    DATE_FORMAT(i.interview_date, '%W, %M %d, %Y at %h:%i %p') as readable_datetime,
    TIMESTAMPDIFF(HOUR, NOW(), i.interview_date) as hours_until_interview
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
ORDER BY i.interview_date;

-- Mathematical functions with salary and score data
SELECT 
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    j.salary,
    ROUND(j.salary, 0) as rounded_salary,
    CEIL(j.salary) as ceiling_salary,
    FLOOR(j.salary) as floor_salary,
    ABS(j.salary - 3000) as salary_difference_from_3000,
    SQRT(j.salary) as salary_square_root,
    LOG(j.salary) as salary_logarithm,
    POWER(j.salary / 1000, 2) as salary_thousands_squared,
    MOD(CAST(j.salary AS UNSIGNED), 1000) as salary_mod_1000,
    GREATEST(j.salary, 2500) as salary_or_2500_max,
    LEAST(j.salary, 4000) as salary_or_4000_min
FROM jobs j
JOIN company c ON j.comp_id = c.comp_id
WHERE j.salary IS NOT NULL
ORDER BY j.salary DESC;

-- Mathematical functions with interview scores
SELECT 
    i.interview_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.title as job_title,
    i.interview_score,
    ROUND(i.interview_score, 1) as rounded_score,
    CEIL(i.interview_score) as ceiling_score,
    FLOOR(i.interview_score) as floor_score,
    ABS(i.interview_score - 80) as score_difference_from_80,
    SQRT(i.interview_score) as score_square_root,
    POWER(i.interview_score / 100, 2) as normalized_score_squared,
    CASE 
        WHEN i.interview_score >= 90 THEN 'A'
        WHEN i.interview_score >= 80 THEN 'B'
        WHEN i.interview_score >= 70 THEN 'C'
        WHEN i.interview_score >= 60 THEN 'D'
        ELSE 'F'
    END as letter_grade
FROM interview i
JOIN students s ON i.stud_id = s.stud_id
JOIN application a ON i.app_id = a.app_id
JOIN jobs j ON a.job_id = j.job_id
WHERE i.interview_score IS NOT NULL
ORDER BY i.interview_score DESC;

-- ==============================================
-- 13. CORRELATED AND NESTED QUERIES - CORRECTED
-- ==============================================

-- Students with above-average interview scores (Correlated)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    i.interview_score,
    i.interview_date,
    j.title as job_title,
    c.name as company_name,
    (SELECT AVG(interview_score) FROM interview WHERE interview_score IS NOT NULL) as overall_avg_score,
    ROUND(i.interview_score - (SELECT AVG(interview_score) FROM interview WHERE interview_score IS NOT NULL), 2) as score_above_avg
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
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
    s.email,
    s.city,
    s.state,
    COUNT(a.app_id) as application_count,
    (SELECT ROUND(AVG(app_count), 2) FROM (
        SELECT COUNT(app_id) as app_count 
        FROM application 
        GROUP BY stud_id
    ) as avg_apps) as avg_applications_per_student
FROM students s
JOIN application a ON s.stud_id = a.stud_id
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.city, s.state
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
    c.city,
    c.state,
    COUNT(j.job_id) as job_count,
    AVG(j.salary) as avg_company_salary,
    (SELECT AVG(salary) FROM jobs WHERE salary IS NOT NULL) as overall_avg_salary,
    ROUND(AVG(j.salary) - (SELECT AVG(salary) FROM jobs WHERE salary IS NOT NULL), 2) as salary_above_avg
FROM company c
JOIN jobs j ON c.comp_id = j.comp_id
WHERE j.salary IS NOT NULL
GROUP BY c.comp_id, c.name, c.industry, c.city, c.state
HAVING AVG(j.salary) > (SELECT AVG(salary) FROM jobs WHERE salary IS NOT NULL)
ORDER BY avg_company_salary DESC;

-- Students with highest interview score per job (Nested with enhanced details)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    i.interview_score,
    i.interview_date,
    i.status as interview_status,
    (SELECT COUNT(*) FROM interview i3 
     JOIN application a3 ON i3.app_id = a3.app_id 
     WHERE a3.job_id = j.job_id) as total_interviews_for_job
FROM students s
JOIN application a ON s.stud_id = a.stud_id
JOIN jobs j ON a.job_id = j.job_id
JOIN company c ON j.comp_id = c.comp_id
JOIN interview i ON a.app_id = i.app_id
WHERE i.interview_score = (
    SELECT MAX(i2.interview_score)
    FROM interview i2
    JOIN application a2 ON i2.app_id = a2.app_id
    WHERE a2.job_id = j.job_id
    AND i2.interview_score IS NOT NULL
)
AND i.interview_score IS NOT NULL
ORDER BY j.job_id, i.interview_score DESC;

-- Students with skills matching specific job requirements (Correlated)
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    j.job_id,
    j.title as job_title,
    c.name as company_name,
    (SELECT COUNT(DISTINCT js.skill_id) 
     FROM job_skills js 
     WHERE js.job_id = j.job_id) as total_required_skills,
    (SELECT COUNT(DISTINCT ss.skill_id) 
     FROM student_skills ss 
     JOIN job_skills js ON ss.skill_id = js.skill_id
     WHERE ss.stud_id = s.stud_id AND js.job_id = j.job_id) as matching_skills,
    ROUND(((SELECT COUNT(DISTINCT ss.skill_id) 
            FROM student_skills ss 
            JOIN job_skills js ON ss.skill_id = js.skill_id
            WHERE ss.stud_id = s.stud_id AND js.job_id = j.job_id) 
           / (SELECT COUNT(DISTINCT js.skill_id) 
              FROM job_skills js 
              WHERE js.job_id = j.job_id)) * 100, 2) as skill_match_percentage
FROM students s
CROSS JOIN jobs j
JOIN company c ON j.comp_id = c.comp_id
WHERE j.status = 'Active'
    AND EXISTS (
        SELECT 1 FROM student_skills ss 
        JOIN job_skills js ON ss.skill_id = js.skill_id
        WHERE ss.stud_id = s.stud_id AND js.job_id = j.job_id
    )
HAVING skill_match_percentage >= 50
ORDER BY skill_match_percentage DESC, matching_skills DESC;

-- ==============================================
-- 14. COMPLEX COMBINED QUERIES - CORRECTED
-- ==============================================

-- Top performing students with comprehensive statistics
SELECT 
    s.stud_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.email,
    s.phone,
    s.city,
    s.state,
    s.age,
    s.status,
    -- Application metrics
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.app_id END) as pending_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Under Review' THEN a.app_id END) as under_review_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as success_rate,
    -- Interview metrics
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score,
    MAX(i.interview_score) as max_interview_score,
    -- Skills and projects
    COUNT(DISTINCT ss.skill_id) as total_skills,
    COUNT(DISTINCT sk.category) as skill_categories,
    COUNT(DISTINCT p.proj_id) as total_projects,
    -- Education metrics
    COUNT(DISTINCT e.edu_id) as education_records,
    AVG(e.cgpa) as avg_cgpa,
    -- Profile information
    sp.salary_expectation,
    CASE WHEN sp.linkedin_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_linkedin,
    CASE WHEN sp.github_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_github
FROM students s
LEFT JOIN application a ON s.stud_id = a.stud_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
LEFT JOIN projects p ON s.stud_id = p.stud_id
LEFT JOIN education e ON s.stud_id = e.stud_id
LEFT JOIN student_profile sp ON s.stud_id = sp.stud_id
WHERE s.status IN ('Available', 'Applied')
GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.phone, s.city, s.state, s.age, s.status, sp.salary_expectation, sp.linkedin_url, sp.github_url
HAVING COUNT(DISTINCT a.app_id) >= 1
ORDER BY success_rate DESC, avg_interview_score DESC, total_skills DESC;

-- Company performance analysis with detailed metrics
SELECT 
    c.comp_id,
    c.name as company_name,
    c.industry,
    c.city,
    c.state,
    c.website,
    c.is_active,
    -- HR and contact information
    COUNT(DISTINCT h.hr_id) as hr_contacts,
    GROUP_CONCAT(DISTINCT h.hr_name ORDER BY h.hr_name SEPARATOR ', ') as hr_names,
    -- Job metrics
    COUNT(DISTINCT j.job_id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'Active' THEN j.job_id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.job_type = 'Internship' THEN j.job_id END) as internship_jobs,
    AVG(j.salary) as avg_job_salary,
    MIN(j.salary) as min_salary,
    MAX(j.salary) as max_salary,
    -- Application metrics
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'Under Review' THEN a.app_id END) as under_review_applications,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as selection_rate,
    -- Interview metrics
    COUNT(DISTINCT i.interview_id) as total_interviews,
    AVG(i.interview_score) as avg_interview_score,
    -- Skills required
    COUNT(DISTINCT js.skill_id) as unique_skills_required,
    COUNT(DISTINCT CASE WHEN js.is_mandatory = TRUE THEN js.skill_id END) as mandatory_skills_required,
    -- Time metrics
    MIN(j.posted_date) as first_job_posted,
    MAX(j.posted_date) as latest_job_posted,
    AVG(DATEDIFF(j.deadline, j.posted_date)) as avg_application_window_days
FROM company c
LEFT JOIN hr h ON c.comp_id = h.comp_id
LEFT JOIN jobs j ON c.comp_id = j.comp_id
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN interview i ON a.app_id = i.app_id
LEFT JOIN job_skills js ON j.job_id = js.job_id
WHERE c.is_active = TRUE
GROUP BY c.comp_id, c.name, c.industry, c.city, c.state, c.website, c.is_active
HAVING COUNT(DISTINCT j.job_id) > 0
ORDER BY selection_rate DESC, total_applications DESC, avg_interview_score DESC;

-- Skills demand vs supply comprehensive analysis
SELECT 
    sk.skill_id,
    sk.skill_name,
    sk.category,
    -- Demand metrics (jobs requiring this skill)
    COUNT(DISTINCT js.job_id) as jobs_requiring_skill,
    COUNT(DISTINCT CASE WHEN js.is_mandatory = TRUE THEN js.job_id END) as jobs_requiring_mandatory,
    COUNT(DISTINCT CASE WHEN js.required_level = 'Expert' THEN js.job_id END) as jobs_requiring_expert,
    COUNT(DISTINCT CASE WHEN js.required_level = 'Advanced' THEN js.job_id END) as jobs_requiring_advanced,
    AVG(js.weightage) as avg_skill_importance,
    -- Supply metrics (students with this skill)
    COUNT(DISTINCT ss.stud_id) as students_with_skill,
    COUNT(DISTINCT CASE WHEN ss.proficiency_level = 'Expert' THEN ss.stud_id END) as expert_students,
    COUNT(DISTINCT CASE WHEN ss.proficiency_level = 'Advanced' THEN ss.stud_id END) as advanced_students,
    COUNT(DISTINCT CASE WHEN ss.certified = TRUE THEN ss.stud_id END) as certified_students,
    AVG(ss.years_experience) as avg_student_experience,
    -- Supply vs demand analysis
    ROUND(COUNT(DISTINCT ss.stud_id) / NULLIF(COUNT(DISTINCT js.job_id), 0), 2) as supply_demand_ratio,
    CASE 
        WHEN COUNT(DISTINCT js.job_id) = 0 THEN 'No Current Demand'
        WHEN COUNT(DISTINCT ss.stud_id) = 0 THEN 'High Demand, No Supply'
        WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) > 3 THEN 'Oversupplied'
        WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) > 1.5 THEN 'Well Supplied'
        WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) > 0.5 THEN 'Balanced'
        ELSE 'Undersupplied'
    END as market_condition,
    -- Application success for this skill
    COUNT(DISTINCT app_with_skill.app_id) as applications_with_skill,
    COUNT(DISTINCT CASE WHEN app_with_skill.status = 'Selected' THEN app_with_skill.app_id END) as selected_with_skill
FROM skills sk
LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
LEFT JOIN (
    SELECT DISTINCT a.app_id, a.status, ss.skill_id
    FROM application a
    JOIN student_skills ss ON a.stud_id = ss.stud_id
    JOIN job_skills js ON a.job_id = js.job_id AND ss.skill_id = js.skill_id
) app_with_skill ON sk.skill_id = app_with_skill.skill_id
GROUP BY sk.skill_id, sk.skill_name, sk.category
HAVING COUNT(DISTINCT js.job_id) > 0 OR COUNT(DISTINCT ss.stud_id) > 0
ORDER BY jobs_requiring_skill DESC, supply_demand_ratio ASC;

