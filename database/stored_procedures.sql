USE Internship_db;

-- ==============================================
-- 1. BASIC STORED PROCEDURES
-- ==============================================

-- Procedure to get student statistics
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
            CONCAT(s.first_name, ' ', s.last_name) as full_name,
            s.email,
            s.status,
            s.city,
            s.state,
            s.age,
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
        GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.status, s.city, s.state, s.age;
    END IF;
END//
DELIMITER ;

-- Procedure to get company statistics
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
            c.is_active,
            COUNT(DISTINCT j.job_id) as total_jobs,
            COUNT(DISTINCT a.app_id) as total_applications,
            COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_applications,
            AVG(j.salary) as avg_job_salary,
            AVG(cr.rating) as avg_rating,
            COUNT(DISTINCT cr.review_id) as total_reviews
        FROM company c
        LEFT JOIN jobs j ON c.comp_id = j.comp_id
        LEFT JOIN application a ON j.job_id = a.job_id
        LEFT JOIN company_reviews cr ON c.comp_id = cr.comp_id
        WHERE c.comp_id = company_id
        GROUP BY c.comp_id, c.name, c.industry, c.city, c.state, c.is_active;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 2. PROCEDURES WITH PARAMETERS AND VALIDATION
-- ==============================================

-- Procedure to add new student
DELIMITER //
CREATE PROCEDURE AddNewStudent(
    IN p_first_name VARCHAR(50),
    IN p_middle_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_city VARCHAR(100),
    IN p_state VARCHAR(100),
    IN p_pin VARCHAR(20),
    IN p_age INT,
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20)
)
BEGIN
    DECLARE email_count INT DEFAULT 0;
    DECLARE new_student_id INT;
    
    -- Validate email uniqueness
    SELECT COUNT(*) INTO email_count
    FROM students 
    WHERE email = p_email;
    
    IF email_count > 0 THEN
        SELECT 'Error: Email already exists' as message;
    ELSEIF p_age < 16 OR p_age > 100 THEN
        SELECT 'Error: Age must be between 16 and 100' as message;
    ELSEIF p_first_name IS NULL OR p_first_name = '' THEN
        SELECT 'Error: First name is required' as message;
    ELSEIF p_last_name IS NULL OR p_last_name = '' THEN
        SELECT 'Error: Last name is required' as message;
    ELSE
        INSERT INTO students (first_name, middle_name, last_name, city, state, pin, age, email, phone)
        VALUES (p_first_name, p_middle_name, p_last_name, p_city, p_state, p_pin, p_age, p_email, p_phone);
        
        SET new_student_id = LAST_INSERT_ID();
        SELECT CONCAT('Student added successfully with ID: ', new_student_id) as message;
    END IF;
END//
DELIMITER ;

-- Procedure to update application status
DELIMITER //
CREATE PROCEDURE UpdateApplicationStatus(
    IN p_app_id INT,
    IN p_new_status ENUM('Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'),
    IN p_admin_id INT,
    IN p_reason TEXT
)
BEGIN
    DECLARE app_count INT DEFAULT 0;
    DECLARE old_status VARCHAR(20);
    
    -- Check if application exists
    SELECT COUNT(*) INTO app_count
    FROM application 
    WHERE app_id = p_app_id;
    
    IF app_count = 0 THEN
        SELECT 'Error: Application not found' as message;
    ELSE
        -- Get current status
        SELECT status INTO old_status
        FROM application 
        WHERE app_id = p_app_id;
        
        -- Update application status
        UPDATE application 
        SET status = p_new_status, updated_at = CURRENT_TIMESTAMP
        WHERE app_id = p_app_id;
        
        -- Insert status history
        INSERT INTO application_status_history (app_id, old_status, new_status, changed_by, change_reason)
        VALUES (p_app_id, old_status, p_new_status, p_admin_id, p_reason);
        
        SELECT CONCAT('Application status updated from ', old_status, ' to ', p_new_status) as message;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 3. PROCEDURES WITH CURSORS
-- ==============================================

