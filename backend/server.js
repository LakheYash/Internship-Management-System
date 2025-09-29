const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

const { testConnection } = require('./database/connection');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const interviewRoutes = require('./routes/interviews');
const skillRoutes = require('./routes/skills');
const studentSkillRoutes = require('./routes/student-skills');
const educationRoutes = require('./routes/education');
const projectRoutes = require('./routes/projects');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const internRoutes = require('./routes/interns');
const internshipRoutes = require('./routes/internships');
const evaluationRoutes = require('./routes/evaluations');
const taskRoutes = require('./routes/tasks');
const studentProfileRoutes = require('./routes/student-profile');
const companyReviewsRoutes = require('./routes/company-reviews');
const storedProceduresRoutes = require('./routes/stored-procedures');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration (allow any localhost origin during development)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        if (allowedOrigins.length && allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/student-skills', studentSkillRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/student-profile', studentProfileRoutes);
app.use('/api/company-reviews', companyReviewsRoutes);
app.use('/api/procedures', storedProceduresRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Internship Management System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            companies: '/api/companies',
            jobs: '/api/jobs',
            applications: '/api/applications',
            interviews: '/api/interviews',
            skills: '/api/skills',
            studentSkills: '/api/student-skills',
            education: '/api/education',
            projects: '/api/projects',
            notifications: '/api/notifications',
            analytics: '/api/analytics',
            interns: '/api/interns',
            internships: '/api/internships',
            evaluations: '/api/evaluations',
            tasks: '/api/tasks',
            studentProfile: '/api/student-profile',
            companyReviews: '/api/company-reviews',
            procedures: '/api/procedures'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.originalUrl} does not exist`
    });
});

// Global error handler (datastore-agnostic)
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    const statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Server Error';

    // Handle common SQL constraint errors
    if (err.code === 'ER_DUP_ENTRY') {
        message = 'Duplicate entry';
    }
    if (err.code === 'ER_BAD_NULL_ERROR') {
        message = 'Missing required field';
    }

    res.status(statusCode).json({
        success: false,
        error: message
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        // Start the server
        app.listen(PORT, () => {
            console.log('🚀 Server is running!');
            console.log(`📡 Server URL: http://localhost:${PORT}`);
            console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();
