const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get student skills
router.get('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;
        const { category } = req.query;

        let sql = `
            SELECT 
                ss.*,
                s.skill_name,
                s.category,
                s.skill_id
            FROM student_skills ss
            JOIN skills s ON ss.skill_id = s.skill_id
            WHERE ss.stud_id = ?
        `;
        const params = [studId];

        if (category) {
            sql += ' AND s.category = ?';
            params.push(category);
        }

        sql += ' ORDER BY s.category, s.skill_name';

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch student skills',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student skills',
            error: error.message
        });
    }
});

// Add skill to student
router.post('/', [
    body('stud_id').isInt().withMessage('Student ID must be a valid integer'),
    body('skill_id').isInt().withMessage('Skill ID must be a valid integer'),
    body('proficiency_level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid proficiency level')
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

        const { stud_id, skill_id, proficiency_level = 'Intermediate' } = req.body;

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if skill exists
        const skillCheck = await executeQuery('SELECT skill_id FROM skills WHERE skill_id = ?', [skill_id]);
        if (!skillCheck.success || skillCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Skill not found'
            });
        }

        // Check if skill is already assigned to student
        const existingAssignment = await executeQuery(
            'SELECT stud_id FROM student_skills WHERE stud_id = ? AND skill_id = ?',
            [stud_id, skill_id]
        );

        if (existingAssignment.success && existingAssignment.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Skill is already assigned to this student'
            });
        }

        const result = await executeQuery(
            'INSERT INTO student_skills (stud_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
            [stud_id, skill_id, proficiency_level]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Skill added to student successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to add skill to student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Add student skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding skill to student',
            error: error.message
        });
    }
});

// Update student skill proficiency
router.put('/:studId/:skillId', [
    body('proficiency_level').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid proficiency level')
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

        const { studId, skillId } = req.params;
        const { proficiency_level } = req.body;

        // Check if assignment exists
        const existingAssignment = await executeQuery(
            'SELECT stud_id FROM student_skills WHERE stud_id = ? AND skill_id = ?',
            [studId, skillId]
        );

        if (!existingAssignment.success || existingAssignment.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill assignment not found'
            });
        }

        const result = await executeQuery(
            'UPDATE student_skills SET proficiency_level = ? WHERE stud_id = ? AND skill_id = ?',
            [proficiency_level, studId, skillId]
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Student skill proficiency updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update student skill proficiency',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update student skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating student skill',
            error: error.message
        });
    }
});

// Remove skill from student
router.delete('/:studId/:skillId', async (req, res) => {
    try {
        const { studId, skillId } = req.params;

        // Check if assignment exists
        const existingAssignment = await executeQuery(
            'SELECT stud_id FROM student_skills WHERE stud_id = ? AND skill_id = ?',
            [studId, skillId]
        );

        if (!existingAssignment.success || existingAssignment.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill assignment not found'
            });
        }

        const result = await executeQuery(
            'DELETE FROM student_skills WHERE stud_id = ? AND skill_id = ?',
            [studId, skillId]
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Skill removed from student successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to remove skill from student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Remove student skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing skill from student',
            error: error.message
        });
    }
});

// Bulk add skills to student
router.post('/bulk', [
    body('stud_id').isInt().withMessage('Student ID must be a valid integer'),
    body('skills').isArray().withMessage('Skills must be an array'),
    body('skills.*.skill_id').isInt().withMessage('Each skill must have a valid skill_id'),
    body('skills.*.proficiency_level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid proficiency level')
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

        const { stud_id, skills } = req.body;

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student not found'
            });
        }

        const results = [];
        const errorMessages = [];

        for (const skill of skills) {
            const { skill_id, proficiency_level = 'Intermediate' } = skill;

            // Check if skill exists
            const skillCheck = await executeQuery('SELECT skill_id FROM skills WHERE skill_id = ?', [skill_id]);
            if (!skillCheck.success || skillCheck.data.length === 0) {
                errorMessages.push(`Skill ID ${skill_id} not found`);
                continue;
            }

            // Check if skill is already assigned
            const existingAssignment = await executeQuery(
                'SELECT stud_id FROM student_skills WHERE stud_id = ? AND skill_id = ?',
                [stud_id, skill_id]
            );

            if (existingAssignment.success && existingAssignment.data.length > 0) {
                errorMessages.push(`Skill ID ${skill_id} is already assigned to this student`);
                continue;
            }

            // Add skill
            const result = await executeQuery(
                'INSERT INTO student_skills (stud_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
                [stud_id, skill_id, proficiency_level]
            );

            if (result.success) {
                results.push({ skill_id, status: 'added' });
            } else {
                errorMessages.push(`Failed to add skill ID ${skill_id}: ${result.error}`);
            }
        }

        res.json({
            success: true,
            message: 'Bulk skill assignment completed',
            data: {
                added: results,
                errors: errorMessages
            }
        });
    } catch (error) {
        console.error('Bulk add student skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding skills to student',
            error: error.message
        });
    }
});

// Get students by skill
router.get('/skill/:skillId', async (req, res) => {
    try {
        const { skillId } = req.params;
        const { proficiency_level, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                s.stud_id,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.email,
                s.status,
                ss.proficiency_level,
                ss.created_at as skill_assigned_date
            FROM students s
            JOIN student_skills ss ON s.stud_id = ss.stud_id
            WHERE ss.skill_id = ?
        `;
        const params = [skillId];

        if (proficiency_level) {
            sql += ' AND ss.proficiency_level = ?';
            params.push(proficiency_level);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY ss.proficiency_level DESC, s.first_name LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = `
                SELECT COUNT(*) as total 
                FROM students s
                JOIN student_skills ss ON s.stud_id = ss.stud_id
                WHERE ss.skill_id = ?
            `;
            const countParams = [skillId];

            if (proficiency_level) {
                countSql += ' AND ss.proficiency_level = ?';
                countParams.push(proficiency_level);
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
                message: 'Failed to fetch students with skill',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get students by skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching students with skill',
            error: error.message
        });
    }
});

module.exports = router;
