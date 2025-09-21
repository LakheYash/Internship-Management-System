const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all applications
router.get('/', async (req, res) => {
    try {
        const { stud_id, job_id, status, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT 
                a.*,
                s.first_name,
                s.last_name,
                s.email as student_email,
                j.title as job_title,
                c.name as company_name
            FROM application a
            LEFT JOIN students s ON a.stud_id = s.stud_id
            LEFT JOIN jobs j ON a.job_id = j.job_id
            LEFT JOIN company c ON j.comp_id = c.comp_id
            WHERE 1=1
        `;
        const params = [];

        // Add student filter
        if (stud_id) {
            sql += ' AND a.stud_id = ?';
            params.push(stud_id);
        }

        // Add job filter
        if (job_id) {
            sql += ' AND a.job_id = ?';
            params.push(job_id);
        }

        // Add status filter
        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM application a WHERE 1=1';
            const countParams = [];
            
            if (stud_id) {
                countSql += ' AND a.stud_id = ?';
                countParams.push(stud_id);
            }
            
            if (job_id) {
                countSql += ' AND a.job_id = ?';
                countParams.push(job_id);
            }
            
            if (status) {
                countSql += ' AND a.status = ?';
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
                message: 'Failed to fetch applications',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching applications',
            error: error.message
        });
    }
});

// Get application by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT 
                a.*,
                s.first_name,
                s.last_name,
                s.email as student_email,
                s.phone as student_phone,
                j.title as job_title,
                j.description as job_description,
                j.salary,
                c.name as company_name,
                c.industry
            FROM application a
            LEFT JOIN students s ON a.stud_id = s.stud_id
            LEFT JOIN jobs j ON a.job_id = j.job_id
            LEFT JOIN company c ON j.comp_id = c.comp_id
            WHERE a.app_id = ?
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
                    message: 'Application not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching application',
            error: error.message
        });
    }
});

// Create new application
router.post('/', [
    body('stud_id').isInt().withMessage('Student ID must be a valid integer'),
    body('job_id').isInt().withMessage('Job ID must be a valid integer'),
    body('application_date').isISO8601().withMessage('Application date must be a valid date')
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
            stud_id, 
            job_id, 
            application_date, 
            cover_letter, 
            resume_url, 
            additional_documents 
        } = req.body;

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if job exists and is active
        const jobCheck = await executeQuery('SELECT job_id, status FROM jobs WHERE job_id = ?', [job_id]);
        if (!jobCheck.success || jobCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (jobCheck.data[0].status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'Job is not currently accepting applications'
            });
        }

        // Check if application already exists
        const existingApplication = await executeQuery(
            'SELECT app_id FROM application WHERE stud_id = ? AND job_id = ?',
            [stud_id, job_id]
        );

        if (existingApplication.success && existingApplication.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Application already exists for this job'
            });
        }

        const result = await executeQuery(
            'INSERT INTO application (stud_id, job_id, application_date, cover_letter, resume_url, additional_documents) VALUES (?, ?, ?, ?, ?, ?)',
            [stud_id, job_id, application_date, cover_letter, resume_url, additional_documents]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Application created successfully',
                data: { app_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create application',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating application',
            error: error.message
        });
    }
});

// Update application
router.put('/:id', [
    body('status').optional().isIn(['Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Selected']).withMessage('Invalid status'),
    body('application_date').optional().isISO8601().withMessage('Application date must be a valid date')
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
            status, 
            application_date, 
            cover_letter, 
            resume_url, 
            additional_documents 
        } = req.body;

        // Check if application exists
        const existingApplication = await executeQuery('SELECT app_id FROM application WHERE app_id = ?', [id]);
        if (!existingApplication.success || existingApplication.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (application_date !== undefined) {
            updateFields.push('application_date = ?');
            updateValues.push(application_date);
        }
        if (cover_letter !== undefined) {
            updateFields.push('cover_letter = ?');
            updateValues.push(cover_letter);
        }
        if (resume_url !== undefined) {
            updateFields.push('resume_url = ?');
            updateValues.push(resume_url);
        }
        if (additional_documents !== undefined) {
            updateFields.push('additional_documents = ?');
            updateValues.push(additional_documents);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE application SET ${updateFields.join(', ')} WHERE app_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Application updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update application',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating application',
            error: error.message
        });
    }
});

// Delete application
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if application exists
        const existingApplication = await executeQuery('SELECT app_id FROM application WHERE app_id = ?', [id]);
        if (!existingApplication.success || existingApplication.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const result = await executeQuery('DELETE FROM application WHERE app_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Application deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete application',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting application',
            error: error.message
        });
    }
});

// Get applications by student
router.get('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                a.*,
                j.title as job_title,
                c.name as company_name
            FROM application a
            LEFT JOIN jobs j ON a.job_id = j.job_id
            LEFT JOIN company c ON j.comp_id = c.comp_id
            WHERE a.stud_id = ?
        `;
        const params = [studId];

        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch student applications',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student applications',
            error: error.message
        });
    }
});

// Get applications by job
router.get('/job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                a.*,
                s.first_name,
                s.last_name,
                s.email as student_email
            FROM application a
            LEFT JOIN students s ON a.stud_id = s.stud_id
            WHERE a.job_id = ?
        `;
        const params = [jobId];

        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch job applications',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get job applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching job applications',
            error: error.message
        });
    }
});

// Get application statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                status,
                COUNT(*) as count
            FROM application 
            GROUP BY status
        `);

        if (statsResult.success) {
            const stats = {
                total: 0,
                pending: 0,
                underReview: 0,
                shortlisted: 0,
                rejected: 0,
                selected: 0
            };

            statsResult.data.forEach(row => {
                stats.total += row.count;
                const statusKey = row.status.toLowerCase().replace(' ', '');
                if (statusKey === 'underreview') {
                    stats.underReview = row.count;
                } else {
                    stats[statusKey] = row.count;
                }
            });

            res.json({
                success: true,
                data: stats
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get application stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching application statistics',
            error: error.message
        });
    }
});

module.exports = router;