-- Procedure to get all students with their skills
DELIMITER //
CREATE PROCEDURE GetStudentsWithSkills()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_stud_id INT;
    DECLARE v_student_name VARCHAR(200);
    DECLARE v_skill_name VARCHAR(100);
    DECLARE v_proficiency_level VARCHAR(20);
    
    DECLARE student_cursor CURSOR FOR
        SELECT 
            s.stud_id,
            CONCAT(s.first_name, ' ', s.last_name) as student_name,
            sk.skill_name,
            ss.proficiency_level
        FROM students s
        JOIN student_skills ss ON s.stud_id = ss.stud_id
        JOIN skills sk ON ss.skill_id = sk.skill_id
        ORDER BY s.stud_id, sk.skill_name;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Create temporary table for results
    DROP TEMPORARY TABLE IF EXISTS temp_student_skills;
    CREATE TEMPORARY TABLE temp_student_skills (
        stud_id INT,
        student_name VARCHAR(200),
        skill_name VARCHAR(100),
        proficiency_level VARCHAR(20)
    );
    
    OPEN student_cursor;
    
    read_loop: LOOP
        FETCH student_cursor INTO v_stud_id, v_student_name, v_skill_name, v_proficiency_level;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO temp_student_skills VALUES (v_stud_id, v_student_name, v_skill_name, v_proficiency_level);
    END LOOP;
    
    CLOSE student_cursor;
    
    -- Return results
    SELECT * FROM temp_student_skills;
    
    -- Clean up
    DROP TEMPORARY TABLE temp_student_skills;
END//
DELIMITER ;

-- ==============================================
-- 4. PROCEDURES WITH CONDITIONAL LOGIC
-- ==============================================

