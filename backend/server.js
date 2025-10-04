const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config({ path: './config.env' });

const { testConnection } = require('./database/connection');
const { initRedis } = require('./middleware/cache');
const { initEmailService } = require('./services/emailService');
const { logger, errorHandler, requestLogger, securityHeaders, notFoundHandler } = require('./middleware/errorHandler');
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');

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

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Security headers
app.use(securityHeaders);

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
} else {
    app.use(requestLogger);
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for better user experience
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
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

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

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
        success: true,
        message: 'Internship Management System API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
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
        },
        features: [
            'JWT Authentication',
            'Role-based Authorization',
            'File Upload Support',
            'Email Notifications',
            'Redis Caching',
            'Comprehensive Validation',
            'API Documentation',
            'Error Handling',
            'Request Logging',
            'Rate Limiting'
        ]
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            logger.error('Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        // Initialize Redis (optional)
        const redisConnected = await initRedis();
        if (!redisConnected) {
            logger.warn('Redis not available. Caching will be disabled.');
        }

        // Initialize email service (optional)
        const emailInitialized = await initEmailService();
        if (!emailInitialized) {
            logger.warn('Email service not available. Notifications will be disabled.');
        }

        // Start the server
        app.listen(PORT, () => {
            logger.info('🚀 Server is running!', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                features: {
                    database: dbConnected,
                    redis: redisConnected,
                    email: emailInitialized
                }
            });
            
            console.log('🚀 Server is running!');
            console.log(`📡 Server URL: http://localhost:${PORT}`);
            console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
            console.log(`🔴 Redis: ${redisConnected ? '✅ Connected' : '❌ Not Available'}`);
            console.log(`📧 Email: ${emailInitialized ? '✅ Configured' : '❌ Not Configured'}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', err);
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    console.log(`${signal} received. Shutting down gracefully...`);
    
    try {
        // Close Redis connection if available
        const { closeRedis } = require('./middleware/cache');
        await closeRedis();
        
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();
