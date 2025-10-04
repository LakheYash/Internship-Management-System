const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Internship Management System API',
            version: '1.0.0',
            description: 'A comprehensive API for managing internships, students, companies, and applications',
            contact: {
                name: 'API Support',
                email: 'support@internshipmanagement.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Student: {
                    type: 'object',
                    required: ['first_name', 'last_name', 'email'],
                    properties: {
                        stud_id: {
                            type: 'integer',
                            description: 'Student ID'
                        },
                        first_name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            description: 'Student first name'
                        },
                        middle_name: {
                            type: 'string',
                            maxLength: 50,
                            description: 'Student middle name'
                        },
                        last_name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            description: 'Student last name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Student email address'
                        },
                        phone: {
                            type: 'string',
                            description: 'Student phone number'
                        },
                        age: {
                            type: 'integer',
                            minimum: 16,
                            maximum: 100,
                            description: 'Student age'
                        },
                        city: {
                            type: 'string',
                            maxLength: 100,
                            description: 'Student city'
                        },
                        state: {
                            type: 'string',
                            maxLength: 100,
                            description: 'Student state'
                        },
                        pin: {
                            type: 'string',
                            minLength: 6,
                            maxLength: 10,
                            description: 'Student PIN code'
                        },
                        status: {
                            type: 'string',
                            enum: ['Available', 'Applied', 'Selected', 'Completed', 'Inactive'],
                            description: 'Student status'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation timestamp'
                        }
                    }
                },
                Company: {
                    type: 'object',
                    required: ['name', 'email'],
                    properties: {
                        comp_id: {
                            type: 'integer',
                            description: 'Company ID'
                        },
                        name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 100,
                            description: 'Company name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Company email address'
                        },
                        phone: {
                            type: 'string',
                            description: 'Company phone number'
                        },
                        website: {
                            type: 'string',
                            format: 'uri',
                            description: 'Company website'
                        },
                        description: {
                            type: 'string',
                            maxLength: 1000,
                            description: 'Company description'
                        },
                        city: {
                            type: 'string',
                            maxLength: 100,
                            description: 'Company city'
                        },
                        state: {
                            type: 'string',
                            maxLength: 100,
                            description: 'Company state'
                        },
                        pin: {
                            type: 'string',
                            minLength: 6,
                            maxLength: 10,
                            description: 'Company PIN code'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation timestamp'
                        }
                    }
                },
                Job: {
                    type: 'object',
                    required: ['title', 'description', 'requirements', 'location', 'job_type'],
                    properties: {
                        job_id: {
                            type: 'integer',
                            description: 'Job ID'
                        },
                        comp_id: {
                            type: 'integer',
                            description: 'Company ID'
                        },
                        title: {
                            type: 'string',
                            minLength: 5,
                            maxLength: 100,
                            description: 'Job title'
                        },
                        description: {
                            type: 'string',
                            minLength: 50,
                            maxLength: 2000,
                            description: 'Job description'
                        },
                        requirements: {
                            type: 'string',
                            minLength: 20,
                            maxLength: 1000,
                            description: 'Job requirements'
                        },
                        salary: {
                            type: 'number',
                            minimum: 0,
                            description: 'Job salary'
                        },
                        location: {
                            type: 'string',
                            maxLength: 200,
                            description: 'Job location'
                        },
                        job_type: {
                            type: 'string',
                            enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
                            description: 'Job type'
                        },
                        status: {
                            type: 'string',
                            enum: ['Active', 'Inactive', 'Closed'],
                            description: 'Job status'
                        },
                        application_deadline: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Application deadline'
                        },
                        posted_date: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Posted date'
                        }
                    }
                },
                Application: {
                    type: 'object',
                    required: ['stud_id', 'job_id'],
                    properties: {
                        app_id: {
                            type: 'integer',
                            description: 'Application ID'
                        },
                        stud_id: {
                            type: 'integer',
                            description: 'Student ID'
                        },
                        job_id: {
                            type: 'integer',
                            description: 'Job ID'
                        },
                        cover_letter: {
                            type: 'string',
                            maxLength: 2000,
                            description: 'Cover letter'
                        },
                        resume_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Resume URL'
                        },
                        status: {
                            type: 'string',
                            enum: ['Pending', 'Under Review', 'Shortlisted', 'Selected', 'Rejected'],
                            description: 'Application status'
                        },
                        application_date: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Application date'
                        }
                    }
                },
                Interview: {
                    type: 'object',
                    required: ['app_id', 'interview_date', 'interview_time', 'mode'],
                    properties: {
                        interview_id: {
                            type: 'integer',
                            description: 'Interview ID'
                        },
                        app_id: {
                            type: 'integer',
                            description: 'Application ID'
                        },
                        interview_date: {
                            type: 'string',
                            format: 'date',
                            description: 'Interview date'
                        },
                        interview_time: {
                            type: 'string',
                            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                            description: 'Interview time (HH:MM)'
                        },
                        mode: {
                            type: 'string',
                            enum: ['Online', 'Offline', 'Phone'],
                            description: 'Interview mode'
                        },
                        location: {
                            type: 'string',
                            maxLength: 200,
                            description: 'Interview location'
                        },
                        interviewer_name: {
                            type: 'string',
                            maxLength: 100,
                            description: 'Interviewer name'
                        },
                        notes: {
                            type: 'string',
                            maxLength: 1000,
                            description: 'Interview notes'
                        },
                        status: {
                            type: 'string',
                            enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
                            description: 'Interview status'
                        },
                        score: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            description: 'Interview score'
                        }
                    }
                },
                Skill: {
                    type: 'object',
                    required: ['skill_name', 'category'],
                    properties: {
                        skill_id: {
                            type: 'integer',
                            description: 'Skill ID'
                        },
                        skill_name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            description: 'Skill name'
                        },
                        category: {
                            type: 'string',
                            enum: ['Technical', 'Soft Skills', 'Language', 'Certification', 'Other'],
                            description: 'Skill category'
                        },
                        description: {
                            type: 'string',
                            maxLength: 500,
                            description: 'Skill description'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        },
                        code: {
                            type: 'string',
                            description: 'Error code'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string'
                                    },
                                    message: {
                                        type: 'string'
                                    }
                                }
                            }
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            description: 'Success message'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js'] // Path to the API files
};

// Generate Swagger documentation
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Internship Management API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
    }
};

module.exports = {
    swaggerSpec,
    swaggerUi,
    swaggerUiOptions
};
