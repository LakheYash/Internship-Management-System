const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all interviews
router.get('/', async (req, res) => {
    try {
        const { app_id, stud_id, status, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT 
                i.*,
                s.first_name,
                s.last_name,
                s.email as student_email,
                a.status as application_status,
                j.title as job_title,
                c.name as company_name
            FROM interview i
            LEFT JOIN students s ON i.stud_id = s.stud_id
            LEFT JOIN application a ON i.app_id = a.app_id
            LEFT JOIN jobs j ON a.job_id = j.job_id
            LEFT JOIN company c ON j.comp_id = c.comp_id
            WHERE 1=1
        `;
        const params = [];

        // Add application filter
        if (app_id) {
            sql += ' AND i.app_id = ?';
            params.push(app_id);
        }

        // Add student filter
        if (stud_id) {
            sql += ' AND i.stud_id = ?';
            params.push(stud_id);
        }

        // Add status filter
        if (status) {
            sql += ' AND i.status = ?';
            params.push(status);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY i.interview_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM interview i WHERE 1=1';
            const countParams = [];
            
            if (app_id) {
                countSql += ' AND i.app_id = ?';
                countParams.push(app_id);
            }
            
            if (stud_id) {
                countSql += ' AND i.stud_id = ?';
                countParams.push(stud_id);
            }
            
            if (status) {
                countSql += ' AND i.status = ?';
                countParams.push(status);
            }

            const countResult = await executeQuery(countSql, countParams);
            const total = countResult.success ? countResult.data[0].total : 0;

            res.json({
                success: true,
                data: result.data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch interviews',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching interviews',
            error: error.message
        });
    }
});

// Get interview by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT 
                i.*,
                s.first_name,
                s.last_name,
                s.email as student_email,
                s.phone as student_phone,
                a.status as application_status,
                j.title as job_title,
                c.name as company_name,
                c.hr_name,
                c.hr_email
            FROM interview i
            LEFT JOIN students s ON i.stud_id = s.stud_id
            LEFT JOIN application a ON i.app_id = a.app_id
            LEFT JOIN jobs j ON a.job_id = j.job_id
            LEFT JOIN company c ON j.comp_id = c.comp_id
            WHERE i.interview_id = ?
        `, [id]);

        if (result.success) {
            if (result.data.length > 0) {
                res.json({
                    success: true,
                    data: result.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Interview not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch interview',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching interview',
            error: error.message
        });
    }
});

// Create new interview
router.post('/', [
    body('app_id').isInt().withMessage('Application ID must be a valid integer'),
    body('stud_id').isInt().withMessage('Student ID must be a valid integer'),
    body('mode').isIn(['Online', 'Offline', 'Phone', 'Video']).withMessage('Invalid interview mode'),
    body('interview_date').isISO8601().withMessage('Interview date must be a valid date'),
    body('interview_score').optional().isInt({ min: 0, max: 100 }).withMessage('Interview score must be between 0 and 100')
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
            stud_id, 
            mode, 
            interview_date, 
            interview_score, 
            feedback, 
            status = 'Scheduled',
            interviewer_name, 
            interviewer_email 
        } = req.body;

        // Check if application exists
        const applicationCheck = await executeQuery('SELECT app_id FROM application WHERE app_id = ?', [app_id]);
        if (!applicationCheck.success || applicationCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student not found'
            });
        }

        const result = await executeQuery(
            'INSERT INTO interview (app_id, stud_id, mode, interview_date, interview_score, feedback, status, interviewer_name, interviewer_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [app_id, stud_id, mode, interview_date, interview_score, feedback, status, interviewer_name, interviewer_email]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Interview created successfully',
                data: { interview_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create interview',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating interview',
            error: error.message
        });
    }
});

// Update interview
router.put('/:id', [
    body('mode').optional().isIn(['Online', 'Offline', 'Phone', 'Video']).withMessage('Invalid interview mode'),
    body('interview_date').optional().isISO8601().withMessage('Interview date must be a valid date'),
    body('interview_score').optional().isInt({ min: 0, max: 100 }).withMessage('Interview score must be between 0 and 100'),
    body('status').optional().isIn(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']).withMessage('Invalid status')
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

        const { id } = req.params;
        const { 
            mode, 
            interview_date, 
            interview_score, 
            feedback, 
            status,
            interviewer_name, 
            interviewer_email 
        } = req.body;

        // Check if interview exists
        const existingInterview = await executeQuery('SELECT interview_id FROM interview WHERE interview_id = ?', [id]);
        if (!existingInterview.success || existingInterview.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (mode !== undefined) {
            updateFields.push('mode = ?');
            updateValues.push(mode);
        }
        if (interview_date !== undefined) {
            updateFields.push('interview_date = ?');
            updateValues.push(interview_date);
        }
        if (interview_score !== undefined) {
            updateFields.push('interview_score = ?');
            updateValues.push(interview_score);
        }
        if (feedback !== undefined) {
            updateFields.push('feedback = ?');
            updateValues.push(feedback);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (interviewer_name !== undefined) {
            updateFields.push('interviewer_name = ?');
            updateValues.push(interviewer_name);
        }
        if (interviewer_email !== undefined) {
            updateFields.push('interviewer_email = ?');
            updateValues.push(interviewer_email);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE interview SET ${updateFields.join(', ')} WHERE interview_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Interview updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update interview',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating interview',
            error: error.message
        });
    }
});

// Delete interview
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if interview exists
        const existingInterview = await executeQuery('SELECT interview_id FROM interview WHERE interview_id = ?', [id]);
        if (!existingInterview.success || existingInterview.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        const result = await executeQuery('DELETE FROM interview WHERE interview_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Interview deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete interview',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting interview',
            error: error.message
        });
    }
});

// Get interviews by student
router.get('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                i.*,
                a.status as application_status,
                j.title as job_title,
                c.name as company_name
            FROM interview i
            LEFT JOIN application a ON i.app_id = a.app_id
            LEFT JOIN jobs j ON a.job_id = j.job_id
            LEFT JOIN company c ON j.comp_id = c.comp_id
            WHERE i.stud_id = ?
        `;
        const params = [studId];

        if (status) {
            sql += ' AND i.status = ?';
            params.push(status);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY i.interview_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch student interviews',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student interviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student interviews',
            error: error.message
        });
    }
});

// Get interviews by application
router.get('/application/:appId', async (req, res) => {
    try {
        const { appId } = req.params;
        const result = await executeQuery(
            'SELECT * FROM interview WHERE app_id = ? ORDER BY interview_date DESC',
            [appId]
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application interviews',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get application interviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching application interviews',
            error: error.message
        });
    }
});

// Get interview statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                status,
                mode,
                COUNT(*) as count
            FROM interview 
            GROUP BY status, mode
        `);

        if (statsResult.success) {
            const stats = {
                total: 0,
                byStatus: {},
                byMode: {}
            };

            statsResult.data.forEach(row => {
                stats.total += row.count;
                
                // Group by status
                if (!stats.byStatus[row.status]) {
                    stats.byStatus[row.status] = 0;
                }
                stats.byStatus[row.status] += row.count;

                // Group by mode
                if (!stats.byMode[row.mode]) {
                    stats.byMode[row.mode] = 0;
                }
                stats.byMode[row.mode] += row.count;
            });

            res.json({
                success: true,
                data: stats
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch interview statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get interview stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching interview statistics',
            error: error.message
        });
    }
});

module.exports = router;
