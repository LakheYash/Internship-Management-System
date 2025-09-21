const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all interns
router.get('/', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        let sql = 'SELECT * FROM interns WHERE 1=1';
        const params = [];

        // Add status filter
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        // Add search filter
        if (search) {
            sql += ' AND (name LIKE ? OR email LIKE ? OR university LIKE ? OR major LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM interns WHERE 1=1';
            const countParams = [];
            
            if (status) {
                countSql += ' AND status = ?';
                countParams.push(status);
            }
            
            if (search) {
                countSql += ' AND (name LIKE ? OR email LIKE ? OR university LIKE ? OR major LIKE ?)';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
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
                message: 'Failed to fetch interns',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get interns error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching interns',
            error: error.message
        });
    }
});

// Get intern by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery('SELECT * FROM interns WHERE id = ?', [id]);

        if (result.success) {
            if (result.data.length > 0) {
                res.json({
                    success: true,
                    data: result.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Intern not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch intern',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get intern error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching intern',
            error: error.message
        });
    }
});

// Create new intern
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
    body('university').notEmpty().withMessage('University is required'),
    body('major').notEmpty().withMessage('Major is required'),
    body('status').optional().isIn(['Available', 'Assigned', 'Completed', 'Inactive']).withMessage('Invalid status')
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

        const { name, email, phone, university, major, graduation_year, gpa, skills, status = 'Available' } = req.body;

        // Check if email already exists
        const existingIntern = await executeQuery(
            'SELECT id FROM interns WHERE email = ?',
            [email]
        );

        if (existingIntern.success && existingIntern.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Intern with this email already exists'
            });
        }

        const result = await executeQuery(
            'INSERT INTO interns (name, email, phone, university, major, graduation_year, gpa, skills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone, university, major, graduation_year, gpa, skills, status]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Intern created successfully',
                data: { id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create intern',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create intern error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating intern',
            error: error.message
        });
    }
});

// Update intern
router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
    body('university').optional().notEmpty().withMessage('University cannot be empty'),
    body('major').optional().notEmpty().withMessage('Major cannot be empty'),
    body('status').optional().isIn(['Available', 'Assigned', 'Completed', 'Inactive']).withMessage('Invalid status')
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
        const { name, email, phone, university, major, graduation_year, gpa, skills, status } = req.body;

        // Check if intern exists
        const existingIntern = await executeQuery('SELECT id FROM interns WHERE id = ?', [id]);
        if (!existingIntern.success || existingIntern.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (email) {
            const emailCheck = await executeQuery(
                'SELECT id FROM interns WHERE email = ? AND id != ?',
                [email, id]
            );
            if (emailCheck.success && emailCheck.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists for another intern'
                });
            }
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (university !== undefined) {
            updateFields.push('university = ?');
            updateValues.push(university);
        }
        if (major !== undefined) {
            updateFields.push('major = ?');
            updateValues.push(major);
        }
        if (graduation_year !== undefined) {
            updateFields.push('graduation_year = ?');
            updateValues.push(graduation_year);
        }
        if (gpa !== undefined) {
            updateFields.push('gpa = ?');
            updateValues.push(gpa);
        }
        if (skills !== undefined) {
            updateFields.push('skills = ?');
            updateValues.push(skills);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE interns SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Intern updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update intern',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update intern error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating intern',
            error: error.message
        });
    }
});

// Delete intern
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if intern exists
        const existingIntern = await executeQuery('SELECT id FROM interns WHERE id = ?', [id]);
        if (!existingIntern.success || existingIntern.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found'
            });
        }

        // Check if intern is assigned to any active internships
        const activeInternships = await executeQuery(
            'SELECT id FROM internships WHERE intern_id = ? AND status = "Active"',
            [id]
        );

        if (activeInternships.success && activeInternships.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete intern with active internships'
            });
        }

        const result = await executeQuery('DELETE FROM interns WHERE id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Intern deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete intern',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete intern error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting intern',
            error: error.message
        });
    }
});

// Get intern statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                status,
                COUNT(*) as count
            FROM interns 
            GROUP BY status
        `);

        if (statsResult.success) {
            const stats = {
                total: 0,
                available: 0,
                assigned: 0,
                completed: 0,
                inactive: 0
            };

            statsResult.data.forEach(row => {
                stats.total += row.count;
                stats[row.status.toLowerCase()] = row.count;
            });

            res.json({
                success: true,
                data: stats
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch intern statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get intern stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching intern statistics',
            error: error.message
        });
    }
});

module.exports = router;
