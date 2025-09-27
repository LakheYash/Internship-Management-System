USE Internship_db;

-- ==============================================
-- 1. BASIC STORED PROCEDURES - CORRECTED
-- ==============================================

-- Procedure to get comprehensive student statistics
DELIMITER //
CREATE PROCEDURE GetStudentStatistics(IN student_id INT)
BEGIN
    DECLARE student_count INT DEFAULT 0;
    
    -- Check if student exists
    SELECT COUNT(*) INTO student_count
    FROM students 
    WHERE stud_id = student_id;
    
    IF student_count = 0 THEN
        SELECT 'Student not found' as message;
    ELSE
        SELECT 
            s.stud_id,
            CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name) as full_name,
            s.email,
            s.phone,
            s.status,
            s.city,
            s.state,
            s.age,
            s.created_at as registration_date,
            -- Profile information
            sp.bio,
            sp.linkedin_url,
            sp.github_url,
            sp.salary_expectation,
            -- Application statistics
            COUNT(DISTINCT a.app_id) as total_applications,
            COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
            COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.app_id END) as pending_applications,
            ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as success_rate,
            -- Interview statistics
            COUNT(DISTINCT i.interview_id) as total_interviews,
            AVG(i.interview_score) as avg_interview_score,
            MAX(i.interview_score) as max_interview_score,
            -- Skills and projects
            COUNT(DISTINCT p.proj_id) as total_projects,
            COUNT(DISTINCT ss.skill_id) as total_skills,
            COUNT(DISTINCT sk.category) as skill_categories,
            -- Education
            COUNT(DISTINCT e.edu_id) as education_records,
            AVG(e.cgpa) as avg_cgpa
        FROM students s
        LEFT JOIN student_profile sp ON s.stud_id = sp.stud_id
        LEFT JOIN application a ON s.stud_id = a.stud_id
        LEFT JOIN interview i ON a.app_id = i.app_id
        LEFT JOIN projects p ON s.stud_id = p.stud_id
        LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
        LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
        LEFT JOIN education e ON s.stud_id = e.stud_id
        WHERE s.stud_id = student_id
        GROUP BY s.stud_id, s.first_name, s.middle_name, s.last_name, s.email, s.phone, s.status, s.city, s.state, s.age, s.created_at, sp.bio, sp.linkedin_url, sp.github_url, sp.salary_expectation;
    END IF;
END//
DELIMITER ;

-- Procedure to get comprehensive company statistics
DELIMITER //
CREATE PROCEDURE GetCompanyStatistics(IN company_id INT)
BEGIN
    DECLARE company_count INT DEFAULT 0;
    
    -- Check if company exists
    SELECT COUNT(*) INTO company_count
    FROM company 
    WHERE comp_id = company_id;
    
    IF company_count = 0 THEN
        SELECT 'Company not found' as message;
    ELSE
        SELECT 
            c.comp_id,
            c.name as company_name,
            c.industry,
            c.city,
            c.state,
            c.website,
            c.is_active,
            c.created_at as registration_date,
            -- HR contacts
            COUNT(DISTINCT h.hr_id) as hr_contacts_count,
            GROUP_CONCAT(DISTINCT h.hr_name ORDER BY h.hr_name SEPARATOR ', ') as hr_names,
            -- Job statistics
            COUNT(DISTINCT j.job_id) as total_jobs,
            COUNT(DISTINCT CASE WHEN j.status = 'Active' THEN j.job_id END) as active_jobs,
            AVG(j.salary) as avg_job_salary,
            MIN(j.salary) as min_salary,
            MAX(j.salary) as max_salary,
            -- Application statistics
            COUNT(DISTINCT a.app_id) as total_applications,
            COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
            ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) / NULLIF(COUNT(DISTINCT a.app_id), 0)) * 100, 2) as selection_rate,
            -- Interview statistics
            COUNT(DISTINCT i.interview_id) as total_interviews,
            AVG(i.interview_score) as avg_interview_score,
            -- Skills required
            COUNT(DISTINCT js.skill_id) as unique_skills_required
        FROM company c
        LEFT JOIN hr h ON c.comp_id = h.comp_id
        LEFT JOIN jobs j ON c.comp_id = j.comp_id
        LEFT JOIN application a ON j.job_id = a.job_id
        LEFT JOIN interview i ON a.app_id = i.app_id
        LEFT JOIN job_skills js ON j.job_id = js.job_id
        WHERE c.comp_id = company_id
        GROUP BY c.comp_id, c.name, c.industry, c.city, c.state, c.website, c.is_active, c.created_at;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 2. PROCEDURES WITH PARAMETERS AND VALIDATION - CORRECTED
-- ==============================================

