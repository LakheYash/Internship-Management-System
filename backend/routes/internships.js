const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all internships
router.get('/', async (req, res) => {
    try {
        const { status, company_id, intern_id, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT 
                j.*,
                c.name as company_name,
                c.industry as company_industry,
                CONCAT(s.first_name, ' ', s.last_name) as intern_name,
                s.email as intern_email
            FROM jobs j
            LEFT JOIN company c ON j.comp_id = c.comp_id
            LEFT JOIN students s ON j.stud_id = s.stud_id
            WHERE 1=1
        `;
        const params = [];

        // Add status filter
        if (status) {
            sql += ' AND j.status = ?';
            params.push(status);
        }

        // Add company filter
        if (company_id) {
            sql += ' AND j.comp_id = ?';
            params.push(company_id);
        }

        // Add intern filter
        if (intern_id) {
            sql += ' AND j.stud_id = ?';
            params.push(intern_id);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM internships i WHERE 1=1';
            const countParams = [];
            
            if (status) {
                countSql += ' AND i.status = ?';
                countParams.push(status);
            }
            
            if (company_id) {
                countSql += ' AND i.company_id = ?';
                countParams.push(company_id);
            }
            
            if (intern_id) {
                countSql += ' AND i.intern_id = ?';
                countParams.push(intern_id);
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
                message: 'Failed to fetch internships',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get internships error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching internships',
            error: error.message
        });
    }
});

// Get internship by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT 
                i.*,
                c.name as company_name,
                c.industry as company_industry,
                c.contact_person as company_contact,
                c.email as company_email,
                c.phone as company_phone,
                c.location as company_location,
                intern.name as intern_name,
                intern.email as intern_email,
                intern.phone as intern_phone,
                intern.university,
                intern.major
            FROM internships i
            LEFT JOIN companies c ON i.company_id = c.id
            LEFT JOIN interns intern ON i.intern_id = intern.id
            WHERE i.id = ?
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
                    message: 'Internship not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch internship',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching internship',
            error: error.message
        });
    }
});

// Create new internship
router.post('/', [
    body('title').notEmpty().withMessage('Internship title is required'),
    body('company_id').isInt().withMessage('Company ID must be a valid integer'),
    body('intern_id').optional().isInt().withMessage('Intern ID must be a valid integer'),
    body('start_date').isISO8601().withMessage('Start date must be a valid date'),
    body('end_date').isISO8601().withMessage('End date must be a valid date'),
    body('status').optional().isIn(['Active', 'Completed', 'Cancelled', 'On Hold']).withMessage('Invalid status')
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
            company_id, 
            intern_id, 
            start_date, 
            end_date, 
            duration_weeks, 
            stipend, 
            status = 'Active',
            supervisor_name,
            supervisor_email,
            supervisor_phone,
            requirements,
            learning_objectives
        } = req.body;

        // Validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // Check if company exists
        const companyCheck = await executeQuery('SELECT id FROM companies WHERE id = ? AND is_active = TRUE', [company_id]);
        if (!companyCheck.success || companyCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if intern exists (if provided)
        if (intern_id) {
            const internCheck = await executeQuery('SELECT id, status FROM interns WHERE id = ?', [intern_id]);
            if (!internCheck.success || internCheck.data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Intern not found'
                });
            }

            // Check if intern is available
            if (internCheck.data[0].status !== 'Available') {
                return res.status(400).json({
                    success: false,
                    message: 'Intern is not available for assignment'
                });
            }
        }

        // Calculate duration if not provided
        const calculatedDuration = duration_weeks || Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));

        const result = await executeQuery(
            `INSERT INTO internships 
            (title, description, company_id, intern_id, start_date, end_date, duration_weeks, stipend, status, supervisor_name, supervisor_email, supervisor_phone, requirements, learning_objectives) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, company_id, intern_id, start_date, end_date, calculatedDuration, stipend, status, supervisor_name, supervisor_email, supervisor_phone, requirements, learning_objectives]
        );

        if (result.success) {
            // Update intern status if assigned
            if (intern_id) {
                await executeQuery('UPDATE interns SET status = "Assigned" WHERE id = ?', [intern_id]);
            }

            res.status(201).json({
                success: true,
                message: 'Internship created successfully',
                data: { id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create internship',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating internship',
            error: error.message
        });
    }
});

// Update internship
router.put('/:id', [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('company_id').optional().isInt().withMessage('Company ID must be a valid integer'),
    body('intern_id').optional().isInt().withMessage('Intern ID must be a valid integer'),
    body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),
    body('status').optional().isIn(['Active', 'Completed', 'Cancelled', 'On Hold']).withMessage('Invalid status')
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
            company_id, 
            intern_id, 
            start_date, 
            end_date, 
            duration_weeks, 
            stipend, 
            status,
            supervisor_name,
            supervisor_email,
            supervisor_phone,
            requirements,
            learning_objectives
        } = req.body;

        // Check if internship exists
        const existingInternship = await executeQuery('SELECT * FROM internships WHERE id = ?', [id]);
        if (!existingInternship.success || existingInternship.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        const currentInternship = existingInternship.data[0];

        // Validate dates if provided
        if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            
            if (startDate >= endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }
        }

        // Check if company exists (if being changed)
        if (company_id) {
            const companyCheck = await executeQuery('SELECT id FROM companies WHERE id = ? AND is_active = TRUE', [company_id]);
            if (!companyCheck.success || companyCheck.data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Company not found'
                });
            }
        }

        // Check if intern exists and is available (if being changed)
        if (intern_id && intern_id !== currentInternship.intern_id) {
            const internCheck = await executeQuery('SELECT id, status FROM interns WHERE id = ?', [intern_id]);
            if (!internCheck.success || internCheck.data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Intern not found'
                });
            }

            if (internCheck.data[0].status !== 'Available') {
                return res.status(400).json({
                    success: false,
                    message: 'Intern is not available for assignment'
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
        if (company_id !== undefined) {
            updateFields.push('company_id = ?');
            updateValues.push(company_id);
        }
        if (intern_id !== undefined) {
            updateFields.push('intern_id = ?');
            updateValues.push(intern_id);
        }
        if (start_date !== undefined) {
            updateFields.push('start_date = ?');
            updateValues.push(start_date);
        }
        if (end_date !== undefined) {
            updateFields.push('end_date = ?');
            updateValues.push(end_date);
        }
        if (duration_weeks !== undefined) {
            updateFields.push('duration_weeks = ?');
            updateValues.push(duration_weeks);
        }
        if (stipend !== undefined) {
            updateFields.push('stipend = ?');
            updateValues.push(stipend);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (supervisor_name !== undefined) {
            updateFields.push('supervisor_name = ?');
            updateValues.push(supervisor_name);
        }
        if (supervisor_email !== undefined) {
            updateFields.push('supervisor_email = ?');
            updateValues.push(supervisor_email);
        }
        if (supervisor_phone !== undefined) {
            updateFields.push('supervisor_phone = ?');
            updateValues.push(supervisor_phone);
        }
        if (requirements !== undefined) {
            updateFields.push('requirements = ?');
            updateValues.push(requirements);
        }
        if (learning_objectives !== undefined) {
            updateFields.push('learning_objectives = ?');
            updateValues.push(learning_objectives);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE internships SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.success) {
            // Handle intern status changes
            if (intern_id !== currentInternship.intern_id) {
                // Release previous intern
                if (currentInternship.intern_id) {
                    await executeQuery('UPDATE interns SET status = "Available" WHERE id = ?', [currentInternship.intern_id]);
                }
                // Assign new intern
                if (intern_id) {
                    await executeQuery('UPDATE interns SET status = "Assigned" WHERE id = ?', [intern_id]);
                }
            }

            // Update intern status based on internship status
            if (status === 'Completed' && currentInternship.intern_id) {
                await executeQuery('UPDATE interns SET status = "Completed" WHERE id = ?', [currentInternship.intern_id]);
            } else if (status === 'Cancelled' && currentInternship.intern_id) {
                await executeQuery('UPDATE interns SET status = "Available" WHERE id = ?', [currentInternship.intern_id]);
            }

            res.json({
                success: true,
                message: 'Internship updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update internship',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating internship',
            error: error.message
        });
    }
});

// Delete internship
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if internship exists
        const existingInternship = await executeQuery('SELECT intern_id FROM internships WHERE id = ?', [id]);
        if (!existingInternship.success || existingInternship.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        const internship = existingInternship.data[0];

        // Release intern if assigned
        if (internship.intern_id) {
            await executeQuery('UPDATE interns SET status = "Available" WHERE id = ?', [internship.intern_id]);
        }

        const result = await executeQuery('DELETE FROM internships WHERE id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Internship deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete internship',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting internship',
            error: error.message
        });
    }
});

// Get internship statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                status,
                COUNT(*) as count
            FROM internships 
            GROUP BY status
        `);

        if (statsResult.success) {
            const stats = {
                total: 0,
                active: 0,
                completed: 0,
                cancelled: 0,
                onHold: 0
            };

            statsResult.data.forEach(row => {
                stats.total += row.count;
                const statusKey = row.status.toLowerCase().replace(' ', '');
                if (statusKey === 'onhold') {
                    stats.onHold = row.count;
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
                message: 'Failed to fetch internship statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get internship stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching internship statistics',
            error: error.message
        });
    }
});

// Get internships by company
router.get('/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                i.*,
                intern.name as intern_name,
                intern.email as intern_email
            FROM internships i
            LEFT JOIN interns intern ON i.intern_id = intern.id
            WHERE i.company_id = ?
        `;
        const params = [companyId];

        if (status) {
            sql += ' AND i.status = ?';
            params.push(status);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch company internships',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get company internships error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company internships',
            error: error.message
        });
    }
});

module.exports = router;
