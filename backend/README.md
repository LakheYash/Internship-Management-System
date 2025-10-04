# Internship Management System - Backend API

A comprehensive Node.js backend API for managing internships, students, companies, and applications with advanced features and enterprise-grade architecture.

## 🚀 Features

### Core Features
- **JWT Authentication** with role-based access control
- **Comprehensive Validation** with express-validator
- **Advanced Error Handling** with custom error classes
- **API Documentation** with Swagger/OpenAPI
- **Redis Caching** for improved performance
- **File Upload Support** for resumes and documents
- **Email Notifications** for applications and interviews
- **Request Logging** with Winston
- **Rate Limiting** for API protection
- **Security Headers** with Helmet

### Database Features
- **MySQL Integration** with connection pooling
- **Complex Queries** with views and stored procedures
- **Data Validation** at database level
- **Transaction Support** for data integrity

### Advanced Features
- **Bulk Operations** for data management
- **Advanced Search** with filtering and pagination
- **Analytics Dashboard** with comprehensive metrics
- **File Management** with automatic cleanup
- **Session Management** with Redis
- **Graceful Shutdown** handling

## 📋 Prerequisites

- Node.js >= 14.0.0
- MySQL >= 5.7
- Redis >= 6.0 (optional)
- SMTP Server (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd InternshipManagementSystem/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Run the database setup scripts
   mysql -u root -p < ../database/setup.sql
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=Internship_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:8000,http://localhost:3000

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 📚 API Documentation

### Swagger Documentation
Access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

#### Students
- `GET /api/students` - Get all students (with filtering)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats/overview` - Get student statistics
- `GET /api/students/:id/details` - Get student with related data

#### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

#### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

#### Applications
- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get application by ID
- `POST /api/applications` - Create new application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

#### Interviews
- `GET /api/interviews` - Get all interviews
- `GET /api/interviews/:id` - Get interview by ID
- `POST /api/interviews` - Schedule interview
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Cancel interview

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/students` - Student analytics
- `GET /api/analytics/companies` - Company analytics
- `GET /api/analytics/jobs` - Job analytics
- `GET /api/analytics/interviews` - Interview analytics
- `GET /api/analytics/skills` - Skill analytics

## 🔐 Authentication

### JWT Token Structure
```json
{
  "userId": 1,
  "username": "admin",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role-Based Access Control
- **super_admin**: Full system access
- **admin**: Administrative access
- **manager**: Management access

### Authorization Headers
```http
Authorization: Bearer <jwt_token>
```

## 📁 Project Structure

```
backend/
├── config/
│   └── swagger.js          # Swagger configuration
├── database/
│   ├── connection.js        # Database connection
│   └── schema.sql          # Database schema
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── cache.js            # Redis caching middleware
│   ├── errorHandler.js     # Error handling middleware
│   ├── upload.js           # File upload middleware
│   └── validation.js       # Validation middleware
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── students.js         # Student routes
│   ├── companies.js        # Company routes
│   ├── jobs.js             # Job routes
│   ├── applications.js     # Application routes
│   ├── interviews.js       # Interview routes
│   ├── analytics.js        # Analytics routes
│   └── ...                 # Other route files
├── services/
│   └── emailService.js     # Email notification service
├── uploads/                # File upload directory
├── logs/                   # Application logs
├── config.env              # Environment configuration
├── package.json            # Dependencies
└── server.js               # Main server file
```

## 🚀 Advanced Features

### Caching
- **Redis Integration** for session storage and API caching
- **Automatic Cache Invalidation** on data updates
- **Configurable Cache Duration** per endpoint

### File Upload
- **Multiple File Types** support (PDF, DOC, images)
- **File Size Validation** with configurable limits
- **Automatic File Cleanup** for temporary files
- **Secure File Storage** with UUID naming

### Email Notifications
- **Template-based Emails** for different scenarios
- **Bulk Email Support** for notifications
- **SMTP Configuration** with multiple providers
- **Email Queue Management** for reliability

### Error Handling
- **Custom Error Classes** for different error types
- **Structured Error Responses** with error codes
- **Comprehensive Logging** with Winston
- **Error Recovery** mechanisms

### Security
- **Helmet Security Headers** for protection
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **SQL Injection Protection** with parameterized queries

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/                   # Unit tests
├── integration/            # Integration tests
├── fixtures/               # Test data
└── helpers/                # Test utilities
```

## 📊 Monitoring and Logging

### Logging Levels
- **Error**: System errors and exceptions
- **Warn**: Warning messages
- **Info**: General information
- **Debug**: Debug information

### Log Files
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs
- Console output for development

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "uptime": 3600
}
```

## 🔧 Development

### Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run test       # Run tests
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Code Style
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables
- [ ] Configure SSL certificates
- [ ] Set up reverse proxy (Nginx)
- [ ] Configure Redis server
- [ ] Set up email service
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Run database migrations
- [ ] Test all endpoints

### Docker Deployment
```bash
# Build Docker image
docker build -t internship-api .

# Run container
docker run -p 3000:3000 --env-file .env internship-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### Version 1.0.0
- Initial release with core features
- JWT authentication
- CRUD operations for all entities
- File upload support
- Email notifications
- Redis caching
- API documentation
- Comprehensive error handling
