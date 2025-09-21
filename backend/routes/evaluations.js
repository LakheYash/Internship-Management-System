const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all evaluations
router.get('/', async (req, res) => {
    try {
        const { internship_id, evaluator_type, page = 1, limit = 10 } = req.query;
        let sql = `
            SELECT 
                e.*,
                i.title as internship_title,
                c.name as company_name,
                intern.name as intern_name
            FROM evaluations e
            LEFT JOIN internships i ON e.internship_id = i.id
            LEFT JOIN companies c ON i.company_id = c.id
            LEFT JOIN interns intern ON i.intern_id = intern.id
            WHERE 1=1
        `;
        const params = [];

        if (internship_id) {
            sql += ' AND e.internship_id = ?';
            params.push(internship_id);
        }

        if (evaluator_type) {
            sql += ' AND e.evaluator_type = ?';
            params.push(evaluator_type);
        }

        const offset = (page - 1) * limit;
        sql += ' ORDER BY e.evaluation_date DESC LIMIT ? OFFSET ?';
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
                message: 'Failed to fetch evaluations',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching evaluations',
            error: error.message
        });
    }
});

// Get evaluation by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT 
                e.*,
                i.title as internship_title,
                c.name as company_name,
                intern.name as intern_name
            FROM evaluations e
            LEFT JOIN internships i ON e.internship_id = i.id
            LEFT JOIN companies c ON i.company_id = c.id
            LEFT JOIN interns intern ON i.intern_id = intern.id
            WHERE e.id = ?
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
                    message: 'Evaluation not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch evaluation',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching evaluation',
            error: error.message
        });
    }
});

// Create new evaluation
router.post('/', [
    body('internship_id').isInt().withMessage('Internship ID must be a valid integer'),
    body('evaluator_type').isIn(['supervisor', 'intern', 'admin']).withMessage('Invalid evaluator type'),
    body('technical_skills').isInt({ min: 1, max: 5 }).withMessage('Technical skills rating must be between 1 and 5'),
    body('communication_skills').isInt({ min: 1, max: 5 }).withMessage('Communication skills rating must be between 1 and 5'),
    body('teamwork').isInt({ min: 1, max: 5 }).withMessage('Teamwork rating must be between 1 and 5'),
    body('punctuality').isInt({ min: 1, max: 5 }).withMessage('Punctuality rating must be between 1 and 5'),
    body('overall_rating').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5')
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
            evaluator_type, 
            technical_skills, 
            communication_skills, 
            teamwork, 
            punctuality, 
            overall_rating, 
            comments 
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
            `INSERT INTO evaluations 
            (internship_id, evaluator_type, technical_skills, communication_skills, teamwork, punctuality, overall_rating, comments) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [internship_id, evaluator_type, technical_skills, communication_skills, teamwork, punctuality, overall_rating, comments]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Evaluation created successfully',
                data: { id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create evaluation',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating evaluation',
            error: error.message
        });
    }
});

// Update evaluation
router.put('/:id', [
    body('technical_skills').optional().isInt({ min: 1, max: 5 }).withMessage('Technical skills rating must be between 1 and 5'),
    body('communication_skills').optional().isInt({ min: 1, max: 5 }).withMessage('Communication skills rating must be between 1 and 5'),
    body('teamwork').optional().isInt({ min: 1, max: 5 }).withMessage('Teamwork rating must be between 1 and 5'),
    body('punctuality').optional().isInt({ min: 1, max: 5 }).withMessage('Punctuality rating must be between 1 and 5'),
    body('overall_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5')
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
            technical_skills, 
            communication_skills, 
            teamwork, 
            punctuality, 
            overall_rating, 
            comments 
        } = req.body;

        // Check if evaluation exists
        const existingEvaluation = await executeQuery('SELECT id FROM evaluations WHERE id = ?', [id]);
        if (!existingEvaluation.success || existingEvaluation.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evaluation not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (technical_skills !== undefined) {
            updateFields.push('technical_skills = ?');
            updateValues.push(technical_skills);
        }
        if (communication_skills !== undefined) {
            updateFields.push('communication_skills = ?');
            updateValues.push(communication_skills);
        }
        if (teamwork !== undefined) {
            updateFields.push('teamwork = ?');
            updateValues.push(teamwork);
        }
        if (punctuality !== undefined) {
            updateFields.push('punctuality = ?');
            updateValues.push(punctuality);
        }
        if (overall_rating !== undefined) {
            updateFields.push('overall_rating = ?');
            updateValues.push(overall_rating);
        }
        if (comments !== undefined) {
            updateFields.push('comments = ?');
            updateValues.push(comments);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE evaluations SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Evaluation updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update evaluation',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating evaluation',
            error: error.message
        });
    }
});

// Delete evaluation
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if evaluation exists
        const existingEvaluation = await executeQuery('SELECT id FROM evaluations WHERE id = ?', [id]);
        if (!existingEvaluation.success || existingEvaluation.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evaluation not found'
            });
        }

        const result = await executeQuery('DELETE FROM evaluations WHERE id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Evaluation deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete evaluation',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting evaluation',
            error: error.message
        });
    }
});

// Get evaluation statistics for an internship
router.get('/internship/:internshipId/stats', async (req, res) => {
    try {
        const { internshipId } = req.params;
        
        const result = await executeQuery(`
            SELECT 
                AVG(technical_skills) as avg_technical_skills,
                AVG(communication_skills) as avg_communication_skills,
                AVG(teamwork) as avg_teamwork,
                AVG(punctuality) as avg_punctuality,
                AVG(overall_rating) as avg_overall_rating,
                COUNT(*) as total_evaluations
            FROM evaluations 
            WHERE internship_id = ?
        `, [internshipId]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data[0]
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch evaluation statistics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get evaluation stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching evaluation statistics',
            error: error.message
        });
    }
});

module.exports = router;
