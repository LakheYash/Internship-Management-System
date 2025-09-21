const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        let sql = 'SELECT * FROM students WHERE 1=1';
        const params = [];

        // Add status filter
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        // Add search filter
        if (search) {
            sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR city LIKE ?)';
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
            let countSql = 'SELECT COUNT(*) as total FROM students WHERE 1=1';
            const countParams = [];
            
            if (status) {
                countSql += ' AND status = ?';
                countParams.push(status);
            }
            
            if (search) {
                countSql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR city LIKE ?)';
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
                message: 'Failed to fetch students',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching students',
            error: error.message
        });
    }
});

// Get intern by ID
router.get('/:stud_id', async (req, res) => {
    try {
        const { stud_id } = req.params;
        const result = await executeQuery('SELECT * FROM students WHERE stud_stud_id = ?', [stud_id]);

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
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provstud_ide a valstud_id email'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
    body('city').optional().notEmpty().withMessage('City is required'),
    body('state').optional().notEmpty().withMessage('State is required'),
    body('status').optional().isIn(['Available', 'Applied', 'Selected', 'Completed', 'Inactive']).withMessage('Invalstud_id status')
], async (req, res) => {
    try {
        const errors = valstud_idationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Valstud_idation failed',
                errors: errors.array()
            });
        }

        const { first_name, last_name, email, phone, city, state, pin, age, status = 'Available' } = req.body;

        // Check if email already exists
        const existingStudent = await executeQuery(
            'SELECT stud_stud_id FROM students WHERE email = ?',
            [email]
        );

        if (existingStudent.success && existingStudent.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email already exists'
            });
        }

        const result = await executeQuery(
            'INSERT INTO students (first_name, last_name, email, phone, city, state, pin, age, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, phone, city, state, pin, age, status]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Intern created successfully',
                data: { stud_id: result.data.insertId }
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
router.put('/:stud_id', [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provstud_ide a valstud_id email'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
    body('university').optional().notEmpty().withMessage('University cannot be empty'),
    body('major').optional().notEmpty().withMessage('Major cannot be empty'),
    body('status').optional().isIn(['Available', 'Assigned', 'Completed', 'Inactive']).withMessage('Invalstud_id status')
], async (req, res) => {
    try {
        const errors = valstud_idationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Valstud_idation failed',
                errors: errors.array()
            });
        }

        const { stud_id } = req.params;
        const { first_name, last_name, email, phone, city, state, pin, age, status } = req.body;

        // Check if intern exists
        const existingIntern = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!existingIntern.success || existingIntern.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (email) {
            const emailCheck = await executeQuery(
                'SELECT stud_id FROM students WHERE email = ? AND stud_id != ?',
                [email, stud_id]
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

        if (first_name !== undefined) {
            updateFields.push('first_name = ?');
            updateValues.push(first_name);
        }
        if (last_name !== undefined) {
            updateFields.push('last_name = ?');
            updateValues.push(last_name);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (city !== undefined) {
            updateFields.push('city = ?');
            updateValues.push(city);
        }
        if (state !== undefined) {
            updateFields.push('state = ?');
            updateValues.push(state);
        }
        if (pin !== undefined) {
            updateFields.push('pin = ?');
            updateValues.push(pin);
        }
        if (age !== undefined) {
            updateFields.push('age = ?');
            updateValues.push(age);
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

        updateValues.push(stud_id);

        const result = await executeQuery(
            `UPDATE students SET ${updateFields.join(', ')} WHERE stud_id = ?`,
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
router.delete('/:stud_id', async (req, res) => {
    try {
        const { stud_id } = req.params;

        // Check if intern exists
        const existingIntern = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!existingIntern.success || existingIntern.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found'
            });
        }

        // Check if student is assigned to any active applications
        const activeApplications = await executeQuery(
            'SELECT app_id FROM application WHERE stud_id = ? AND status IN ("Pending", "Under Review", "Shortlisted")',
            [stud_id]
        );

        if (activeApplications.success && activeApplications.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete student with active applications'
            });
        }

        const result = await executeQuery('DELETE FROM students WHERE stud_id = ?', [stud_id]);

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
            FROM students 
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
