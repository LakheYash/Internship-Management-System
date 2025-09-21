const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const { internship_id, status, priority, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT 
                t.*,
                i.title as internship_title,
                c.name as company_name,
                intern.name as intern_name
            FROM tasks t
            LEFT JOIN internships i ON t.internship_id = i.id
            LEFT JOIN companies c ON i.company_id = c.id
            LEFT JOIN interns intern ON i.intern_id = intern.id
            WHERE 1=1
        `;
        const params = [];

        if (internship_id) {
            sql += ' AND t.internship_id = ?';
            params.push(internship_id);
        }

        if (status) {
            sql += ' AND t.status = ?';
            params.push(status);
        }

        if (priority) {
            sql += ' AND t.priority = ?';
            params.push(priority);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch tasks',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching tasks',
            error: error.message
        });
    }
});

// Get task by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT 
                t.*,
                i.title as internship_title,
                c.name as company_name,
                intern.name as intern_name
            FROM tasks t
            LEFT JOIN internships i ON t.internship_id = i.id
            LEFT JOIN companies c ON i.company_id = c.id
            LEFT JOIN interns intern ON i.intern_id = intern.id
            WHERE t.id = ?
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
                    message: 'Task not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching task',
            error: error.message
        });
    }
});

// Create new task
router.post('/', [
    body('internship_id').isInt().withMessage('Internship ID must be a valid integer'),
    body('title').notEmpty().withMessage('Task title is required'),
    body('assigned_date').isISO8601().withMessage('Assigned date must be a valid date'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority')
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
            internship_id, 
            title, 
            description, 
            assigned_date, 
            due_date, 
            priority = 'Medium' 
        } = req.body;

        // Check if internship exists
        const internshipCheck = await executeQuery('SELECT id FROM internships WHERE id = ?', [internship_id]);
        if (!internshipCheck.success || internshipCheck.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Internship not found'
            });
        }

        const result = await executeQuery(
            `INSERT INTO tasks 
            (internship_id, title, description, assigned_date, due_date, priority) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [internship_id, title, description, assigned_date, due_date, priority]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: { id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create task',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating task',
            error: error.message
        });
    }
});

// Update task
router.put('/:id', [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('assigned_date').optional().isISO8601().withMessage('Assigned date must be a valid date'),
    body('due_date').optional().isISO8601().withMessage('Due date must be a valid date'),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Overdue']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority')
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
            assigned_date, 
            due_date, 
            status, 
            priority 
        } = req.body;

        // Check if task exists
        const existingTask = await executeQuery('SELECT id FROM tasks WHERE id = ?', [id]);
        if (!existingTask.success || existingTask.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
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
        if (assigned_date !== undefined) {
            updateFields.push('assigned_date = ?');
            updateValues.push(assigned_date);
        }
        if (due_date !== undefined) {
            updateFields.push('due_date = ?');
            updateValues.push(due_date);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (priority !== undefined) {
            updateFields.push('priority = ?');
            updateValues.push(priority);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Task updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update task',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating task',
            error: error.message
        });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if task exists
        const existingTask = await executeQuery('SELECT id FROM tasks WHERE id = ?', [id]);
        if (!existingTask.success || existingTask.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const result = await executeQuery('DELETE FROM tasks WHERE id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Task deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete task',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting task',
            error: error.message
        });
    }
});

// Get tasks by internship
router.get('/internship/:internshipId', async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { status, priority, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                t.*,
                i.title as internship_title,
                c.name as company_name,
                intern.name as intern_name
            FROM tasks t
            LEFT JOIN internships i ON t.internship_id = i.id
            LEFT JOIN companies c ON i.company_id = c.id
            LEFT JOIN interns intern ON i.intern_id = intern.id
            WHERE t.internship_id = ?
        `;
        const params = [internshipId];

        if (status) {
            sql += ' AND t.status = ?';
            params.push(status);
        }

        if (priority) {
            sql += ' AND t.priority = ?';
            params.push(priority);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch internship tasks',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get internship tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching internship tasks',
            error: error.message
        });
    }
});

// Get task statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                status,
                priority,
                COUNT(*) as count
            FROM tasks 
            GROUP BY status, priority
        `);

        if (statsResult.success) {
            const stats = {
                byStatus: {},
                byPriority: {},
                total: 0
            };

            statsResult.data.forEach(row => {
                stats.total += row.count;
                
                // Group by status
                if (!stats.byStatus[row.status]) {
                    stats.byStatus[row.status] = 0;
                }
                stats.byStatus[row.status] += row.count;

                // Group by priority
                if (!stats.byPriority[row.priority]) {
                    stats.byPriority[row.priority] = 0;
                }
                stats.byPriority[row.priority] += row.count;
            });

            res.json({
                success: true,
                data: stats
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get task stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching task statistics',
            error: error.message
        });
    }
});

module.exports = router;