-- Procedure to add new student with comprehensive validation
DELIMITER //
CREATE PROCEDURE AddNewStudent(
    IN p_first_name VARCHAR(50),
    IN p_middle_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_city VARCHAR(100),
    IN p_state VARCHAR(50),
    IN p_pin VARCHAR(10),
    IN p_age INT,
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20)
)
BEGIN
    DECLARE email_count INT DEFAULT 0;
    DECLARE phone_count INT DEFAULT 0;
    DECLARE new_student_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to add student due to database error' as message;
    END;
    
    START TRANSACTION;
    
    -- Validate email uniqueness
    SELECT COUNT(*) INTO email_count
    FROM students 
    WHERE email = p_email;
    
    -- Validate phone uniqueness
    SELECT COUNT(*) INTO phone_count
    FROM students 
    WHERE phone = p_phone;
    
    -- Comprehensive validation
    IF email_count > 0 THEN
        SELECT 'Error: Email already exists' as message;
        ROLLBACK;
    ELSEIF phone_count > 0 THEN
        SELECT 'Error: Phone number already exists' as message;
        ROLLBACK;
    ELSEIF p_age < 16 OR p_age > 100 THEN
        SELECT 'Error: Age must be between 16 and 100' as message;
        ROLLBACK;
    ELSEIF p_first_name IS NULL OR TRIM(p_first_name) = '' THEN
        SELECT 'Error: First name is required' as message;
        ROLLBACK;
    ELSEIF p_last_name IS NULL OR TRIM(p_last_name) = '' THEN
        SELECT 'Error: Last name is required' as message;
        ROLLBACK;
    ELSEIF p_email IS NULL OR p_email NOT LIKE '%@%' THEN
        SELECT 'Error: Valid email is required' as message;
        ROLLBACK;
    ELSE
        INSERT INTO students (first_name, middle_name, last_name, city, state, pin, age, email, phone)
        VALUES (TRIM(p_first_name), TRIM(p_middle_name), TRIM(p_last_name), TRIM(p_city), TRIM(p_state), TRIM(p_pin), p_age, TRIM(p_email), TRIM(p_phone));
        
        SET new_student_id = LAST_INSERT_ID();
        
        -- Send welcome notification
        INSERT INTO notifications (stud_id, msg, type)
        VALUES (new_student_id, 'Welcome to the Internship Management System!', 'info');
        
        COMMIT;
        SELECT CONCAT('Student added successfully with ID: ', new_student_id) as message, new_student_id as student_id;
    END IF;
END//
DELIMITER ;

-- Procedure to update application status with enhanced tracking
DELIMITER //
CREATE PROCEDURE UpdateApplicationStatus(
    IN p_app_id INT,
    IN p_new_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    IN p_admin_id INT,
    IN p_reason TEXT
)
BEGIN
    DECLARE app_count INT DEFAULT 0;
    DECLARE old_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected');
    DECLARE stud_id_var INT;
    DECLARE job_title_var VARCHAR(200);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to update application status' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if application exists and get details
    SELECT COUNT(*), status, stud_id INTO app_count, old_status, stud_id_var
    FROM application 
    WHERE app_id = p_app_id;
    
    IF app_count = 0 THEN
        SELECT 'Error: Application not found' as message;
        ROLLBACK;
    ELSEIF old_status = p_new_status THEN
        SELECT 'Error: Application already has this status' as message;
        ROLLBACK;
    ELSE
        -- Get job title for notification
        SELECT j.title INTO job_title_var
        FROM application a
        JOIN jobs j ON a.job_id = j.job_id
        WHERE a.app_id = p_app_id;
        
        -- Update application status
        UPDATE application 
        SET status = p_new_status, updated_at = CURRENT_TIMESTAMP
        WHERE app_id = p_app_id;
        
        -- Insert status history
        INSERT INTO application_status_history (app_id, old_status, new_status, changed_by, change_reason)
        VALUES (p_app_id, old_status, p_new_status, p_admin_id, p_reason);
        
        -- Send notification to student
        INSERT INTO notifications (stud_id, admin_id, msg, type)
        VALUES (
            stud_id_var, 
            p_admin_id, 
            CONCAT('Your application status for "', job_title_var, '" has been updated to: ', p_new_status), 
            CASE 
                WHEN p_new_status = 'Selected' THEN 'success'
                WHEN p_new_status = 'Rejected' THEN 'error'
                WHEN p_new_status = 'Shortlisted' THEN 'success'
                ELSE 'info'
            END
        );
        
        -- Update student status if selected
        IF p_new_status = 'Selected' THEN
            UPDATE students 
            SET status = 'Selected', updated_at = CURRENT_TIMESTAMP
            WHERE stud_id = stud_id_var;
        END IF;
        
        COMMIT;
        SELECT CONCAT('Application status updated from "', old_status, '" to "', p_new_status, '"') as message;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 3. PROCEDURES WITH CURSORS - CORRECTED
-- ==============================================

-- Procedure to get all students with their comprehensive skills profile
DELIMITER //
CREATE PROCEDURE GetStudentsWithSkills()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_stud_id INT;
    DECLARE v_student_name VARCHAR(200);
    DECLARE v_skill_name VARCHAR(100);
    DECLARE v_category VARCHAR(50);
    DECLARE v_proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert');
    DECLARE v_years_experience INT;
    DECLARE v_certified BOOLEAN;
    
    DECLARE student_cursor CURSOR FOR
        SELECT 
            s.stud_id,
            CONCAT(s.first_name, ' ', s.last_name) as student_name,
            sk.skill_name,
            sk.category,
            ss.proficiency_level,
            ss.years_experience,
            ss.certified
        FROM students s
        JOIN student_skills ss ON s.stud_id = ss.stud_id
        JOIN skills sk ON ss.skill_id = sk.skill_id
        ORDER BY s.stud_id, sk.category, sk.skill_name;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Create temporary table for results
    DROP TEMPORARY TABLE IF EXISTS temp_student_skills;
    CREATE TEMPORARY TABLE temp_student_skills (
        stud_id INT,
        student_name VARCHAR(200),
        skill_name VARCHAR(100),
        category VARCHAR(50),
        proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
        years_experience INT,
        certified BOOLEAN,
        skill_score INT
    );
    
    OPEN student_cursor;
    
    read_loop: LOOP
        FETCH student_cursor INTO v_stud_id, v_student_name, v_skill_name, v_category, v_proficiency_level, v_years_experience, v_certified;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO temp_student_skills VALUES (
            v_stud_id, 
            v_student_name, 
            v_skill_name, 
            v_category, 
            v_proficiency_level, 
            v_years_experience, 
            v_certified,
            CASE 
                WHEN v_proficiency_level = 'Expert' THEN 4
                WHEN v_proficiency_level = 'Advanced' THEN 3
                WHEN v_proficiency_level = 'Intermediate' THEN 2
                WHEN v_proficiency_level = 'Beginner' THEN 1
                ELSE 0
            END
        );
    END LOOP;
    
    CLOSE student_cursor;
    
    -- Return results with summary
    SELECT * FROM temp_student_skills ORDER BY stud_id, category, skill_name;
    
    -- Return summary statistics
    SELECT 
        'Summary' as report_type,
        COUNT(DISTINCT stud_id) as total_students,
        COUNT(DISTINCT skill_name) as unique_skills,
        COUNT(DISTINCT category) as skill_categories,
        AVG(skill_score) as avg_proficiency_score,
        COUNT(CASE WHEN certified = TRUE THEN 1 END) as total_certifications
    FROM temp_student_skills;
    
    -- Clean up
    DROP TEMPORARY TABLE temp_student_skills;
