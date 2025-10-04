const { body, param, query, validationResult } = require('express-validator');

// Custom validation rules
const customValidators = {
    // Password strength validator
    strongPassword: (value) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        if (value.length < minLength) {
            throw new Error('Password must be at least 8 characters long');
        }
        if (!hasUpperCase) {
            throw new Error('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            throw new Error('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            throw new Error('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            throw new Error('Password must contain at least one special character');
        }
        return true;
    },

    // Phone number validator
    phoneNumber: (value) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            throw new Error('Please provide a valid phone number');
        }
        return true;
    },

    // Date validator (must be in the future)
    futureDate: (value) => {
        const date = new Date(value);
        const now = new Date();
        if (date <= now) {
            throw new Error('Date must be in the future');
        }
        return true;
    },

    // Date validator (must be in the past)
    pastDate: (value) => {
        const date = new Date(value);
        const now = new Date();
        if (date >= now) {
            throw new Error('Date must be in the past');
        }
        return true;
    },

    // Salary validator
    salary: (value) => {
        const salary = parseFloat(value);
        if (isNaN(salary) || salary < 0) {
            throw new Error('Salary must be a positive number');
        }
        if (salary > 10000000) {
            throw new Error('Salary seems unreasonably high');
        }
        return true;
    },

    // Age validator
    age: (value) => {
        const age = parseInt(value);
        if (isNaN(age) || age < 16 || age > 100) {
            throw new Error('Age must be between 16 and 100');
        }
        return true;
    },

    // Percentage validator
    percentage: (value) => {
        const percent = parseFloat(value);
        if (isNaN(percent) || percent < 0 || percent > 100) {
            throw new Error('Percentage must be between 0 and 100');
        }
        return true;
    }
};

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value,
            location: error.location
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors,
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

