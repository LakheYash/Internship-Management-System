const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all notifications
router.get('/', async (req, res) => {
    try {
        const { stud_id, admin_id, is_read, type, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT 
                n.*,
                s.first_name,
                s.last_name,
                s.email as student_email,
                a.name as admin_name
            FROM notifications n
            LEFT JOIN students s ON n.stud_id = s.stud_id
            LEFT JOIN admin a ON n.admin_id = a.admin_id
            WHERE 1=1
        `;
        const params = [];

        if (stud_id) {
            sql += ' AND n.stud_id = ?';
            params.push(stud_id);
        }

        if (admin_id) {
            sql += ' AND n.admin_id = ?';
            params.push(admin_id);
        }

        if (is_read !== undefined) {
            sql += ' AND n.is_read = ?';
            params.push(is_read === 'true');
        }

        if (type) {
            sql += ' AND n.type = ?';
            params.push(type);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch notifications',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching notifications',
            error: error.message
        });
    }
});

// Get notification by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT 
                n.*,
                s.first_name,
                s.last_name,
                s.email as student_email,
                a.name as admin_name
            FROM notifications n
            LEFT JOIN students s ON n.stud_id = s.stud_id
            LEFT JOIN admin a ON n.admin_id = a.admin_id
            WHERE n.not_id = ?
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
                    message: 'Notification not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notification',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching notification',
            error: error.message
        });
    }
});

// Create new notification
router.post('/', [
    body('msg').notEmpty().withMessage('Message is required'),
    body('type').isIn(['info', 'warning', 'success', 'error', 'reminder']).withMessage('Invalid notification type'),
    body('stud_id').optional().isInt().withMessage('Student ID must be a valid integer'),
    body('admin_id').optional().isInt().withMessage('Admin ID must be a valid integer')
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

        const { stud_id, admin_id, msg, type = 'info', month, day } = req.body;

        // If stud_id is provided, check if student exists
        if (stud_id) {
            const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
            if (!studentCheck.success || studentCheck.data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Student not found'
                });
            }
        }

        // If admin_id is provided, check if admin exists
        if (admin_id) {
            const adminCheck = await executeQuery('SELECT admin_id FROM admin WHERE admin_id = ?', [admin_id]);
            if (!adminCheck.success || adminCheck.data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
        }

        const result = await executeQuery(
            'INSERT INTO notifications (stud_id, admin_id, msg, type, month, day) VALUES (?, ?, ?, ?, ?, ?)',
            [stud_id, admin_id, msg, type, month, day]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Notification created successfully',
                data: { not_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create notification',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating notification',
            error: error.message
        });
    }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if notification exists
        const existingNotification = await executeQuery('SELECT not_id FROM notifications WHERE not_id = ?', [id]);
        if (!existingNotification.success || existingNotification.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        const result = await executeQuery(
            'UPDATE notifications SET is_read = TRUE WHERE not_id = ?',
            [id]
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking notification as read',
            error: error.message
        });
    }
});

// Mark all notifications as read for a student
router.put('/student/:studId/read-all', async (req, res) => {
    try {
        const { studId } = req.params;

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [studId]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const result = await executeQuery(
            'UPDATE notifications SET is_read = TRUE WHERE stud_id = ? AND is_read = FALSE',
            [studId]
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to mark notifications as read',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking notifications as read',
            error: error.message
        });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if notification exists
        const existingNotification = await executeQuery('SELECT not_id FROM notifications WHERE not_id = ?', [id]);
        if (!existingNotification.success || existingNotification.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        const result = await executeQuery('DELETE FROM notifications WHERE not_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting notification',
            error: error.message
        });
    }
});

// Get unread notification count for a student
router.get('/student/:studId/unread-count', async (req, res) => {
    try {
        const { studId } = req.params;

        const result = await executeQuery(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE stud_id = ? AND is_read = FALSE',
            [studId]
        );

        if (result.success) {
            res.json({
                success: true,
                data: {
                    unreadCount: result.data[0].unread_count
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch unread count',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching unread count',
            error: error.message
        });
    }
});

// Get notifications for a specific student
router.get('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;
        const { is_read, type, page = 1, limit = 10 } = req.query;

        let sql = `
            SELECT 
                n.*,
                a.name as admin_name
            FROM notifications n
            LEFT JOIN admin a ON n.admin_id = a.admin_id
            WHERE n.stud_id = ?
        `;
        const params = [studId];

        if (is_read !== undefined) {
            sql += ' AND n.is_read = ?';
            params.push(is_read === 'true');
        }

        if (type) {
            sql += ' AND n.type = ?';
            params.push(type);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch student notifications',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student notifications',
            error: error.message
        });
    }
});

module.exports = router;