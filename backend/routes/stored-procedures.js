const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Call stored procedure: GetStudentStatistics
router.get('/student-statistics/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await executeQuery('CALL GetStudentStatistics(?)', [studentId]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to get student statistics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting student statistics',
            error: error.message
        });
    }
});

// Call stored procedure: GetCompanyStatistics
router.get('/company-statistics/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await executeQuery('CALL GetCompanyStatistics(?)', [companyId]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to get company statistics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get company statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting company statistics',
            error: error.message
        });
    }
});

// Call stored procedure: AddNewStudent
router.post('/add-student', [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('age').isInt({ min: 16, max: 100 }).withMessage('Age must be between 16 and 100')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { 
            first_name, 
            middle_name, 
            last_name, 
            city, 
            state, 
            pin, 
            age, 
            email, 
            phone 
        } = req.body;

        const result = await executeQuery(
            'CALL AddNewStudent(?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [first_name, middle_name, last_name, city, state, pin, age, email, phone]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to add student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding student',
            error: error.message
        });
    }
});

// Call stored procedure: UpdateApplicationStatus
router.put('/update-application-status', [
    body('app_id').isInt().withMessage('Application ID is required'),
    body('new_status').isIn(['Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected']).withMessage('Invalid status'),
    body('admin_id').isInt().withMessage('Admin ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { app_id, new_status, admin_id, reason } = req.body;

        const result = await executeQuery(
            'CALL UpdateApplicationStatus(?, ?, ?, ?)',
            [app_id, new_status, admin_id, reason]
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update application status',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating application status',
            error: error.message
        });
    }
});

// Call stored procedure: GetStudentsWithSkills
router.get('/students-with-skills', async (req, res) => {
    try {
        const result = await executeQuery('CALL GetStudentsWithSkills()');

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to get students with skills',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get students with skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting students with skills',
            error: error.message
        });
    }
});

// Call stored procedure: FindBestMatchingStudents
router.get('/best-matching-students/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await executeQuery('CALL FindBestMatchingStudents(?)', [jobId]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to find best matching students',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Find best matching students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error finding best matching students',
            error: error.message
        });
    }
});

// Call stored procedure: ScheduleInterview
router.post('/schedule-interview', [
    body('app_id').isInt().withMessage('Application ID is required'),
    body('mode').isIn(['Online', 'Offline', 'Phone', 'Video']).withMessage('Invalid interview mode'),
    body('interview_date').isISO8601().withMessage('Valid interview date is required'),
    body('interviewer_name').notEmpty().withMessage('Interviewer name is required'),
    body('interviewer_email').isEmail().withMessage('Valid interviewer email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { 
            app_id, 
            mode, 
            interview_date, 
            interviewer_name, 
            interviewer_email, 
            hr_id 
        } = req.body;

        const result = await executeQuery(
            'CALL ScheduleInterview(?, ?, ?, ?, ?, ?)',
            [app_id, mode, interview_date, interviewer_name, interviewer_email, hr_id]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to schedule interview',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Schedule interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error scheduling interview',
            error: error.message
        });
    }
});

// Call stored procedure: GenerateMonthlyReport
router.get('/monthly-report', async (req, res) => {
    try {
        const { year, month } = req.query;
        
        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: 'Year and month are required'
            });
        }

        const result = await executeQuery('CALL GenerateMonthlyReport(?, ?)', [year, month]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to generate monthly report',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Generate monthly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating monthly report',
            error: error.message
        });
    }
});

// Call stored procedure: SearchStudents
router.get('/search-students', async (req, res) => {
    try {
        const { 
            name, 
            city, 
            state, 
            skill, 
            status, 
            min_age, 
            max_age, 
            has_applications, 
            limit_results 
        } = req.query;

        const result = await executeQuery(
            'CALL SearchStudents(?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, city, state, skill, status, min_age, max_age, has_applications, limit_results]
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to search students',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Search students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error searching students',
            error: error.message
        });
    }
});

// Call stored procedure: ProcessApplicationSelection
router.post('/process-application-selection', [
    body('app_id').isInt().withMessage('Application ID is required'),
    body('admin_id').isInt().withMessage('Admin ID is required'),
    body('interview_score').isInt({ min: 0, max: 100 }).withMessage('Interview score must be between 0 and 100')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { app_id, admin_id, interview_score, feedback, selection_reason } = req.body;

        const result = await executeQuery(
            'CALL ProcessApplicationSelection(?, ?, ?, ?, ?)',
            [app_id, admin_id, interview_score, feedback, selection_reason]
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to process application selection',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Process application selection error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing application selection',
            error: error.message
        });
    }
});

// Call stored procedure: GetSystemStatistics
router.get('/system-statistics', async (req, res) => {
    try {
        const result = await executeQuery('CALL GetSystemStatistics()');

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to get system statistics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get system statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting system statistics',
            error: error.message
        });
    }
});

// Call stored procedure: GenerateSkillGapAnalysis
router.get('/skill-gap-analysis', async (req, res) => {
    try {
        const result = await executeQuery('CALL GenerateSkillGapAnalysis()');

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to generate skill gap analysis',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Generate skill gap analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating skill gap analysis',
            error: error.message
        });
    }
});

// Call stored procedure: SendBulkNotifications
router.post('/send-bulk-notifications', [
    body('recipient_type').isIn(['all_students', 'available_students', 'selected_students', 'specific_students']).withMessage('Invalid recipient type'),
    body('message').notEmpty().withMessage('Message is required'),
    body('notification_type').isIn(['info', 'warning', 'success', 'error', 'reminder']).withMessage('Invalid notification type'),
    body('admin_id').isInt().withMessage('Admin ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { recipient_type, student_ids, message, notification_type, admin_id } = req.body;

        const result = await executeQuery(
            'CALL SendBulkNotifications(?, ?, ?, ?, ?)',
            [recipient_type, student_ids, message, notification_type, admin_id]
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send bulk notifications',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Send bulk notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error sending bulk notifications',
            error: error.message
        });
    }
});

// Call stored procedure: CleanupOldData
router.post('/cleanup-old-data', [
    body('days_to_keep').isInt({ min: 1 }).withMessage('Days to keep must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { days_to_keep } = req.body;

        const result = await executeQuery('CALL CleanupOldData(?)', [days_to_keep]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to cleanup old data',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Cleanup old data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cleaning up old data',
            error: error.message
        });
    }
});

module.exports = router;
