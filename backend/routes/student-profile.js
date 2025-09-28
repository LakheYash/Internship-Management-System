const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get student profile by student ID
router.get('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;
        const result = await executeQuery(`
            SELECT sp.*, s.first_name, s.last_name, s.email, s.phone, s.status
            FROM student_profile sp
            JOIN students s ON sp.stud_id = s.stud_id
            WHERE sp.stud_id = ?
        `, [studId]);

        if (result.success) {
            if (result.data.length > 0) {
                res.json({
                    success: true,
                    data: result.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Student profile not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch student profile',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student profile',
            error: error.message
        });
    }
});

// Create or update student profile
router.post('/student/:studId', [
    body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
    body('linkedin_url').optional().isURL().withMessage('LinkedIn URL must be valid'),
    body('github_url').optional().isURL().withMessage('GitHub URL must be valid'),
    body('portfolio_url').optional().isURL().withMessage('Portfolio URL must be valid'),
    body('salary_expectation').optional().isFloat({ min: 0 }).withMessage('Salary expectation must be positive')
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

        const { studId } = req.params;
        const { 
            bio, 
            linkedin_url, 
            github_url, 
            portfolio_url, 
            resume_file_path, 
            profile_picture, 
            availability_start, 
            availability_end, 
            salary_expectation 
        } = req.body;

        // Check if student exists
        const studentCheck = await executeQuery('SELECT stud_id FROM students WHERE stud_id = ?', [studId]);
        if (!studentCheck.success || studentCheck.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if profile already exists
        const existingProfile = await executeQuery('SELECT profile_id FROM student_profile WHERE stud_id = ?', [studId]);

        let result;
        if (existingProfile.success && existingProfile.data.length > 0) {
            // Update existing profile
            const updateFields = [];
            const updateValues = [];

            if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio); }
            if (linkedin_url !== undefined) { updateFields.push('linkedin_url = ?'); updateValues.push(linkedin_url); }
            if (github_url !== undefined) { updateFields.push('github_url = ?'); updateValues.push(github_url); }
            if (portfolio_url !== undefined) { updateFields.push('portfolio_url = ?'); updateValues.push(portfolio_url); }
            if (resume_file_path !== undefined) { updateFields.push('resume_file_path = ?'); updateValues.push(resume_file_path); }
            if (profile_picture !== undefined) { updateFields.push('profile_picture = ?'); updateValues.push(profile_picture); }
            if (availability_start !== undefined) { updateFields.push('availability_start = ?'); updateValues.push(availability_start); }
            if (availability_end !== undefined) { updateFields.push('availability_end = ?'); updateValues.push(availability_end); }
            if (salary_expectation !== undefined) { updateFields.push('salary_expectation = ?'); updateValues.push(salary_expectation); }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            updateValues.push(studId);
            result = await executeQuery(
                `UPDATE student_profile SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE stud_id = ?`,
                updateValues
            );
        } else {
            // Create new profile
            result = await executeQuery(`
                INSERT INTO student_profile (stud_id, bio, linkedin_url, github_url, portfolio_url, resume_file_path, profile_picture, availability_start, availability_end, salary_expectation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [studId, bio, linkedin_url, github_url, portfolio_url, resume_file_path, profile_picture, availability_start, availability_end, salary_expectation]);
        }

        if (result.success) {
            res.json({
                success: true,
                message: existingProfile.success && existingProfile.data.length > 0 ? 'Student profile updated successfully' : 'Student profile created successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to save student profile',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Save student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error saving student profile',
            error: error.message
        });
    }
});

// Delete student profile
router.delete('/student/:studId', async (req, res) => {
    try {
        const { studId } = req.params;

        const result = await executeQuery('DELETE FROM student_profile WHERE stud_id = ?', [studId]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Student profile deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete student profile',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting student profile',
            error: error.message
        });
    }
});

module.exports = router;