END//
DELIMITER ;

-- ==============================================
-- 4. PROCEDURES WITH CONDITIONAL LOGIC - CORRECTED
-- ==============================================

-- Procedure to find best matching students for a job with enhanced skill analysis
DELIMITER //
CREATE PROCEDURE FindBestMatchingStudents(IN p_job_id INT)
BEGIN
    DECLARE job_count INT DEFAULT 0;
    DECLARE job_title_var VARCHAR(200);
    DECLARE company_name_var VARCHAR(200);
    
    -- Check if job exists and get details
    SELECT COUNT(*), j.title, c.name 
    INTO job_count, job_title_var, company_name_var
    FROM jobs j
    JOIN company c ON j.comp_id = c.comp_id
    WHERE j.job_id = p_job_id;
    
    IF job_count = 0 THEN
        SELECT 'Error: Job not found' as message;
    ELSE
        -- Return job details first
        SELECT 
            j.job_id,
            j.title as job_title,
            c.name as company_name,
            j.salary,
            j.job_type,
            j.city,
            j.state,
            COUNT(DISTINCT js.skill_id) as total_required_skills,
            GROUP_CONCAT(DISTINCT CONCAT(sk.skill_name, ' (', js.required_level, 
                        CASE WHEN js.is_mandatory = TRUE THEN ' - Mandatory' ELSE ' - Optional' END, ')') 
                        ORDER BY js.is_mandatory DESC, js.weightage DESC SEPARATOR '; ') as required_skills_detail
        FROM jobs j
        JOIN company c ON j.comp_id = c.comp_id
        LEFT JOIN job_skills js ON j.job_id = js.job_id
        LEFT JOIN skills sk ON js.skill_id = sk.skill_id
        WHERE j.job_id = p_job_id
        GROUP BY j.job_id, j.title, c.name, j.salary, j.job_type, j.city, j.state;
        
        -- Find matching students
        SELECT 
            s.stud_id,
            CONCAT(s.first_name, ' ', s.last_name) as student_name,
            s.email,
            s.phone,
            s.city,
            s.state,
            s.age,
            -- Skill matching details
            COUNT(DISTINCT matching_skills.skill_id) as matching_skills_count,
            COUNT(DISTINCT required_skills.skill_id) as total_required_skills,
            COUNT(DISTINCT mandatory_matching.skill_id) as matching_mandatory_skills,
            COUNT(DISTINCT mandatory_required.skill_id) as total_mandatory_skills,
            GROUP_CONCAT(DISTINCT CONCAT(matching_skills.skill_name, ' (', student_skills.proficiency_level, ')') 
                        ORDER BY matching_skills.skill_name SEPARATOR ', ') as matching_skills_list,
            -- Calculate match scores
            ROUND((COUNT(DISTINCT matching_skills.skill_id) / NULLIF(COUNT(DISTINCT required_skills.skill_id), 0)) * 100, 2) as overall_skill_match_percentage,
            ROUND((COUNT(DISTINCT mandatory_matching.skill_id) / NULLIF(COUNT(DISTINCT mandatory_required.skill_id), 0)) * 100, 2) as mandatory_skill_match_percentage,
            -- Additional metrics
            COUNT(DISTINCT ss.skill_id) as total_student_skills,
            COUNT(DISTINCT p.proj_id) as total_projects,
            AVG(e.cgpa) as avg_cgpa,
            sp.salary_expectation,
            -- Match quality assessment
            CASE 
                WHEN COUNT(DISTINCT mandatory_required.skill_id) > 0 AND COUNT(DISTINCT mandatory_matching.skill_id) = COUNT(DISTINCT mandatory_required.skill_id) THEN
                    CASE 
                        WHEN (COUNT(DISTINCT matching_skills.skill_id) / COUNT(DISTINCT required_skills.skill_id)) >= 0.8 THEN 'Excellent Match'
                        WHEN (COUNT(DISTINCT matching_skills.skill_id) / COUNT(DISTINCT required_skills.skill_id)) >= 0.6 THEN 'Very Good Match'
                        WHEN (COUNT(DISTINCT matching_skills.skill_id) / COUNT(DISTINCT required_skills.skill_id)) >= 0.4 THEN 'Good Match'
                        ELSE 'Fair Match'
                    END
                WHEN COUNT(DISTINCT mandatory_required.skill_id) > 0 THEN 'Missing Mandatory Skills'
                WHEN (COUNT(DISTINCT matching_skills.skill_id) / COUNT(DISTINCT required_skills.skill_id)) >= 0.6 THEN 'Good Match'
                WHEN (COUNT(DISTINCT matching_skills.skill_id) / COUNT(DISTINCT required_skills.skill_id)) >= 0.4 THEN 'Fair Match'
                ELSE 'Poor Match'
            END as match_quality
        FROM students s
        -- Get all required skills for the job
        LEFT JOIN (
            SELECT js.skill_id, sk.skill_name
            FROM job_skills js
            JOIN skills sk ON js.skill_id = sk.skill_id
            WHERE js.job_id = p_job_id
        ) required_skills ON TRUE
        -- Get mandatory skills for the job
        LEFT JOIN (
            SELECT js.skill_id, sk.skill_name
            FROM job_skills js
            JOIN skills sk ON js.skill_id = sk.skill_id
            WHERE js.job_id = p_job_id AND js.is_mandatory = TRUE
        ) mandatory_required ON TRUE
        -- Get student's matching skills
        LEFT JOIN student_skills student_skills ON s.stud_id = student_skills.stud_id AND required_skills.skill_id = student_skills.skill_id
        LEFT JOIN skills matching_skills ON student_skills.skill_id = matching_skills.skill_id
        -- Get student's matching mandatory skills
        LEFT JOIN student_skills mandatory_student_skills ON s.stud_id = mandatory_student_skills.stud_id AND mandatory_required.skill_id = mandatory_student_skills.skill_id
        LEFT JOIN skills mandatory_matching ON mandatory_student_skills.skill_id = mandatory_matching.skill_id
        -- Additional student information
        LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
        LEFT JOIN projects p ON s.stud_id = p.stud_id
        LEFT JOIN education e ON s.stud_id = e.stud_id
        LEFT JOIN student_profile sp ON s.stud_id = sp.stud_id
        WHERE s.status IN ('Available', 'Applied')
            AND EXISTS (
                SELECT 1 FROM student_skills ss2 
                JOIN job_skills js2 ON ss2.skill_id = js2.skill_id
                WHERE ss2.stud_id = s.stud_id AND js2.job_id = p_job_id
            )
        GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.phone, s.city, s.state, s.age, sp.salary_expectation
        HAVING overall_skill_match_percentage >= 30  -- Minimum 30% skill match
        ORDER BY 
            mandatory_skill_match_percentage DESC, 
            overall_skill_match_percentage DESC, 
            matching_skills_count DESC,
            avg_cgpa DESC;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 5. PROCEDURES WITH ERROR HANDLING - CORRECTED
