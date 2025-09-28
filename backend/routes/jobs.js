const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
    try {
        const { status, comp_id, job_type, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT 
                j.*,
                c.name as company_name,
                c.industry as company_industry,
                a.name as admin_name
            FROM jobs j
            LEFT JOIN company c ON j.comp_id = c.comp_id
            LEFT JOIN admin a ON j.admin_id = a.admin_id
            WHERE 1=1
        `;
        const params = [];

        // Add status filter
        if (status) {
            sql += ' AND j.status = ?';
            params.push(status);
        }

        // Add company filter
        if (comp_id) {
            sql += ' AND j.comp_id = ?';
            params.push(comp_id);
        }

        // Add job type filter
        if (job_type) {
            sql += ' AND j.job_type = ?';
            params.push(job_type);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM jobs j WHERE 1=1';
            const countParams = [];
            
            if (status) {
                countSql += ' AND j.status = ?';
                countParams.push(status);
            }
            
            if (comp_id) {
                countSql += ' AND j.comp_id = ?';
                countParams.push(comp_id);
            }
            
            if (job_type) {
                countSql += ' AND j.job_type = ?';
                countParams.push(job_type);
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
                message: 'Failed to fetch jobs',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching jobs',
            error: error.message
        });
    }
});

// Get job by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT 
                j.*,
                c.name as company_name,
                c.industry as company_industry,
                c.hr_name,
                c.hr_email,
                c.hr_phone,
                c.city as company_city,
                c.state as company_state,
                a.name as admin_name
            FROM jobs j
            LEFT JOIN company c ON j.comp_id = c.comp_id
            LEFT JOIN admin a ON j.admin_id = a.admin_id
            WHERE j.job_id = ?
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
                    message: 'Job not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch job',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching job',
            error: error.message
        });
    }
});

// Create new job
router.post('/', [
    body('title').notEmpty().withMessage('Job title is required'),
    body('comp_id').isInt().withMessage('Company ID must be a valid integer'),
    body('admin_id').isInt().withMessage('Admin ID must be a valid integer'),
    body('posted_date').isISO8601().withMessage('Posted date must be a valid date'),
    body('job_type').optional().isIn(['Internship', 'Full-time', 'Part-time', 'Contract']).withMessage('Invalid job type')
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
            title, 
            description, 
            comp_id, 
            admin_id, 
            required_skills, 
            salary, 
            job_type = 'Internship',
            city, 
            state, 
            posted_date, 
            deadline, 
            status = 'Active',
            requirements 
        } = req.body;

        // Validate dates
        if (deadline && posted_date) {
            const postedDate = new Date(posted_date);
            const deadlineDate = new Date(deadline);
            
            if (deadlineDate <= postedDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Deadline must be after posted date'
                });
            }
        }

        // Check if company exists
        const companyCheck = await executeQuery('SELECT comp_id FROM company WHERE comp_id = ? AND is_active = TRUE', [comp_id]);
        if (!companyCheck.success || companyCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if admin exists
        const adminCheck = await executeQuery('SELECT admin_id FROM admin WHERE admin_id = ? AND is_active = TRUE', [admin_id]);
        if (!adminCheck.success || adminCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const result = await executeQuery(
            `INSERT INTO jobs 
            (title, description, comp_id, admin_id, salary, job_type, city, state, pin, posted_date, deadline, status, requirements) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, comp_id, admin_id, salary, job_type, city, state, req.body.pin, posted_date, deadline, status, requirements]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Job created successfully',
                data: { job_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create job',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating job',
            error: error.message
        });
    }
});

