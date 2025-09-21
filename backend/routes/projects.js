const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
    try {
        const { stud_id, project_type, search, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT p.*, s.first_name, s.last_name, s.email 
            FROM projects p 
            JOIN students s ON p.stud_id = s.stud_id 
            WHERE 1=1
        `;
        const params = [];

        // Add student filter
        if (stud_id) {
            sql += ' AND p.stud_id = ?';
            params.push(stud_id);
        }

        // Add project type filter
        if (project_type) {
            sql += ' AND p.project_type = ?';
            params.push(project_type);
        }

        // Add search filter
        if (search) {
            sql += ' AND (p.project_name LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM projects p WHERE 1=1';
            const countParams = [];
            
            if (stud_id) {
                countSql += ' AND p.stud_id = ?';
                countParams.push(stud_id);
            }
            
            if (project_type) {
                countSql += ' AND p.project_type = ?';
                countParams.push(project_type);
            }
            
            if (search) {
                countSql += ' AND (p.project_name LIKE ? OR p.description LIKE ?)';
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
                message: 'Failed to fetch projects',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching projects',
            error: error.message
        });
    }
});

// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT p.*, s.first_name, s.last_name, s.email 
            FROM projects p 
            JOIN students s ON p.stud_id = s.stud_id 
            WHERE p.proj_id = ?
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
                    message: 'Project not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching project',
            error: error.message
        });
    }
});

// Create new project
router.post('/', [
    body('stud_id').isInt().withMessage('Student ID must be a valid integer'),
    body('project_name').notEmpty().withMessage('Project name is required'),
    body('project_type').optional().notEmpty().withMessage('Project type cannot be empty')
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
            project_name, 
            project_type, 
            description, 
            start_date, 
            end_date, 
            technologies_used 
        } = req.body;

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student not found'
            });
        }

        const result = await executeQuery(
            'INSERT INTO projects (stud_id, project_name, project_type, description, start_date, end_date, technologies_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [stud_id, project_name, project_type, description, start_date, end_date, technologies_used]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: { proj_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create project',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating project',
            error: error.message
        });
    }
});

// Update project
router.put('/:id', [
    body('project_name').optional().notEmpty().withMessage('Project name cannot be empty'),
    body('project_type').optional().notEmpty().withMessage('Project type cannot be empty')
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
            project_name, 
            project_type, 
            description, 
            start_date, 
            end_date, 
            technologies_used 
        } = req.body;

        // Check if project exists
        const existingProject = await executeQuery('SELECT proj_id FROM projects WHERE proj_id = ?', [id]);
        if (!existingProject.success || existingProject.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (project_name !== undefined) {
            updateFields.push('project_name = ?');
            updateValues.push(project_name);
        }
        if (project_type !== undefined) {
            updateFields.push('project_type = ?');
            updateValues.push(project_type);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (start_date !== undefined) {
            updateFields.push('start_date = ?');
            updateValues.push(start_date);
        }
        if (end_date !== undefined) {
            updateFields.push('end_date = ?');
            updateValues.push(end_date);
        }
        if (technologies_used !== undefined) {
            updateFields.push('technologies_used = ?');
            updateValues.push(technologies_used);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE projects SET ${updateFields.join(', ')} WHERE proj_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Project updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update project',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating project',
            error: error.message
        });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if project exists
        const existingProject = await executeQuery('SELECT proj_id FROM projects WHERE proj_id = ?', [id]);
        if (!existingProject.success || existingProject.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const result = await executeQuery('DELETE FROM projects WHERE proj_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Project deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete project',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting project',
            error: error.message
        });
    }
});

// Get projects by student
router.get('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;
        const result = await executeQuery(
            'SELECT * FROM projects WHERE stud_id = ? ORDER BY start_date DESC',
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
                message: 'Failed to fetch student projects',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student projects',
            error: error.message
        });
    }
});

// Get project types
router.get('/types/list', async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT DISTINCT project_type FROM projects WHERE project_type IS NOT NULL ORDER BY project_type',
            []
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data.map(row => row.project_type)
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project types',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get project types error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching project types',
            error: error.message
        });
    }
});

module.exports = router;