-- Procedure to find best matching students for a job
DELIMITER //
CREATE PROCEDURE FindBestMatchingStudents(IN p_job_id INT)
BEGIN
    DECLARE job_count INT DEFAULT 0;
    
    -- Check if job exists
    SELECT COUNT(*) INTO job_count
    FROM jobs 
    WHERE job_id = p_job_id;
    
    IF job_count = 0 THEN
        SELECT 'Error: Job not found' as message;
    ELSE
        SELECT 
            s.stud_id,
            CONCAT(s.first_name, ' ', s.last_name) as student_name,
            s.email,
            s.city,
            s.state,
            j.title as job_title,
            c.name as company_name,
            GROUP_CONCAT(sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as matching_skills,
            COUNT(js.skill_id) as matching_skills_count,
            COUNT(DISTINCT js.skill_id) as total_required_skills,
            ROUND((COUNT(js.skill_id) / COUNT(DISTINCT js.skill_id)) * 100, 2) as skill_match_percentage,
            CASE 
                WHEN (COUNT(js.skill_id) / COUNT(DISTINCT js.skill_id)) >= 0.8 THEN 'Excellent Match'
                WHEN (COUNT(js.skill_id) / COUNT(DISTINCT js.skill_id)) >= 0.6 THEN 'Good Match'
                WHEN (COUNT(js.skill_id) / COUNT(DISTINCT js.skill_id)) >= 0.4 THEN 'Fair Match'
                ELSE 'Poor Match'
            END as match_quality
        FROM students s
        JOIN student_skills ss ON s.stud_id = ss.stud_id
        JOIN skills sk ON ss.skill_id = sk.skill_id
        JOIN job_skills js ON sk.skill_id = js.skill_id
        JOIN jobs j ON js.job_id = j.job_id
        JOIN company c ON j.comp_id = c.comp_id
        WHERE j.job_id = p_job_id 
            AND s.status = 'Available'
        GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.city, s.state, j.title, c.name
        HAVING skill_match_percentage >= 40
        ORDER BY skill_match_percentage DESC, matching_skills_count DESC;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 5. PROCEDURES WITH ERROR HANDLING
-- ==============================================

-- Procedure to schedule interview with error handling
DELIMITER //
CREATE PROCEDURE ScheduleInterview(
    IN p_app_id INT,
    IN p_mode ENUM('Online', 'Offline', 'Phone', 'Video'),
    IN p_interview_date DATETIME,
    IN p_interviewer_name VARCHAR(100),
    IN p_interviewer_email VARCHAR(100)
)
BEGIN
    DECLARE app_count INT DEFAULT 0;
    DECLARE interview_count INT DEFAULT 0;
    DECLARE stud_id_var INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to schedule interview' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if application exists
    SELECT COUNT(*) INTO app_count
    FROM application 
    WHERE app_id = p_app_id;
    
    IF app_count = 0 THEN
        SELECT 'Error: Application not found' as message;
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
            -- Get student ID
            SELECT stud_id INTO stud_id_var
            FROM application 
            WHERE app_id = p_app_id;
            
            -- Insert interview
            INSERT INTO interview (app_id, stud_id, mode, interview_date, interviewer_name, interviewer_email)
            VALUES (p_app_id, stud_id_var, p_mode, p_interview_date, p_interviewer_name, p_interviewer_email);
            
            -- Update application status to shortlisted
            UPDATE application 
            SET status = 'Shortlisted', updated_at = CURRENT_TIMESTAMP
            WHERE app_id = p_app_id;
            
            COMMIT;
            SELECT 'Interview scheduled successfully' as message;
        END IF;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 6. PROCEDURES WITH LOOPS AND ITERATION
-- ==============================================

-- Procedure to generate monthly report
DELIMITER //
CREATE PROCEDURE GenerateMonthlyReport(IN p_year INT, IN p_month INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_company_name VARCHAR(200);
    DECLARE v_job_count INT;
    DECLARE v_application_count INT;
    DECLARE v_selected_count INT;
    
    DECLARE company_cursor CURSOR FOR
        SELECT 
            c.name as company_name,
            COUNT(DISTINCT j.job_id) as job_count,
            COUNT(DISTINCT a.app_id) as application_count,
            COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN a.app_id END) as selected_count
        FROM company c
        LEFT JOIN jobs j ON c.comp_id = j.comp_id AND YEAR(j.posted_date) = p_year AND MONTH(j.posted_date) = p_month
        LEFT JOIN application a ON j.job_id = a.job_id
        GROUP BY c.comp_id, c.name
        ORDER BY c.name;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Create temporary table for report
    DROP TEMPORARY TABLE IF EXISTS temp_monthly_report;
    CREATE TEMPORARY TABLE temp_monthly_report (
        company_name VARCHAR(200),
        job_count INT,
        application_count INT,
        selected_count INT,
        selection_rate DECIMAL(5,2)
    );
    
    OPEN company_cursor;
    
    read_loop: LOOP
        FETCH company_cursor INTO v_company_name, v_job_count, v_application_count, v_selected_count;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO temp_monthly_report VALUES (
            v_company_name, 
            v_job_count, 
            v_application_count, 
            v_selected_count,
            CASE 
                WHEN v_application_count > 0 THEN ROUND((v_selected_count / v_application_count) * 100, 2)
                ELSE 0
            END
        );
    END LOOP;
    
    CLOSE company_cursor;
    
    -- Return report
    SELECT 
        company_name,
        job_count,
        application_count,
        selected_count,
        selection_rate,
        CASE 
            WHEN selection_rate >= 50 THEN 'High Performance'
            WHEN selection_rate >= 25 THEN 'Medium Performance'
            ELSE 'Low Performance'
        END as performance_category
    FROM temp_monthly_report
    ORDER BY selection_rate DESC;
    
    -- Clean up
    DROP TEMPORARY TABLE temp_monthly_report;
END//
DELIMITER ;

-- ==============================================
-- 7. PROCEDURES WITH DYNAMIC SQL
-- ==============================================

-- Procedure to search students with dynamic criteria
DELIMITER //
CREATE PROCEDURE SearchStudents(
    IN p_name VARCHAR(100),
    IN p_city VARCHAR(100),
    IN p_state VARCHAR(100),
    IN p_skill VARCHAR(100),
    IN p_status VARCHAR(20)
)
BEGIN
    DECLARE sql_query TEXT DEFAULT '';
    DECLARE where_clause TEXT DEFAULT '';
    
    -- Build dynamic WHERE clause
    IF p_name IS NOT NULL AND p_name != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND (s.first_name LIKE ''%', p_name, '%'' OR s.last_name LIKE ''%', p_name, '%'')');
    END IF;
    
    IF p_city IS NOT NULL AND p_city != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND s.city = ''', p_city, '''');
    END IF;
    
    IF p_state IS NOT NULL AND p_state != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND s.state = ''', p_state, '''');
    END IF;
    
    IF p_status IS NOT NULL AND p_status != '' THEN
        SET where_clause = CONCAT(where_clause, ' AND s.status = ''', p_status, '''');
    END IF;
    
    -- Build main query
    SET sql_query = CONCAT('
        SELECT DISTINCT
            s.stud_id,
            CONCAT(s.first_name, '' '', s.last_name) as student_name,
            s.email,
            s.phone,
            s.city,
            s.state,
            s.status,
            s.age,
            COUNT(DISTINCT a.app_id) as total_applications,
            COUNT(DISTINCT ss.skill_id) as total_skills,
            GROUP_CONCAT(DISTINCT sk.skill_name ORDER BY sk.skill_name SEPARATOR '', '') as skills_list
        FROM students s
        LEFT JOIN application a ON s.stud_id = a.stud_id
        LEFT JOIN student_skills ss ON s.stud_id = ss.stud_id
        LEFT JOIN skills sk ON ss.skill_id = sk.skill_id
        WHERE 1=1', where_clause);
    
    -- Add skill filter if specified
    IF p_skill IS NOT NULL AND p_skill != '' THEN
        SET sql_query = CONCAT(sql_query, '
            AND s.stud_id IN (
                SELECT DISTINCT s2.stud_id
                FROM students s2
                JOIN student_skills ss2 ON s2.stud_id = ss2.stud_id
                JOIN skills sk2 ON ss2.skill_id = sk2.skill_id
                WHERE sk2.skill_name LIKE ''%', p_skill, '%''
            )');
    END IF;
    
    SET sql_query = CONCAT(sql_query, '
        GROUP BY s.stud_id, s.first_name, s.last_name, s.email, s.phone, s.city, s.state, s.status, s.age
        ORDER BY s.last_name, s.first_name');
    
    -- Execute dynamic query
    SET @sql = sql_query;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//
DELIMITER ;

-- ==============================================
-- 8. PROCEDURES WITH TRANSACTIONS
-- ==============================================

-- Procedure to process application selection
DELIMITER //
CREATE PROCEDURE ProcessApplicationSelection(
    IN p_app_id INT,
    IN p_admin_id INT,
    IN p_interview_score INT,
    IN p_feedback TEXT
)
BEGIN
    DECLARE app_count INT DEFAULT 0;
    DECLARE stud_id_var INT;
    DECLARE job_id_var INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to process application selection' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if application exists
    SELECT COUNT(*) INTO app_count
    FROM application 
    WHERE app_id = p_app_id;
    
    IF app_count = 0 THEN
        SELECT 'Error: Application not found' as message;
        ROLLBACK;
    ELSE
        -- Get student and job IDs
        SELECT stud_id, job_id INTO stud_id_var, job_id_var
        FROM application 
        WHERE app_id = p_app_id;
        
        -- Update application status
        UPDATE application 
        SET status = 'Selected', updated_at = CURRENT_TIMESTAMP
        WHERE app_id = p_app_id;
        
        -- Update interview score and feedback
        UPDATE interview 
        SET interview_score = p_interview_score, 
            feedback = p_feedback, 
            status = 'Completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE app_id = p_app_id;
        
        -- Update student status
        UPDATE students 
        SET status = 'Selected', updated_at = CURRENT_TIMESTAMP
        WHERE stud_id = stud_id_var;
        
        -- Insert status history
        INSERT INTO application_status_history (app_id, old_status, new_status, changed_by, change_reason)
        VALUES (p_app_id, 'Shortlisted', 'Selected', p_admin_id, 'Application selected after interview');
        
        -- Send notification
        INSERT INTO notifications (stud_id, admin_id, msg, type)
        VALUES (stud_id_var, p_admin_id, 'Congratulations! You have been selected for the position.', 'success');
        
        COMMIT;
        SELECT 'Application processed successfully' as message;
    END IF;
END//
DELIMITER ;

-- ==============================================
-- 9. UTILITY PROCEDURES
-- ==============================================

-- Procedure to clean up old data
DELIMITER //
CREATE PROCEDURE CleanupOldData(IN p_days_to_keep INT)
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    
    -- Clean up old notifications
    DELETE FROM notifications 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY);
    
    SET deleted_count = ROW_COUNT();
    SELECT CONCAT('Deleted ', deleted_count, ' old notifications') as cleanup_message;
    
    -- Clean up old application status history
    DELETE FROM application_status_history 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY);
    
    SET deleted_count = ROW_COUNT();
    SELECT CONCAT('Deleted ', deleted_count, ' old status history records') as cleanup_message;
END//
DELIMITER ;

-- Procedure to get system statistics
DELIMITER //
CREATE PROCEDURE GetSystemStatistics()
BEGIN
    SELECT 
        'System Statistics' as report_type,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM company) as total_companies,
        (SELECT COUNT(*) FROM jobs) as total_jobs,
        (SELECT COUNT(*) FROM application) as total_applications,
        (SELECT COUNT(*) FROM interview) as total_interviews,
        (SELECT COUNT(*) FROM skills) as total_skills,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM notifications) as total_notifications,
        (SELECT COUNT(*) FROM company_reviews) as total_reviews;
END//
DELIMITER ;

-- ==============================================
-- 10. PROCEDURE TESTING AND EXAMPLES
-- ==============================================

-- Test procedures
-- CALL GetStudentStatistics(1);
-- CALL GetCompanyStatistics(1);
-- CALL AddNewStudent('John', 'Michael', 'Doe', 'New York', 'NY', '10001', 23, 'john.doe@email.com', '+1-555-1234');
-- CALL UpdateApplicationStatus(1, 'Selected', 1, 'Excellent candidate');
-- CALL GetStudentsWithSkills();
-- CALL FindBestMatchingStudents(1);
-- CALL ScheduleInterview(1, 'Online', '2024-03-01 10:00:00', 'Jane Smith', 'jane@company.com');
-- CALL GenerateMonthlyReport(2024, 2);
-- CALL SearchStudents('John', 'New York', 'NY', 'JavaScript', 'Available');
-- CALL ProcessApplicationSelection(1, 1, 85, 'Excellent performance in interview');
-- CALL CleanupOldData(30);
-- CALL GetSystemStatistics();