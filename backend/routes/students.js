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

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery('SELECT * FROM students WHERE stud_id = ?', [id]);

        if (result.success) {
            if (result.data.length > 0) {
                res.json({
                    success: true,
                    data: result.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student',
            error: error.message
        });
    }
});

// Create new student
router.post('/', [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('age').optional().isInt({ min: 16, max: 100 }).withMessage('Age must be between 16 and 100'),
    body('status').optional().isIn(['Available', 'Applied', 'Selected', 'Completed', 'Inactive']).withMessage('Invalid status')
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
            phone, 
            status = 'Available' 
        } = req.body;

        // Check if email already exists
        const existingStudent = await executeQuery(
            'SELECT stud_id FROM students WHERE email = ?',
            [email]
        );

        if (existingStudent.success && existingStudent.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email already exists'
            });
        }

        const result = await executeQuery(
            'INSERT INTO students (first_name, middle_name, last_name, city, state, pin, age, email, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [first_name, middle_name, last_name, city, state, pin, age, email, phone, status]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Student created successfully',
                data: { stud_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating student',
            error: error.message
        });
    }
});

// Update student
router.put('/:id', [
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('age').optional().isInt({ min: 16, max: 100 }).withMessage('Age must be between 16 and 100'),
    body('status').optional().isIn(['Available', 'Applied', 'Selected', 'Completed', 'Inactive']).withMessage('Invalid status')
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
            first_name, 
            middle_name, 
            last_name, 
            city, 
            state, 
            pin, 
            age, 
            email, 
            phone, 
            status 
        } = req.body;

        // Check if student exists
        const existingStudent = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [id]);
        if (!existingStudent.success || existingStudent.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (email) {
            const emailCheck = await executeQuery(
                'SELECT stud_id FROM students WHERE email = ? AND stud_id != ?',
                [email, id]
            );
            if (emailCheck.success && emailCheck.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists for another student'
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
        if (middle_name !== undefined) {
            updateFields.push('middle_name = ?');
            updateValues.push(middle_name);
        }
        if (last_name !== undefined) {
            updateFields.push('last_name = ?');
            updateValues.push(last_name);
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
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
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
            `UPDATE students SET ${updateFields.join(', ')} WHERE stud_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Student updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating student',
            error: error.message
        });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if student exists
        const existingStudent = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [id]);
        if (!existingStudent.success || existingStudent.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if student has active applications
        const activeApplications = await executeQuery(
            'SELECT app_id FROM application WHERE stud_id = ? AND status IN ("Pending", "Under Review", "Shortlisted")',
            [id]
        );

        if (activeApplications.success && activeApplications.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete student with active applications'
            });
        }

        const result = await executeQuery('DELETE FROM students WHERE stud_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Student deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting student',
            error: error.message
        });
    }
});

// Get student statistics
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
                applied: 0,
                selected: 0,
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
                message: 'Failed to fetch student statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get student stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student statistics',
            error: error.message
        });
    }
});

// Get student with related data (education, projects, skills)
router.get('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;

        // Get student basic info
        const studentResult = await executeQuery('SELECT * FROM students WHERE stud_id = ?', [id]);
        if (!studentResult.success || studentResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = studentResult.data[0];

        // Get education records
        const educationResult = await executeQuery('SELECT * FROM education WHERE stud_id = ?', [id]);
        
        // Get projects
        const projectsResult = await executeQuery('SELECT * FROM projects WHERE stud_id = ?', [id]);
        
        // Get skills
        const skillsResult = await executeQuery(`
            SELECT s.skill_name, s.category, ss.proficiency_level 
            FROM skills s 
            JOIN student_skills ss ON s.skill_id = ss.skill_id 
            WHERE ss.stud_id = ?
        `, [id]);

        // Get applications
        const applicationsResult = await executeQuery(`
            SELECT a.*, j.title as job_title, c.name as company_name 
            FROM application a 
            JOIN jobs j ON a.job_id = j.job_id 
            JOIN company c ON j.comp_id = c.comp_id 
            WHERE a.stud_id = ?
        `, [id]);

        res.json({
            success: true,
            data: {
                student,
                education: educationResult.success ? educationResult.data : [],
                projects: projectsResult.success ? projectsResult.data : [],
                skills: skillsResult.success ? skillsResult.data : [],
                applications: applicationsResult.success ? applicationsResult.data : []
            }
        });
    } catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student details',
            error: error.message
        });
    }
});

module.exports = router;