-- ==============================================

-- Procedure to schedule interview with comprehensive error handling
DELIMITER //
CREATE PROCEDURE ScheduleInterview(
    IN p_app_id INT,
    IN p_mode ENUM('Online', 'Offline', 'Phone', 'Video'),
    IN p_interview_date DATETIME,
    IN p_interviewer_name VARCHAR(100),
    IN p_interviewer_email VARCHAR(100),
    IN p_hr_id INT
)
BEGIN
    DECLARE app_count INT DEFAULT 0;
    DECLARE interview_count INT DEFAULT 0;
    DECLARE stud_id_var INT;
    DECLARE job_title_var VARCHAR(200);
    DECLARE company_name_var VARCHAR(200);
    DECLARE app_status_var ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected');
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to schedule interview due to database error' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if application exists and get details
    SELECT COUNT(*), a.stud_id, j.title, c.name, a.status
    INTO app_count, stud_id_var, job_title_var, company_name_var, app_status_var
    FROM application a
    JOIN jobs j ON a.job_id = j.job_id
    JOIN company c ON j.comp_id = c.comp_id
    WHERE a.app_id = p_app_id;
    
    IF app_count = 0 THEN
        SELECT 'Error: Application not found' as message;
        ROLLBACK;
    ELSEIF app_status_var = 'Rejected' THEN
        SELECT 'Error: Cannot schedule interview for rejected application' as message;
        ROLLBACK;
    ELSEIF app_status_var = 'Selected' THEN
        SELECT 'Error: Cannot schedule interview for already selected application' as message;
        ROLLBACK;
    ELSEIF p_interview_date <= NOW() THEN
        SELECT 'Error: Interview date must be in the future' as message;
        ROLLBACK;
    ELSE
        -- Check if interview already exists
        SELECT COUNT(*) INTO interview_count
        FROM interview 
        WHERE app_id = p_app_id;
        
        IF interview_count > 0 THEN
            SELECT 'Error: Interview already scheduled for this application' as message;
            ROLLBACK;
        ELSE
            -- Insert interview
            INSERT INTO interview (app_id, stud_id, hr_id, mode, interview_date, interviewer_name, interviewer_email, status)
            VALUES (p_app_id, stud_id_var, p_hr_id, p_mode, p_interview_date, p_interviewer_name, p_interviewer_email, 'Scheduled');
            
            -- Update application status to shortlisted if not already
            IF app_status_var != 'Shortlisted' THEN
                UPDATE application 
                SET status = 'Shortlisted', updated_at = CURRENT_TIMESTAMP
                WHERE app_id = p_app_id;
                
                -- Add status history
                INSERT INTO application_status_history (app_id, old_status, new_status, change_reason)
                VALUES (p_app_id, app_status_var, 'Shortlisted', 'Interview scheduled');
            END IF;
            
            -- Send notification to student
            INSERT INTO notifications (stud_id, msg, type)
            VALUES (
                stud_id_var, 
                CONCAT('Interview scheduled for "', job_title_var, '" at ', company_name_var, ' on ', DATE_FORMAT(p_interview_date, '%Y-%m-%d at %H:%i')), 
                'info'
            );
            
            COMMIT;
            SELECT 
                'Interview scheduled successfully' as message,
                LAST_INSERT_ID() as interview_id,
                job_title_var as job_title,
                company_name_var as company_name,
                p_interview_date as scheduled_datetime;
        END IF;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 6. PROCEDURES WITH LOOPS AND ITERATION - CORRECTED
-- ==============================================

