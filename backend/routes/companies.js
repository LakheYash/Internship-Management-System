const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
    try {
        const { industry, search, page = 1, limit = 10 } = req.query;
        let sql = 'SELECT * FROM company WHERE is_active = TRUE';
        const params = [];

        // Add industry filter
        if (industry) {
            sql += ' AND industry = ?';
            params.push(industry);
        }

        // Add search filter
        if (search) {
            sql += ' AND (name LIKE ? OR hr_name LIKE ? OR city LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const result = await executeQuery(sql, params);

        if (result.success) {
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM company WHERE is_active = TRUE';
            const countParams = [];
            
            if (industry) {
                countSql += ' AND industry = ?';
                countParams.push(industry);
            }
            
            if (search) {
                countSql += ' AND (name LIKE ? OR hr_name LIKE ? OR city LIKE ?)';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
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
                message: 'Failed to fetch companies',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching companies',
            error: error.message
        });
    }
});

// Get company by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery('SELECT * FROM company WHERE comp_id = ? AND is_active = TRUE', [id]);

        if (result.success) {
            if (result.data.length > 0) {
                res.json({
                    success: true,
                    data: result.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch company',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company',
            error: error.message
        });
    }
});

// Create new company
router.post('/', [
    body('name').notEmpty().withMessage('Company name is required'),
    body('industry').notEmpty().withMessage('Industry is required'),
    body('hr_name').notEmpty().withMessage('HR name is required'),
    body('hr_email').isEmail().withMessage('Please provide a valid HR email'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required')
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
            name, 
            industry, 
            city, 
            state, 
            pin, 
            contact_no, 
            hr_name, 
            hr_phone, 
            hr_email, 
            website 
        } = req.body;

        // Check if company name already exists
        const existingCompany = await executeQuery(
            'SELECT comp_id FROM company WHERE name = ? AND is_active = TRUE',
            [name]
        );

        if (existingCompany.success && existingCompany.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Company with this name already exists'
            });
        }

        const result = await executeQuery(
            'INSERT INTO company (name, industry, city, state, pin, contact_no, hr_name, hr_phone, hr_email, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, industry, city, state, pin, contact_no, hr_name, hr_phone, hr_email, website]
        );

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Company created successfully',
                data: { comp_id: result.data.insertId }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create company',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating company',
            error: error.message
        });
    }
});

// Update company
router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('industry').optional().notEmpty().withMessage('Industry cannot be empty'),
    body('hr_name').optional().notEmpty().withMessage('HR name cannot be empty'),
    body('hr_email').optional().isEmail().withMessage('Please provide a valid HR email'),
    body('city').optional().notEmpty().withMessage('City cannot be empty'),
    body('state').optional().notEmpty().withMessage('State cannot be empty')
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
            name, 
            industry, 
            city, 
            state, 
            pin, 
            contact_no, 
            hr_name, 
            hr_phone, 
            hr_email, 
            website 
        } = req.body;

        // Check if company exists
        const existingCompany = await executeQuery('SELECT comp_id FROM company WHERE comp_id = ? AND is_active = TRUE', [id]);
        if (!existingCompany.success || existingCompany.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if company name is being changed and if it already exists
        if (name) {
            const nameCheck = await executeQuery(
                'SELECT comp_id FROM company WHERE name = ? AND comp_id != ? AND is_active = TRUE',
                [name, id]
            );
            if (nameCheck.success && nameCheck.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Company name already exists'
                });
            }
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (industry !== undefined) {
            updateFields.push('industry = ?');
            updateValues.push(industry);
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
        if (contact_no !== undefined) {
            updateFields.push('contact_no = ?');
            updateValues.push(contact_no);
        }
        if (hr_name !== undefined) {
            updateFields.push('hr_name = ?');
            updateValues.push(hr_name);
        }
        if (hr_phone !== undefined) {
            updateFields.push('hr_phone = ?');
            updateValues.push(hr_phone);
        }
        if (hr_email !== undefined) {
            updateFields.push('hr_email = ?');
            updateValues.push(hr_email);
        }
        if (website !== undefined) {
            updateFields.push('website = ?');
            updateValues.push(website);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const result = await executeQuery(
            `UPDATE company SET ${updateFields.join(', ')} WHERE comp_id = ?`,
            updateValues
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Company updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update company',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating company',
            error: error.message
        });
    }
});

// Delete company (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if company exists
        const existingCompany = await executeQuery('SELECT comp_id FROM company WHERE comp_id = ? AND is_active = TRUE', [id]);
        if (!existingCompany.success || existingCompany.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if company has active jobs
        const activeJobs = await executeQuery(
            'SELECT job_id FROM jobs WHERE comp_id = ? AND status = "Active"',
            [id]
        );

        if (activeJobs.success && activeJobs.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete company with active jobs'
            });
        }

        // Soft delete by setting is_active to false
        const result = await executeQuery('UPDATE company SET is_active = FALSE WHERE comp_id = ?', [id]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Company deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete company',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting company',
            error: error.message
        });
    }
});

// Get company statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsResult = await executeQuery(`
            SELECT 
                industry,
                COUNT(*) as count
            FROM company 
            WHERE is_active = TRUE
            GROUP BY industry
        `);

        if (statsResult.success) {
            const totalCompanies = await executeQuery('SELECT COUNT(*) as total FROM company WHERE is_active = TRUE');
            const total = totalCompanies.success ? totalCompanies.data[0].total : 0;

            res.json({
                success: true,
                data: {
                    total,
                    byIndustry: statsResult.data
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch company statistics',
                error: statsResult.error
            });
        }
    } catch (error) {
        console.error('Get company stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company statistics',
            error: error.message
        });
    }
});

// Get companies for dropdown (simplified data)
router.get('/dropdown/list', async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT comp_id, name FROM company WHERE is_active = TRUE ORDER BY name',
            []
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch companies list',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get companies dropdown error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching companies list',
            error: error.message
        });
    }
});

module.exports = router;