// Update job
router.put('/:id', [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('comp_id').optional().isInt().withMessage('Company ID must be a valid integer'),
    body('admin_id').optional().isInt().withMessage('Admin ID must be a valid integer'),
    body('posted_date').optional().isISO8601().withMessage('Posted date must be a valid date'),
    body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
    body('job_type').optional().isIn(['Internship', 'Full-time', 'Part-time', 'Contract']).withMessage('Invalid job type'),
    body('status').optional().isIn(['Active', 'Closed', 'Paused']).withMessage('Invalid status')
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
            title, 
            description, 
            comp_id, 
            admin_id, 
            required_skills, 
            salary, 
            job_type,
            city, 
            state, 
            posted_date, 
            deadline, 
            status,
            requirements 
        } = req.body;

        // Check if job exists
        const existingJob = await executeQuery('SELECT * FROM jobs WHERE job_id = ?', [id]);
        if (!existingJob.success || existingJob.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Validate dates if provided
        if (posted_date && deadline) {
            const postedDate = new Date(posted_date);
            const deadlineDate = new Date(deadline);
            
            if (deadlineDate <= postedDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Deadline must be after posted date'
                });
            }
        }

        // Check if company exists (if being changed)
        if (comp_id) {
            const companyCheck = await executeQuery('SELECT comp_id FROM company WHERE comp_id = ? AND is_active = TRUE', [comp_id]);
            if (!companyCheck.success || companyCheck.data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Company not found'
                });
            }
        }

        // Check if admin exists (if being changed)
        if (admin_id) {
            const adminCheck = await executeQuery('SELECT admin_id FROM admin WHERE admin_id = ? AND is_active = TRUE', [admin_id]);
            if (!adminCheck.success || adminCheck.data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (title !== undefined) {
            updateFields.push('title = ?');
            updateValues.push(title);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (comp_id !== undefined) {
            updateFields.push('comp_id = ?');
            updateValues.push(comp_id);
        }
        if (admin_id !== undefined) {
            updateFields.push('admin_id = ?');
            updateValues.push(admin_id);
        }
        if (required_skills !== undefined) {
            updateFields.push('required_skills = ?');
            updateValues.push(required_skills);
        }
        if (salary !== undefined) {
            updateFields.push('salary = ?');
            updateValues.push(salary);
        }
        if (job_type !== undefined) {
            updateFields.push('job_type = ?');
            updateValues.push(job_type);
        }
        if (city !== undefined) {
            updateFields.push('city = ?');
            updateValues.push(city);
        }
        if (state !== undefined) {
            updateFields.push('state = ?');
            updateValues.push(state);
        }
        if (posted_date !== undefined) {
            updateFields.push('posted_date = ?');
            updateValues.push(posted_date);
        }
        if (deadline !== undefined) {
            updateFields.push('deadline = ?');
            updateValues.push(deadline);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (requirements !== undefined) {
            updateFields.push('requirements = ?');
            updateValues.push(requirements);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE jobs SET ${updateFields.join(', ')} WHERE job_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Job updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update job',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating job',
            error: error.message
        });
    }
});

// Delete job
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if job exists
        const existingJob = await executeQuery('SELECT job_id FROM jobs WHERE job_id = ?', [id]);
        if (!existingJob.success || existingJob.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if job has active applications
        const activeApplications = await executeQuery(
            'SELECT app_id FROM application WHERE job_id = ? AND status IN ("Pending", "Under Review", "Shortlisted")',
            [id]
        );

        if (activeApplications.success && activeApplications.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete job with active applications'
            });
        }

        const result = await executeQuery('DELETE FROM jobs WHERE job_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Job deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete job',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting job',
            error: error.message
        });
    }
});

// Get job statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                status,
                job_type,
                COUNT(*) as count
            FROM jobs 
            GROUP BY status, job_type
        `);

        if (statsResult.success) {
            const stats = {
                total: 0,
                byStatus: {},
                byType: {}
            };

            statsResult.data.forEach(row => {
                stats.total += row.count;
                
                // Group by status
                if (!stats.byStatus[row.status]) {
                    stats.byStatus[row.status] = 0;
                }
                stats.byStatus[row.status] += row.count;

                // Group by type
                if (!stats.byType[row.job_type]) {
                    stats.byType[row.job_type] = 0;
                }
                stats.byType[row.job_type] += row.count;
            });

            res.json({
                success: true,
                data: stats
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch job statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get job stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching job statistics',
            error: error.message
        });
    }
});

// Get jobs by company
router.get('/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { status, job_type, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                j.*,
                a.name as admin_name
            FROM jobs j
            LEFT JOIN admin a ON j.admin_id = a.admin_id
            WHERE j.comp_id = ?
        `;
        const params = [companyId];

        if (status) {
            sql += ' AND j.status = ?';
            params.push(status);
        }

        if (job_type) {
            sql += ' AND j.job_type = ?';
            params.push(job_type);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch company jobs',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get company jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company jobs',
            error: error.message
        });
    }
});

module.exports = router;
