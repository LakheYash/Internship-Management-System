const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get company reviews
router.get('/', async (req, res) => {
    try {
        const { comp_id, stud_id, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT cr.*, s.first_name, s.last_name, c.name as company_name
            FROM company_reviews cr
            JOIN students s ON cr.stud_id = s.stud_id
            JOIN company c ON cr.comp_id = c.comp_id
            WHERE 1=1
        `;
        const params = [];

        if (comp_id) {
            sql += ' AND cr.comp_id = ?';
            params.push(comp_id);
        }

        if (stud_id) {
            sql += ' AND cr.stud_id = ?';
            params.push(stud_id);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM company_reviews WHERE 1=1';
            const countParams = [];
            
            if (comp_id) {
                countSql += ' AND comp_id = ?';
                countParams.push(comp_id);
            }
            
            if (stud_id) {
                countSql += ' AND stud_id = ?';
                countParams.push(stud_id);
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
                message: 'Failed to fetch company reviews',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get company reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company reviews',
            error: error.message
        });
    }
});

// Get company review by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT cr.*, s.first_name, s.last_name, c.name as company_name
            FROM company_reviews cr
            JOIN students s ON cr.stud_id = s.stud_id
            JOIN company c ON cr.comp_id = c.comp_id
            WHERE cr.review_id = ?
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
                    message: 'Company review not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch company review',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get company review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company review',
            error: error.message
        });
    }
});

// Create company review
router.post('/', [
    body('comp_id').isInt().withMessage('Company ID is required'),
    body('stud_id').isInt().withMessage('Student ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review_text').optional().isLength({ max: 1000 }).withMessage('Review text must be less than 1000 characters'),
    body('work_environment_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Work environment rating must be between 1 and 5'),
    body('learning_opportunity_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Learning opportunity rating must be between 1 and 5'),
    body('management_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Management rating must be between 1 and 5')
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
            comp_id, 
            stud_id, 
            rating, 
            review_text, 
            work_environment_rating, 
            learning_opportunity_rating, 
            management_rating, 
            is_anonymous = false 
        } = req.body;

        // Check if student and company exist
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [stud_id]);
        const companyCheck = await executeQuery('SELECT comp_id FROM company WHERE comp_id = ?', [comp_id]);

        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!companyCheck.success || companyCheck.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if review already exists for this student-company pair
        const existingReview = await executeQuery(
            'SELECT review_id FROM company_reviews WHERE stud_id = ? AND comp_id = ?',
            [stud_id, comp_id]
        );

        if (existingReview.success && existingReview.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Review already exists for this student-company pair'
            });
        }

        const result = await executeQuery(`
            INSERT INTO company_reviews (comp_id, stud_id, rating, review_text, work_environment_rating, learning_opportunity_rating, management_rating, is_anonymous)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [comp_id, stud_id, rating, review_text, work_environment_rating, learning_opportunity_rating, management_rating, is_anonymous]);

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Company review created successfully',
                data: { review_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create company review',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create company review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating company review',
            error: error.message
        });
    }
});

// Update company review
router.put('/:id', [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review_text').optional().isLength({ max: 1000 }).withMessage('Review text must be less than 1000 characters'),
    body('work_environment_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Work environment rating must be between 1 and 5'),
    body('learning_opportunity_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Learning opportunity rating must be between 1 and 5'),
    body('management_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Management rating must be between 1 and 5')
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
            rating, 
            review_text, 
            work_environment_rating, 
            learning_opportunity_rating, 
            management_rating, 
            is_anonymous 
        } = req.body;

        // Check if review exists
        const existingReview = await executeQuery('SELECT review_id FROM company_reviews WHERE review_id = ?', [id]);
        if (!existingReview.success || existingReview.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company review not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (rating !== undefined) { updateFields.push('rating = ?'); updateValues.push(rating); }
        if (review_text !== undefined) { updateFields.push('review_text = ?'); updateValues.push(review_text); }
        if (work_environment_rating !== undefined) { updateFields.push('work_environment_rating = ?'); updateValues.push(work_environment_rating); }
        if (learning_opportunity_rating !== undefined) { updateFields.push('learning_opportunity_rating = ?'); updateValues.push(learning_opportunity_rating); }
        if (management_rating !== undefined) { updateFields.push('management_rating = ?'); updateValues.push(management_rating); }
        if (is_anonymous !== undefined) { updateFields.push('is_anonymous = ?'); updateValues.push(is_anonymous); }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE company_reviews SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE review_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Company review updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update company review',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update company review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating company review',
            error: error.message
        });
    }
});

// Delete company review
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await executeQuery('DELETE FROM company_reviews WHERE review_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Company review deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete company review',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete company review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting company review',
            error: error.message
        });
    }
});

// Get company review statistics
router.get('/stats/company/:compId', async (req, res) => {
    try {
        const { compId } = req.params;
        const result = await executeQuery(`
            SELECT 
                AVG(rating) as avg_rating,
                AVG(work_environment_rating) as avg_work_environment,
                AVG(learning_opportunity_rating) as avg_learning_opportunity,
                AVG(management_rating) as avg_management,
                COUNT(*) as total_reviews,
                COUNT(CASE WHEN is_anonymous = FALSE THEN 1 END) as public_reviews
            FROM company_reviews 
            WHERE comp_id = ?
        `, [compId]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data[0]
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch company review statistics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get company review stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company review statistics',
            error: error.message
        });
    }
});

module.exports = router;
