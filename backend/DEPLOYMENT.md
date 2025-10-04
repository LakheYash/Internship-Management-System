# Deployment Guide - Internship Management System Backend

This guide covers deploying the Internship Management System backend API to production environments.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- MySQL >= 5.7
- Redis >= 6.0 (optional)
- PM2 (for process management)
- Nginx (for reverse proxy)

### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd InternshipManagementSystem/backend

# Install dependencies
npm install --production

# Copy environment configuration
cp config.env.example config.env
```

### 2. Environment Configuration

Update `config.env` with production values:

```env
# Database Configuration
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-secure-password
DB_NAME=Internship_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production
API_BASE_URL=https://your-domain.com

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Database Setup

```bash
# Create production database
mysql -u root -p -e "CREATE DATABASE Internship_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p Internship_db < ../database/schema.sql

# Import views and procedures
mysql -u root -p Internship_db < ../database/views_and_queries.sql

# Import stored procedures
mysql -u root -p Internship_db < ../database/stored_procedures.sql
```

### 4. File Permissions

```bash
# Create upload directories
mkdir -p uploads/{resumes,documents,images,temp}
mkdir -p logs

# Set proper permissions
chmod 755 uploads
chmod 755 logs
chown -R www-data:www-data uploads logs
```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: Internship_db
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

## 🔧 PM2 Deployment

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Create PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'internship-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 3. Deploy with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor application
pm2 monit

# View logs
pm2 logs internship-api

# Restart application
pm2 restart internship-api

# Stop application
pm2 stop internship-api
```

## 🌐 Nginx Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/internship-api`:

```nginx
upstream internship_api {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # File Upload Size
    client_max_body_size 10M;

    # API Routes
    location /api/ {
        proxy_pass http://internship_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API Documentation
    location /api-docs {
        proxy_pass http://internship_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://internship_api;
        access_log off;
    }

    # Static Files
    location /uploads/ {
        alias /path/to/your/app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### Enable Nginx Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/internship-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔒 SSL Certificate Setup

### Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Self-Signed Certificate (Development)

```bash
# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate
openssl req -new -x509 -key key.pem -out cert.pem -days 365

# Move to Nginx directory
sudo mv cert.pem key.pem /etc/nginx/ssl/
```

## 📊 Monitoring and Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. System Monitoring

```bash
# Install system monitoring
sudo apt install htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs
```

### 3. Log Management

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/internship-api

# Add configuration:
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🚨 Backup Strategy

### 1. Database Backup

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="Internship_db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u root -p$MYSQL_ROOT_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
```

### 2. File Backup

```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/files"
APP_DIR="/path/to/your/app"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads and logs
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C $APP_DIR uploads logs

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +30 -delete

echo "File backup completed: files_$DATE.tar.gz"
```

### 3. Automated Backups

```bash
# Add to crontab
crontab -e

# Add backup schedules:
0 2 * * * /path/to/backup-database.sh
0 3 * * * /path/to/backup-files.sh
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/your/app
          git pull origin main
          npm ci --production
          pm2 restart internship-api
```

## 🚀 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_applications_student ON application(stud_id);
CREATE INDEX idx_applications_job ON application(job_id);
CREATE INDEX idx_jobs_company ON jobs(comp_id);
CREATE INDEX idx_jobs_status ON jobs(status);

-- Optimize queries
EXPLAIN SELECT * FROM students WHERE status = 'Available';
```

### 2. Application Optimization

```javascript
// Enable compression
app.use(compression());

// Optimize JSON parsing
app.use(express.json({ limit: '10mb' }));

// Enable HTTP/2
const http2 = require('http2');
const server = http2.createServer(options, app);
```

### 3. Caching Strategy

```javascript
// Redis caching for frequently accessed data
const cache = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        const cached = await redis.get(key);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Cache response
        res.json = function(data) {
            redis.setex(key, duration, JSON.stringify(data));
            res.json(data);
        };
        
        next();
    };
};
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   
   # Check connection
   mysql -u root -p -e "SELECT 1"
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Check PM2 memory usage
   pm2 monit
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   sudo netstat -tlnp | grep :3000
   
   # Kill process using port
   sudo kill -9 $(lsof -t -i:3000)
   ```

### Log Analysis

```bash
# View application logs
pm2 logs internship-api

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u nginx -f
```

## 📈 Scaling

### Horizontal Scaling

1. **Load Balancer Setup**
   ```nginx
   upstream internship_api {
       server 127.0.0.1:3000;
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
       server 127.0.0.1:3003;
   }
   ```

2. **Database Scaling**
   ```sql
   -- Read replicas for read-heavy operations
   -- Master-slave replication setup
   ```

3. **Redis Cluster**
   ```bash
   # Setup Redis cluster for high availability
   redis-cli --cluster create node1:7000 node2:7000 node3:7000
   ```

### Vertical Scaling

1. **Increase Server Resources**
   - CPU: 4+ cores
   - RAM: 8+ GB
   - Storage: SSD with 100+ GB

2. **Optimize Application**
   - Increase PM2 instances
   - Enable clustering
   - Optimize database queries

## ✅ Production Checklist

- [ ] Environment variables configured
- [ ] Database setup and optimized
- [ ] SSL certificates installed
- [ ] Nginx configured and tested
- [ ] PM2 process management setup
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error handling tested
- [ ] Performance optimized
- [ ] CI/CD pipeline configured
- [ ] Documentation updated
- [ ] Team trained on deployment process

## 🆘 Support

For deployment issues:
1. Check logs for error messages
2. Verify environment configuration
3. Test database connectivity
4. Check system resources
5. Contact development team

---

**Note**: This guide assumes a Linux-based production environment. Adjust commands and paths for your specific operating system and setup.