-- Procedure to generate comprehensive monthly report
DELIMITER //
CREATE PROCEDURE GenerateMonthlyReport(IN p_year INT, IN p_month INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_company_id INT;
    DECLARE v_company_name VARCHAR(200);
    DECLARE v_industry VARCHAR(100);
    DECLARE v_job_count INT;
    DECLARE v_application_count INT;
    DECLARE v_selected_count INT;
    DECLARE v_interview_count INT;
    DECLARE v_avg_salary DECIMAL(10,2);
    
    DECLARE company_cursor CURSOR FOR
        SELECT 
            c.comp_id,
            c.name as company_name,
            c.industry,
            COUNT(DISTINCT j.job_id) as job_count,
            COUNT(DISTINCT a.app_id) as application_count,
            COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_count,
            COUNT(DISTINCT i.interview_id) as interview_count,
            AVG(j.salary) as avg_salary
        FROM company c
        LEFT JOIN jobs j ON c.comp_id = j.comp_id AND YEAR(j.posted_date) = p_year AND MONTH(j.posted_date) = p_month
        LEFT JOIN application a ON j.job_id = a.job_id
        LEFT JOIN interview i ON a.app_id = i.app_id
        GROUP BY c.comp_id, c.name, c.industry
        ORDER BY application_count DESC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Create temporary table for report
    DROP TEMPORARY TABLE IF EXISTS temp_monthly_report;
    CREATE TEMPORARY TABLE temp_monthly_report (
        company_id INT,
        company_name VARCHAR(200),
        industry VARCHAR(100),
        job_count INT,
        application_count INT,
        selected_count INT,
        interview_count INT,
        avg_salary DECIMAL(10,2),
        selection_rate DECIMAL(5,2),
        performance_category VARCHAR(20)
    );
    
    OPEN company_cursor;
    
    read_loop: LOOP
        FETCH company_cursor INTO v_company_id, v_company_name, v_industry, v_job_count, v_application_count, v_selected_count, v_interview_count, v_avg_salary;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO temp_monthly_report VALUES (
            v_company_id,
            v_company_name, 
            v_industry,
            v_job_count, 
            v_application_count, 
            v_selected_count,
            v_interview_count,
            v_avg_salary,
            CASE 
                WHEN v_application_count > 0 THEN ROUND((v_selected_count / v_application_count) * 100, 2)
                ELSE 0
            END,
            CASE 
                WHEN v_application_count = 0 THEN 'No Activity'
                WHEN (v_selected_count / v_application_count) >= 0.5 THEN 'High Performance'
                WHEN (v_selected_count / v_application_count) >= 0.25 THEN 'Medium Performance'
                ELSE 'Low Performance'
            END
        );
    END LOOP;
    
    CLOSE company_cursor;
    
    -- Return comprehensive report
    SELECT 
        CONCAT(MONTHNAME(STR_TO_DATE(p_month, '%m')), ' ', p_year) as report_period,
        company_name,
        industry,
        job_count,
        application_count,
        selected_count,
        interview_count,
        avg_salary,
        selection_rate,
        performance_category,
        CASE 
            WHEN job_count > 0 THEN ROUND(application_count / job_count, 2)
            ELSE 0
        END as avg_applications_per_job
    FROM temp_monthly_report
    ORDER BY selection_rate DESC, application_count DESC;
    
    -- Summary statistics
    SELECT 
        'SUMMARY' as report_type,
        SUM(job_count) as total_jobs_posted,
        SUM(application_count) as total_applications,
        SUM(selected_count) as total_selections,
        SUM(interview_count) as total_interviews,
        AVG(avg_salary) as overall_avg_salary,
        ROUND(SUM(selected_count) / NULLIF(SUM(application_count), 0) * 100, 2) as overall_selection_rate,
        COUNT(*) as companies_with_activity,
        COUNT(CASE WHEN performance_category = 'High Performance' THEN 1 END) as high_performing_companies
    FROM temp_monthly_report
    WHERE job_count > 0 OR application_count > 0;
    
    -- Clean up
    DROP TEMPORARY TABLE temp_monthly_report;
END//
DELIMITER ;

-- ==============================================
-- 7. PROCEDURES WITH DYNAMIC SQL - CORRECTED
-- ==============================================

-- Procedure to search students with dynamic criteria and enhanced filtering
DELIMITER //
CREATE PROCEDURE SearchStudents(
    IN p_name VARCHAR(100),
    IN p_city VARCHAR(100),
    IN p_state VARCHAR(100),
    IN p_skill VARCHAR(100),
    IN p_status VARCHAR(20),
    IN p_min_age INT,
    IN p_max_age INT,
    IN p_has_applications BOOLEAN,
    IN p_limit_results INT
)
BEGIN
    DECLARE sql_query TEXT DEFAULT '';
    DECLARE where_clause TEXT DEFAULT '';
    DECLARE limit_clause TEXT DEFAULT '';
    
    -- Build dynamic WHERE clause
    IF p_name IS NOT NULL AND TRIM(p_name) != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND (s.first_name LIKE ''%', REPLACE(TRIM(p_name), '''', ''''''), '%'' OR s.last_name LIKE ''%', REPLACE(TRIM(p_name), '''', ''''''), '%'')');
    END IF;
    
    IF p_city IS NOT NULL AND TRIM(p_city) != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND s.city = ''', REPLACE(TRIM(p_city), '''', ''''''), '''');
    END IF;
    
    IF p_state IS NOT NULL AND TRIM(p_state) != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND s.state = ''', REPLACE(TRIM(p_state), '''', ''''''), '''');
    END IF;
    
    IF p_status IS NOT NULL AND TRIM(p_status) != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND s.status = ''', REPLACE(TRIM(p_status), '''', ''''''), '''');
    END IF;
    
    IF p_min_age IS NOT NULL AND p_min_age > 0 THEN
        SET where_clause = CONCAT(where_clause, ' AND s.age >= ', p_min_age);
    END IF;
    
    IF p_max_age IS NOT NULL AND p_max_age > 0 THEN
        SET where_clause = CONCAT(where_clause, ' AND s.age <= ', p_max_age);
    END IF;
    
    IF p_has_applications IS NOT NULL THEN
        IF p_has_applications = TRUE THEN
            SET where_clause = CONCAT(where_clause, ' AND EXISTS (SELECT 1 FROM application WHERE stud_id = s.stud_id)');
        ELSE
            SET where_clause = CONCAT(where_clause, ' AND NOT EXISTS (SELECT 1 FROM application WHERE stud_id = s.stud_id)');
        END IF;
    END IF;
    
    -- Add skill filter if specified
    IF p_skill IS NOT NULL AND TRIM(p_skill) != '' THEN
        SET where_clause = CONCAT(where_clause, '
            AND s.stud_id IN (
                SELECT DISTINCT s2.stud_id
                FROM students s2
                JOIN student_skills ss2 ON s2.stud_id = ss2.stud_id
                JOIN skills sk2 ON ss2.skill_id = sk2.skill_id
                WHERE sk2.skill_name LIKE ''%', REPLACE(TRIM(p_skill), '''', ''''''), '%''
            )');
    END IF;
    
    -- Add limit clause if specified
    IF p_limit_results IS NOT NULL AND p_limit_results > 0 THEN
        SET limit_clause = CONCAT(' LIMIT ', p_limit_results);
    END IF;
    
    -- Build main query
    SET sql_query = CONCAT('
        SELECT DISTINCT
            s.stud_id,
            CONCAT(s.first_name, '' '', COALESCE(s.middle_name, ''''), '' '', s.last_name) as student_name,
            s.email,
            s.phone,
            s.city,
            s.state,
            s.status,
            s.age,
            s.created_at as registration_date,
            COUNT(DISTINCT a.app_id) as total_applications,
            COUNT(DISTINCT CASE WHEN a.status = ''Selected'' THEN a.app_id END) as selected_applications,
            COUNT(DISTINCT ss.skill_id) as total_skills,
            COUNT(DISTINCT sk.category) as skill_categories,
            COUNT(DISTINCT p.proj_id) as total_projects,
            AVG(e.cgpa) as avg_cgpa,
            sp.salary_expectation,
            CASE WHEN sp.linkedin_url IS NOT NULL THEN ''Yes'' ELSE ''No'' END as has_linkedin,
            GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR '', '') as skills_list
        FROM students s
        LEFT JOIN application a ON s.stud_id = a.stud_id
        LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
        LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
        LEFT JOIN projects p ON s.stud_id = p.stud_id
        LEFT JOIN education e ON s.stud_id = e.stud_id
        LEFT JOIN student_profile sp ON s.stud_id = sp.stud_id
        WHERE 1=1', where_clause, '
        GROUP BY s.stud_id, s.first_name, s.middle_name, s.last_name, s.email, s.phone, s.city, s.state, s.status, s.age, s.created_at, sp.salary_expectation, sp.linkedin_url
        ORDER BY s.last_name, s.first_name', limit_clause);
    
    -- Execute dynamic query
    SET @sql = sql_query;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//
DELIMITER ;

-- ==============================================
-- 8. PROCEDURES WITH TRANSACTIONS - CORRECTED
-- ==============================================

-- Procedure to process application selection with comprehensive workflow
DELIMITER //
CREATE PROCEDURE ProcessApplicationSelection(
    IN p_app_id INT,
    IN p_admin_id INT,
    IN p_interview_score INT,
    IN p_feedback TEXT,
    IN p_selection_reason TEXT
)
BEGIN
    DECLARE app_count INT DEFAULT 0;
    DECLARE stud_id_var INT;
    DECLARE job_id_var INT;
    DECLARE job_title_var VARCHAR(200);
    DECLARE company_name_var VARCHAR(200);
    DECLARE app_status_var ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected');
    DECLARE interview_exists INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to process application selection due to database error' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if application exists and get details
    SELECT COUNT(*), a.stud_id, a.job_id, a.status, j.title, c.name
    INTO app_count, stud_id_var, job_id_var, app_status_var, job_title_var, company_name_var
    FROM application a
    JOIN jobs j ON a.job_id = j.job_id
    JOIN company c ON j.comp_id = c.comp_id
    WHERE a.app_id = p_app_id;
    
    IF app_count = 0 THEN
        SELECT 'Error: Application not found' as message;
        ROLLBACK;
    ELSEIF app_status_var = 'Selected' THEN
        SELECT 'Error: Application is already selected' as message;
        ROLLBACK;
    ELSEIF app_status_var = 'Rejected' THEN
        SELECT 'Error: Cannot select a rejected application' as message;
        ROLLBACK;
    ELSEIF p_interview_score < 0 OR p_interview_score > 100 THEN
        SELECT 'Error: Interview score must be between 0 and 100' as message;
        ROLLBACK;
    ELSE
        -- Check if interview exists
        SELECT COUNT(*) INTO interview_exists
        FROM interview 
        WHERE app_id = p_app_id;
        
        -- Update application status
        UPDATE application 
        SET status = 'Selected', updated_at = CURRENT_TIMESTAMP
        WHERE app_id = p_app_id;
        
        -- Update or insert interview record
        IF interview_exists > 0 THEN
            UPDATE interview 
            SET interview_score = p_interview_score, 
                feedback = p_feedback, 
                status = 'Completed',
                updated_at = CURRENT_TIMESTAMP
            WHERE app_id = p_app_id;
        ELSE
            -- Create interview record if it doesn't exist
            INSERT INTO interview (app_id, stud_id, mode, interview_date, interview_score, feedback, status)
            VALUES (p_app_id, stud_id_var, 'Other', NOW(), p_interview_score, p_feedback, 'Completed');
        END IF;
        
        -- Update student status
        UPDATE students 
        SET status = 'Selected', updated_at = CURRENT_TIMESTAMP
        WHERE stud_id = stud_id_var;
        
        -- Insert status history
        INSERT INTO application_status_history (app_id, old_status, new_status, changed_by, change_reason)
        VALUES (p_app_id, app_status_var, 'Selected', p_admin_id, CONCAT('Application selected. ', COALESCE(p_selection_reason, '')));
        
        -- Send congratulations notification
        INSERT INTO notifications (stud_id, admin_id, msg, type)
        VALUES (
            stud_id_var, 
            p_admin_id, 
            CONCAT('Congratulations! You have been selected for "', job_title_var, '" at ', company_name_var, '. Interview Score: ', p_interview_score, '/100'), 
            'success'
        );
        
        -- Reject other pending applications for the same job (optional business logic)
        UPDATE application 
        SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP
        WHERE job_id = job_id_var 
          AND stud_id != stud_id_var 
          AND status IN ('Pending', 'Under Review', 'Shortlisted');
        
        -- Send rejection notifications to other applicants
        INSERT INTO notifications (stud_id, admin_id, msg, type)
        SELECT 
            a.stud_id,
            p_admin_id,
            CONCAT('Thank you for your interest in "', job_title_var, '" at ', company_name_var, '. The position has been filled.'),
            'info'
        FROM application a
        WHERE a.job_id = job_id_var 
          AND a.stud_id != stud_id_var 
          AND a.status = 'Rejected';
        
        COMMIT;
        SELECT 
            'Application processed successfully' as message,
            stud_id_var as selected_student_id,
            job_title_var as job_title,
            company_name_var as company_name,
            p_interview_score as interview_score;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 9. UTILITY PROCEDURES - CORRECTED
-- ==============================================

-- Procedure to clean up old data with comprehensive cleanup
DELIMITER //
CREATE PROCEDURE CleanupOldData(IN p_days_to_keep INT)
BEGIN
    DECLARE deleted_notifications INT DEFAULT 0;
    DECLARE deleted_history INT DEFAULT 0;
    DECLARE archived_applications INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to cleanup data due to database error' as message;
    END;
    
    START TRANSACTION;
    
    -- Clean up old notifications
    DELETE FROM notifications 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY)
      AND is_read = TRUE;
    
    SET deleted_notifications = ROW_COUNT();
    
    -- Clean up old application status history (keep recent changes)
    DELETE FROM application_status_history 
    WHERE changed_at < DATE_SUB(NOW(), INTERVAL (p_days_to_keep * 2) DAY);
    
    SET deleted_history = ROW_COUNT();
    
    -- Archive old completed/rejected applications if archive table exists
    -- (This would create an archive table in a real scenario)
    SELECT COUNT(*) INTO archived_applications
    FROM application 
    WHERE application_date < DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY)
      AND status IN ('Selected', 'Rejected');
    
    COMMIT;
    
    -- Return cleanup summary
    SELECT 
        'Cleanup completed successfully' as status,
        deleted_notifications as deleted_notifications,
        deleted_history as deleted_status_history,
        archived_applications as applications_eligible_for_archive,
        p_days_to_keep as retention_period_days;
END//
DELIMITER ;

-- Procedure to get comprehensive system statistics
DELIMITER //
CREATE PROCEDURE GetSystemStatistics()
BEGIN
    SELECT 'SYSTEM OVERVIEW' as report_section;
    
    -- Basic counts
    SELECT 
        'Basic Statistics' as metric_type,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM company) as total_companies,
        (SELECT COUNT(DISTINCT h.hr_id) FROM hr h JOIN company c ON h.comp_id = c.comp_id WHERE c.is_active = TRUE) as active_hr_contacts,
        (SELECT COUNT(*) FROM jobs) as total_jobs,
        (SELECT COUNT(*) FROM jobs WHERE status = 'Active') as active_jobs,
        (SELECT COUNT(*) FROM application) as total_applications,
        (SELECT COUNT(*) FROM interview) as total_interviews,
        (SELECT COUNT(*) FROM skills) as total_skills,
        (SELECT COUNT(*) FROM projects) as total_projects;
    
    -- Application statistics
    SELECT 
        'Application Metrics' as metric_type,
        (SELECT COUNT(*) FROM application WHERE status = 'Pending') as pending_applications,
        (SELECT COUNT(*) FROM application WHERE status = 'Under Review') as under_review_applications,
        (SELECT COUNT(*) FROM application WHERE status = 'Shortlisted') as shortlisted_applications,
        (SELECT COUNT(*) FROM application WHERE status = 'Selected') as selected_applications,
        (SELECT COUNT(*) FROM application WHERE status = 'Rejected') as rejected_applications,
        (SELECT ROUND(AVG(DATEDIFF(NOW(), application_date)), 1) FROM application) as avg_days_since_application;
    
    -- Interview statistics
    SELECT 
        'Interview Metrics' as metric_type,
        (SELECT COUNT(*) FROM interview WHERE status = 'Scheduled') as scheduled_interviews,
        (SELECT COUNT(*) FROM interview WHERE status = 'Completed') as completed_interviews,
        (SELECT COUNT(*) FROM interview WHERE status = 'Cancelled') as cancelled_interviews,
        (SELECT ROUND(AVG(interview_score), 2) FROM interview WHERE interview_score IS NOT NULL) as avg_interview_score,
        (SELECT COUNT(*) FROM interview WHERE interview_score >= 80) as high_scoring_interviews;
    
    -- Skills statistics
    SELECT 
        'Skills Metrics' as metric_type,
        (SELECT COUNT(DISTINCT category) FROM skills) as skill_categories,
        (SELECT COUNT(*) FROM student_skills) as total_student_skills,
        (SELECT COUNT(*) FROM job_skills) as total_job_skill_requirements,
        (SELECT COUNT(*) FROM student_skills WHERE certified = TRUE) as certified_skills,
        (SELECT ROUND(AVG(years_experience), 2) FROM student_skills WHERE years_experience > 0) as avg_skill_experience;
    
    -- Recent activity (last 30 days)
    SELECT 
        'Recent Activity (30 days)' as metric_type,
        (SELECT COUNT(*) FROM students WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_student_registrations,
        (SELECT COUNT(*) FROM jobs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_jobs_posted,
        (SELECT COUNT(*) FROM application WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_applications,
        (SELECT COUNT(*) FROM interview WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_interviews_scheduled,
        (SELECT COUNT(*) FROM notifications WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as notifications_sent;
END//
DELIMITER ;

-- ==============================================
-- 10. ADVANCED PROCEDURES - NEW ADDITIONS
-- ==============================================

-- Procedure to generate skill gap analysis report
DELIMITER //
CREATE PROCEDURE GenerateSkillGapAnalysis()
BEGIN
    DROP TEMPORARY TABLE IF EXISTS temp_skill_analysis;
    CREATE TEMPORARY TABLE temp_skill_analysis (
        skill_name VARCHAR(100),
        category VARCHAR(50),
        jobs_requiring INT,
        students_with_skill INT,
        gap_ratio DECIMAL(5,2),
        market_condition VARCHAR(50)
    );
    
    INSERT INTO temp_skill_analysis
    SELECT 
        sk.skill_name,
        sk.category,
        COUNT(DISTINCT js.job_id) as jobs_requiring,
        COUNT(DISTINCT ss.stud_id) as students_with_skill,
        ROUND(COUNT(DISTINCT ss.stud_id) / NULLIF(COUNT(DISTINCT js.job_id), 0), 2) as gap_ratio,
        CASE 
            WHEN COUNT(DISTINCT js.job_id) = 0 THEN 'No Demand'
            WHEN COUNT(DISTINCT ss.stud_id) = 0 THEN 'Critical Shortage'
            WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) < 0.5 THEN 'High Demand'
            WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) < 1.0 THEN 'Moderate Demand'
            WHEN COUNT(DISTINCT ss.stud_id) / COUNT(DISTINCT js.job_id) < 2.0 THEN 'Balanced'
            ELSE 'Oversupplied'
        END as market_condition
    FROM skills sk
    LEFT JOIN job_skills js ON sk.skill_id = js.skill_id
    LEFT JOIN jobs j ON js.job_id = j.job_id AND j.status = 'Active'
    LEFT JOIN student_skills ss ON sk.skill_id = ss.skill_id
    LEFT JOIN students s ON ss.stud_id = s.stud_id AND s.status IN ('Available', 'Applied')
    GROUP BY sk.skill_id, sk.skill_name, sk.category
    HAVING jobs_requiring > 0 OR students_with_skill > 0;
    
    SELECT * FROM temp_skill_analysis 
    ORDER BY market_condition, gap_ratio ASC, jobs_requiring DESC;
    
    DROP TEMPORARY TABLE temp_skill_analysis;
END//
DELIMITER ;

-- Procedure to send bulk notifications
DELIMITER //
CREATE PROCEDURE SendBulkNotifications(
    IN p_recipient_type ENUM('all_students', 'available_students', 'selected_students', 'specific_students'),
    IN p_student_ids TEXT,
    IN p_message TEXT,
    IN p_notification_type ENUM('info', 'warning', 'success', 'error', 'reminder'),
    IN p_admin_id INT
)
BEGIN
    DECLARE notification_count INT DEFAULT 0;
    DECLARE sql_query TEXT;
    
    -- Validate inputs
    IF p_message IS NULL OR TRIM(p_message) = '' THEN
        SELECT 'Error: Message cannot be empty' as message;
    ELSE
        -- Build dynamic insert based on recipient type
        CASE p_recipient_type
            WHEN 'all_students' THEN
                INSERT INTO notifications (stud_id, admin_id, msg, type)
                SELECT s.stud_id, p_admin_id, p_message, p_notification_type
                FROM students s;
                
            WHEN 'available_students' THEN
                INSERT INTO notifications (stud_id, admin_id, msg, type)
                SELECT s.stud_id, p_admin_id, p_message, p_notification_type
                FROM students s
                WHERE s.status = 'Available';
                
            WHEN 'selected_students' THEN
                INSERT INTO notifications (stud_id, admin_id, msg, type)
                SELECT s.stud_id, p_admin_id, p_message, p_notification_type
                FROM students s
                WHERE s.status = 'Selected';
                
            WHEN 'specific_students' THEN
                IF p_student_ids IS NOT NULL AND TRIM(p_student_ids) != '' THEN
                    SET sql_query = CONCAT('
                        INSERT INTO notifications (stud_id, admin_id, msg, type)
                        SELECT s.stud_id, ', p_admin_id, ', ''', REPLACE(p_message, '''', ''''''), ''', ''', p_notification_type, '''
                        FROM students s
                        WHERE s.stud_id IN (', p_student_ids, ')');
                    
                    SET @sql = sql_query;
                    PREPARE stmt FROM @sql;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                END IF;
        END CASE;
        
        SET notification_count = ROW_COUNT();
        SELECT 
            CONCAT('Bulk notifications sent successfully to ', notification_count, ' students') as message,
            notification_count as recipients_count,
            p_notification_type as notification_type;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- PROCEDURE TESTING EXAMPLES
-- ==============================================

/*
-- Test the corrected procedures:

-- Basic statistics
CALL GetStudentStatistics(1);
CALL GetCompanyStatistics(1);
CALL GetSystemStatistics();

-- Student management
CALL AddNewStudent('Jane', 'Marie', 'Smith', 'Boston', 'MA', '02101', 24, 'jane.smith@email.com', '+1-555-9999');

-- Application management
CALL UpdateApplicationStatus(1, 'Under Review', 1, 'Application reviewed by HR team');
CALL FindBestMatchingStudents(1);

-- Interview scheduling
CALL ScheduleInterview(1, 'Online', '2024-04-01 14:00:00', 'John Interviewer', 'john@company.com', 1);
CALL ProcessApplicationSelection(1, 1, 88, 'Excellent candidate with strong technical skills', 'Best fit for the role');

-- Reporting and analysis
CALL GenerateMonthlyReport(2024, 3);
CALL GenerateSkillGapAnalysis();

-- Search and utilities
CALL SearchStudents('John', NULL, 'CA', 'JavaScript', 'Available', 20, 30, TRUE, 10);
CALL SendBulkNotifications('available_students', NULL, 'New job opportunities are available!', 'info', 1);
CALL CleanupOldData(60);

-- Advanced procedures
CALL GetStudentsWithSkills();
*/