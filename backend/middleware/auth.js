const jwt = require('jsonwebtoken');
const { executeQuery } = require('../database/connection');

// Enhanced JWT authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required',
            code: 'MISSING_TOKEN'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', async (err, decoded) => {
        if (err) {
            let message = 'Invalid token';
            let code = 'INVALID_TOKEN';
            
            if (err.name === 'TokenExpiredError') {
                message = 'Token has expired';
                code = 'TOKEN_EXPIRED';
            } else if (err.name === 'JsonWebTokenError') {
                message = 'Malformed token';
                code = 'MALFORMED_TOKEN';
            }

            return res.status(403).json({
                success: false,
                message,
                code
            });
        }

        // Verify user still exists and is active
        try {
            const userResult = await executeQuery(
                'SELECT admin_id, name, email, role, is_active FROM admin WHERE admin_id = ?',
                [decoded.userId]
            );

            if (!userResult.success || userResult.data.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const user = userResult.data[0];
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }

            req.user = {
                userId: user.admin_id,
                username: user.name,
                email: user.email,
                role: user.role,
                ...decoded
            };
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication verification failed',
                code: 'AUTH_VERIFICATION_FAILED'
            });
        }
    });
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTHENTICATION_REQUIRED'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', async (err, decoded) => {
        if (err) {
            req.user = null;
            return next();
        }

        try {
            const userResult = await executeQuery(
                'SELECT admin_id, name, email, role, is_active FROM admin WHERE admin_id = ?',
                [decoded.userId]
            );

            if (userResult.success && userResult.data.length > 0) {
                const user = userResult.data[0];
                if (user.is_active) {
                    req.user = {
                        userId: user.admin_id,
                        username: user.name,
                        email: user.email,
                        role: user.role,
                        ...decoded
                    };
                }
            }
        } catch (error) {
            console.error('Optional auth error:', error);
        }

        next();
    });
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.userId;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        if (requests.has(userId)) {
            const userRequests = requests.get(userId).filter(time => time > windowStart);
            requests.set(userId, userRequests);
        } else {
            requests.set(userId, []);
        }

        const userRequests = requests.get(userId);
        
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
            });
        }

        userRequests.push(now);
        next();
    };
};

module.exports = {
    authenticateToken,
    authorize,
    optionalAuth,
    userRateLimit
};
