const redis = require('redis');

// Redis client configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
};

// Create Redis client
let redisClient = null;

const initRedis = async () => {
    try {
        redisClient = redis.createClient(redisConfig);
        
        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis ready for operations');
        });

        await redisClient.connect();
        return true;
    } catch (error) {
        console.error('❌ Redis connection failed:', error.message);
        return false;
    }
};

// Cache middleware
const cache = (duration = 300) => { // Default 5 minutes
    return async (req, res, next) => {
        if (!redisClient || !redisClient.isReady) {
            return next();
        }

        const key = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
        
        try {
            const cachedData = await redisClient.get(key);
            
            if (cachedData) {
                const data = JSON.parse(cachedData);
                return res.json({
                    success: true,
                    data: data,
                    cached: true,
                    cachedAt: new Date().toISOString()
                });
            }
            
            // Store original res.json
            const originalJson = res.json;
            
            res.json = function(data) {
                // Only cache successful responses
                if (data.success !== false) {
                    redisClient.setEx(key, duration, JSON.stringify(data.data || data))
                        .catch(err => console.error('Cache set error:', err));
                }
                
                // Call original res.json
                originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

// Cache invalidation helper
const invalidateCache = async (pattern) => {
    if (!redisClient || !redisClient.isReady) {
        return false;
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Cache invalidated for pattern: ${pattern}`);
        }
        return true;
    } catch (error) {
        console.error('Cache invalidation error:', error);
        return false;
    }
};

// Cache invalidation middleware
const invalidateCacheMiddleware = (patterns = []) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        
        res.json = function(data) {
            // Only invalidate on successful operations
            if (data.success !== false && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                patterns.forEach(pattern => {
                    invalidateCache(pattern).catch(err => 
                        console.error(`Cache invalidation failed for pattern ${pattern}:`, err)
                    );
                });
            }
            
            originalJson.call(this, data);
        };
        
        next();
    };
};

// Session storage using Redis
const sessionStorage = {
    async set(sessionId, data, ttl = 86400) { // Default 24 hours
        if (!redisClient || !redisClient.isReady) {
            return false;
        }

        try {
            await redisClient.setEx(`session:${sessionId}`, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Session set error:', error);
            return false;
        }
    },

    async get(sessionId) {
        if (!redisClient || !redisClient.isReady) {
            return null;
        }

        try {
            const data = await redisClient.get(`session:${sessionId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Session get error:', error);
            return null;
        }
    },

    async delete(sessionId) {
        if (!redisClient || !redisClient.isReady) {
            return false;
        }

        try {
            await redisClient.del(`session:${sessionId}`);
            return true;
        } catch (error) {
            console.error('Session delete error:', error);
            return false;
        }
    },

    async extend(sessionId, ttl = 86400) {
        if (!redisClient || !redisClient.isReady) {
            return false;
        }

        try {
            await redisClient.expire(`session:${sessionId}`, ttl);
            return true;
        } catch (error) {
            console.error('Session extend error:', error);
            return false;
        }
    }
};

// Rate limiting using Redis
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return async (req, res, next) => {
        if (!redisClient || !redisClient.isReady) {
            return next();
        }

        const key = `rate_limit:${req.ip}`;
        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            // Get current requests
            const requests = await redisClient.get(key);
            let requestTimes = requests ? JSON.parse(requests) : [];

            // Filter out old requests
            requestTimes = requestTimes.filter(time => time > windowStart);

            // Check if limit exceeded
            if (requestTimes.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil((requestTimes[0] + windowMs - now) / 1000)
                });
            }

            // Add current request
            requestTimes.push(now);

            // Store updated requests
            await redisClient.setEx(key, Math.ceil(windowMs / 1000), JSON.stringify(requestTimes));

            next();
        } catch (error) {
            console.error('Rate limit error:', error);
            next();
        }
    };
};

// Close Redis connection
const closeRedis = async () => {
    if (redisClient) {
        try {
            await redisClient.quit();
            console.log('Redis connection closed');
        } catch (error) {
            console.error('Error closing Redis connection:', error);
        }
    }
};

module.exports = {
    initRedis,
    cache,
    invalidateCache,
    invalidateCacheMiddleware,
    sessionStorage,
    rateLimit,
    closeRedis,
    redisClient: () => redisClient
};
