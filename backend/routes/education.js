const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all education records
router.get('/', async (req, res) => {
    try {
        const { stud_id, degree, college, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT e.*, s.first_name, s.last_name, s.email 
            FROM education e 
            JOIN students s ON e.stud_id = s.stud_id 
            WHERE 1=1
        `;
        const params = [];

        // Add student filter
        if (stud_id) {
            sql += ' AND e.stud_id = ?';
            params.push(stud_id);
        }

        // Add degree filter
        if (degree) {
            sql += ' AND e.degree LIKE ?';
            params.push(`%${degree}%`);
        }

        // Add college filter
        if (college) {
            sql += ' AND e.college LIKE ?';
            params.push(`%${college}%`);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM education e WHERE 1=1';
            const countParams = [];
            
            if (stud_id) {
                countSql += ' AND e.stud_id = ?';
                countParams.push(stud_id);
            }
            
            if (degree) {
                countSql += ' AND e.degree LIKE ?';
                countParams.push(`%${degree}%`);
            }
            
            if (college) {
                countSql += ' AND e.college LIKE ?';
                countParams.push(`%${college}%`);
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
                message: 'Failed to fetch education records',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get education records error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching education records',
            error: error.message
        });
    }
});

// Get education record by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT e.*, s.first_name, s.last_name, s.email 
            FROM education e 
            JOIN students s ON e.stud_id = s.stud_id 
            WHERE e.edu_id = ?
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
                    message: 'Education record not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch education record',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get education record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching education record',
            error: error.message
        });
    }
});

// Create new education record
router.post('/', [
    body('stud_id').isInt().withMessage('Student ID must be a valid integer'),
    body('degree').notEmpty().withMessage('Degree is required'),
    body('college').notEmpty().withMessage('College is required'),
    body('cgpa').optional().isFloat({ min: 0, max: 4 }).withMessage('CGPA must be between 0 and 4')
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

        const { stud_id, degree, college, cgpa, start_date, end_date } = req.body;

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student not found'
            });
        }

        const result = await executeQuery(
            'INSERT INTO education (stud_id, degree, college, cgpa, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [stud_id, degree, college, cgpa, start_date, end_date]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Education record created successfully',
                data: { edu_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create education record',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create education record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating education record',
            error: error.message
        });
    }
});

// Update education record
router.put('/:id', [
    body('degree').optional().notEmpty().withMessage('Degree cannot be empty'),
    body('college').optional().notEmpty().withMessage('College cannot be empty'),
    body('cgpa').optional().isFloat({ min: 0, max: 4 }).withMessage('CGPA must be between 0 and 4')
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
        const { degree, college, cgpa, start_date, end_date } = req.body;

        // Check if education record exists
        const existingRecord = await executeQuery('SELECT edu_id FROM education WHERE edu_id = ?', [id]);
        if (!existingRecord.success || existingRecord.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Education record not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (degree !== undefined) {
            updateFields.push('degree = ?');
            updateValues.push(degree);
        }
        if (college !== undefined) {
            updateFields.push('college = ?');
            updateValues.push(college);
        }
        if (cgpa !== undefined) {
            updateFields.push('cgpa = ?');
            updateValues.push(cgpa);
        }
        if (start_date !== undefined) {
            updateFields.push('start_date = ?');
            updateValues.push(start_date);
        }
        if (end_date !== undefined) {
            updateFields.push('end_date = ?');
            updateValues.push(end_date);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE education SET ${updateFields.join(', ')} WHERE edu_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Education record updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update education record',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update education record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating education record',
            error: error.message
        });
    }
});

// Delete education record
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if education record exists
        const existingRecord = await executeQuery('SELECT edu_id FROM education WHERE edu_id = ?', [id]);
        if (!existingRecord.success || existingRecord.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Education record not found'
            });
        }

        const result = await executeQuery('DELETE FROM education WHERE edu_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Education record deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete education record',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete education record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting education record',
            error: error.message
        });
    }
});

// Get education records by student
router.get('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;
        const result = await executeQuery(
            'SELECT * FROM education WHERE stud_id = ? ORDER BY start_date DESC',
            [studId]
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch student education records',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student education records error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student education records',
            error: error.message
        });
    }
});

module.exports = router;
