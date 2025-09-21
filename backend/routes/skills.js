const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all skills
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        let sql = 'SELECT * FROM skills WHERE 1=1';
        const params = [];

        // Add category filter
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        // Add search filter
        if (search) {
            sql += ' AND (skill_name LIKE ? OR category LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY skill_name LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM skills WHERE 1=1';
            const countParams = [];
            
            if (category) {
                countSql += ' AND category = ?';
                countParams.push(category);
            }
            
            if (search) {
                countSql += ' AND (skill_name LIKE ? OR category LIKE ?)';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm);
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
                message: 'Failed to fetch skills',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching skills',
            error: error.message
        });
    }
});

// Get skill by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery('SELECT * FROM skills WHERE skill_id = ?', [id]);

        if (result.success) {
            if (result.data.length > 0) {
                res.json({
                    success: true,
                    data: result.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Skill not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch skill',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching skill',
            error: error.message
        });
    }
});

// Create new skill
router.post('/', [
    body('skill_name').notEmpty().withMessage('Skill name is required'),
    body('category').notEmpty().withMessage('Category is required')
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

        const { skill_name, category } = req.body;

        // Check if skill already exists
        const existingSkill = await executeQuery(
            'SELECT skill_id FROM skills WHERE skill_name = ?',
            [skill_name]
        );

        if (existingSkill.success && existingSkill.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Skill with this name already exists'
            });
        }

        const result = await executeQuery(
            'INSERT INTO skills (skill_name, category) VALUES (?, ?)',
            [skill_name, category]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Skill created successfully',
                data: { skill_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create skill',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating skill',
            error: error.message
        });
    }
});

// Update skill
router.put('/:id', [
    body('skill_name').optional().notEmpty().withMessage('Skill name cannot be empty'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty')
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
        const { skill_name, category } = req.body;

        // Check if skill exists
        const existingSkill = await executeQuery('SELECT skill_id FROM skills WHERE skill_id = ?', [id]);
        if (!existingSkill.success || existingSkill.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        // Check if skill name is being changed and if it already exists
        if (skill_name) {
            const nameCheck = await executeQuery(
                'SELECT skill_id FROM skills WHERE skill_name = ? AND skill_id != ?',
                [skill_name, id]
            );
            if (nameCheck.success && nameCheck.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Skill name already exists'
                });
            }
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (skill_name !== undefined) {
            updateFields.push('skill_name = ?');
            updateValues.push(skill_name);
        }
        if (category !== undefined) {
            updateFields.push('category = ?');
            updateValues.push(category);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE skills SET ${updateFields.join(', ')} WHERE skill_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Skill updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update skill',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating skill',
            error: error.message
        });
    }
});

// Delete skill
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if skill exists
        const existingSkill = await executeQuery('SELECT skill_id FROM skills WHERE skill_id = ?', [id]);
        if (!existingSkill.success || existingSkill.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        // Check if skill is being used by students or jobs
        const studentUsage = await executeQuery(
            'SELECT COUNT(*) as count FROM student_skills WHERE skill_id = ?',
            [id]
        );
        const jobUsage = await executeQuery(
            'SELECT COUNT(*) as count FROM job_skills WHERE skill_id = ?',
            [id]
        );

        if (studentUsage.success && studentUsage.data[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete skill that is assigned to students'
            });
        }

        if (jobUsage.success && jobUsage.data[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete skill that is required by jobs'
            });
        }

        const result = await executeQuery('DELETE FROM skills WHERE skill_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Skill deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete skill',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting skill',
            error: error.message
        });
    }
});

// Get skill categories
router.get('/categories/list', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT DISTINCT category 
            FROM skills 
            WHERE category IS NOT NULL 
            ORDER BY category
        `);

        if (result.success) {
            res.json({
                success: true,
                data: result.data.map(row => row.category)
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch skill categories',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get skill categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching skill categories',
            error: error.message
        });
    }
});

// Get skill statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                category,
                COUNT(*) as count
            FROM skills 
            GROUP BY category
            ORDER BY count DESC
        `);

        const usageResult = await executeQuery(`
            SELECT 
                s.category,
                COUNT(DISTINCT ss.stud_id) as students_using,
                COUNT(DISTINCT js.job_id) as jobs_requiring
            FROM skills s
            LEFT JOIN student_skills ss ON s.skill_id = ss.skill_id
            LEFT JOIN job_skills js ON s.skill_id = js.skill_id
            GROUP BY s.category
            ORDER BY students_using DESC, jobs_requiring DESC
        `);

        if (statsResult.success && usageResult.success) {
            res.json({
                success: true,
                data: {
                    byCategory: statsResult.data,
                    usage: usageResult.data
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch skill statistics',
                error: 'Database query failed'
            });
        }
    } catch (error) {
        console.error('Get skill stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching skill statistics',
            error: error.message
        });
    }
});

module.exports = router;