// Student validation rules
const validateStudent = {
    create: [
        body('first_name')
            .notEmpty()
            .withMessage('First name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('First name can only contain letters and spaces'),
        
        body('last_name')
            .notEmpty()
            .withMessage('Last name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Last name can only contain letters and spaces'),
        
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        
        body('phone')
            .optional()
            .custom(customValidators.phoneNumber),
        
        body('age')
            .optional()
            .custom(customValidators.age),
        
        body('city')
            .optional()
            .isLength({ max: 100 })
            .withMessage('City name must be less than 100 characters'),
        
        body('state')
            .optional()
            .isLength({ max: 100 })
            .withMessage('State name must be less than 100 characters'),
        
        body('pin')
            .optional()
            .isLength({ min: 6, max: 10 })
            .withMessage('PIN must be between 6 and 10 characters')
            .isNumeric()
            .withMessage('PIN must contain only numbers'),
        
        body('status')
            .optional()
            .isIn(['Available', 'Applied', 'Selected', 'Completed', 'Inactive'])
            .withMessage('Invalid status value')
    ],

    update: [
        param('id').isInt({ min: 1 }).withMessage('Invalid student ID'),
        
        body('first_name')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('First name can only contain letters and spaces'),
        
        body('last_name')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Last name can only contain letters and spaces'),
        
        body('email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        
        body('phone')
            .optional()
            .custom(customValidators.phoneNumber),
        
        body('age')
            .optional()
            .custom(customValidators.age),
        
        body('status')
            .optional()
            .isIn(['Available', 'Applied', 'Selected', 'Completed', 'Inactive'])
            .withMessage('Invalid status value')
    ]
};

// Company validation rules
const validateCompany = {
    create: [
        body('name')
            .notEmpty()
            .withMessage('Company name is required')
            .isLength({ min: 2, max: 100 })
            .withMessage('Company name must be between 2 and 100 characters'),
        
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        
        body('phone')
            .optional()
            .custom(customValidators.phoneNumber),
        
        body('website')
            .optional()
            .isURL()
            .withMessage('Please provide a valid website URL'),
        
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must be less than 1000 characters'),
        
        body('city')
            .optional()
            .isLength({ max: 100 })
            .withMessage('City name must be less than 100 characters'),
        
        body('state')
            .optional()
            .isLength({ max: 100 })
            .withMessage('State name must be less than 100 characters'),
        
        body('pin')
            .optional()
            .isLength({ min: 6, max: 10 })
            .withMessage('PIN must be between 6 and 10 characters')
            .isNumeric()
            .withMessage('PIN must contain only numbers')
    ]
};

// Job validation rules
const validateJob = {
    create: [
        body('title')
            .notEmpty()
            .withMessage('Job title is required')
            .isLength({ min: 5, max: 100 })
            .withMessage('Job title must be between 5 and 100 characters'),
        
        body('description')
            .notEmpty()
            .withMessage('Job description is required')
            .isLength({ min: 50, max: 2000 })
            .withMessage('Job description must be between 50 and 2000 characters'),
        
        body('requirements')
            .notEmpty()
            .withMessage('Job requirements are required')
            .isLength({ min: 20, max: 1000 })
            .withMessage('Job requirements must be between 20 and 1000 characters'),
        
        body('salary')
            .optional()
            .custom(customValidators.salary),
        
        body('location')
            .notEmpty()
            .withMessage('Job location is required')
            .isLength({ max: 200 })
            .withMessage('Location must be less than 200 characters'),
        
        body('job_type')
            .isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
            .withMessage('Invalid job type'),
        
        body('status')
            .optional()
            .isIn(['Active', 'Inactive', 'Closed'])
            .withMessage('Invalid status value'),
        
        body('application_deadline')
            .optional()
            .isISO8601()
            .withMessage('Invalid date format')
            .custom(customValidators.futureDate)
    ]
};

// Application validation rules
const validateApplication = {
    create: [
        body('stud_id')
            .isInt({ min: 1 })
            .withMessage('Valid student ID is required'),
        
        body('job_id')
            .isInt({ min: 1 })
            .withMessage('Valid job ID is required'),
        
        body('cover_letter')
            .optional()
            .isLength({ max: 2000 })
            .withMessage('Cover letter must be less than 2000 characters'),
        
        body('resume_url')
            .optional()
            .isURL()
            .withMessage('Please provide a valid resume URL'),
        
        body('status')
            .optional()
            .isIn(['Pending', 'Under Review', 'Shortlisted', 'Selected', 'Rejected'])
            .withMessage('Invalid status value')
    ]
};

// Interview validation rules
const validateInterview = {
    create: [
        body('app_id')
            .isInt({ min: 1 })
            .withMessage('Valid application ID is required'),
        
        body('interview_date')
            .isISO8601()
            .withMessage('Invalid date format')
            .custom(customValidators.futureDate),
        
        body('interview_time')
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .withMessage('Invalid time format (HH:MM)'),
        
        body('mode')
            .isIn(['Online', 'Offline', 'Phone'])
            .withMessage('Invalid interview mode'),
        
        body('location')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Location must be less than 200 characters'),
        
        body('interviewer_name')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Interviewer name must be less than 100 characters'),
        
        body('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Notes must be less than 1000 characters')
    ]
};

// Skill validation rules
const validateSkill = {
    create: [
        body('skill_name')
            .notEmpty()
            .withMessage('Skill name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Skill name must be between 2 and 50 characters'),
        
        body('category')
            .notEmpty()
            .withMessage('Skill category is required')
            .isIn(['Technical', 'Soft Skills', 'Language', 'Certification', 'Other'])
            .withMessage('Invalid skill category'),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters')
    ]
};

// Query parameter validation
const validateQuery = {
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        
        query('search')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Search term must be less than 100 characters')
    ]
};

module.exports = {
    customValidators,
    validateRequest,
    validateStudent,
    validateCompany,
    validateJob,
    validateApplication,
    validateInterview,
    validateSkill,
    validateQuery
};
