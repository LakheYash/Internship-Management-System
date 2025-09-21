# Quick Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Git

## Quick Start

### 1. Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE Internship_db;"

# Import schema
mysql -u root -p Internship_db < backend/database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
# Update config.env with your MySQL credentials
npm start
```

### 3. Frontend Setup
```bash
cd frontend
# Open index.html in browser or serve with:
python -m http.server 8000
```

### 4. Access
- Frontend: http://localhost:8000
- Backend API: http://localhost:3000
- Default login: admin / password

## Configuration

Update `backend/config.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=Internship_db
DB_PORT=3306
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here
```

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check credentials in config.env
- Verify database exists

### Port Issues
- Change PORT in config.env if 3000 is occupied
- Update API_BASE_URL in frontend/js/app.js if needed

### CORS Issues
- Update CORS_ORIGIN in config.env
- Ensure frontend and backend are on correct ports
