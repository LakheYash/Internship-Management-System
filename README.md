# Internship Management System

A comprehensive web-based internship management portal built with HTML, CSS, JavaScript, Node.js, Express, and MySQL. This system allows educational institutions and organizations to manage internships, track intern progress, and maintain detailed records of the internship program.

## Features

### 🎯 Core Features
- **Dashboard**: Real-time overview of internships, interns, and companies
- **Intern Management**: Add, edit, delete, and track intern information
- **Company Management**: Manage partner companies and their details
- **Internship Management**: Create and track internship assignments
- **Evaluation System**: Rate intern performance across multiple criteria
- **Task Management**: Assign and track tasks for interns
- **Notification System**: Keep users informed about important updates
- **Reports & Analytics**: Generate insights and statistics

### 🔧 Technical Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Built with Bootstrap 5 and custom CSS
- **RESTful API**: Clean and well-documented API endpoints
- **Database Integration**: MySQL with proper relationships and constraints
- **Authentication**: JWT-based user authentication
- **Data Validation**: Server-side validation for all inputs
- **Error Handling**: Comprehensive error handling and logging

## Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Custom styling with CSS variables and animations
- **JavaScript (ES6+)**: Modern JavaScript with async/await
- **Bootstrap 5**: Responsive UI framework
- **Chart.js**: Data visualization for reports
- **Font Awesome**: Icons and visual elements

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MySQL2**: MySQL database driver
- **JWT**: JSON Web Token authentication
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security middleware

### Database
- **MySQL**: Relational database management system
- **Database Name**: `Internship_db`

#### API resource ↔ Database table mapping
To match the ERD and the implemented schema, some API resource names differ from the underlying database table names. Use this mapping when writing queries or debugging:

- `interns` (API) ↔ `students` (DB)
- `companies` (API) ↔ `company` (DB)
- `internships` (API) ↔ `jobs` (DB)
- `users/auth` (API) ↔ `admin` (DB)
- `applications` (API) ↔ `application` (DB)
- `interviews` (API) ↔ `interview` (DB)
- `notifications` (API) ↔ `notifications` (DB)
- `skills` (API) ↔ `skills` (DB)
- `student-skills` (API) ↔ `student_skills` (DB)

## Project Structure

```
InternshipManagementSystem/
├── frontend/
│   ├── css/
│   │   └── style.css          # Custom CSS styles
│   ├── js/
│   │   └── app.js             # Frontend JavaScript
│   ├── images/                # Image assets
│   └── index.html             # Main HTML file
├── backend/
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── interns.js         # Intern management routes
│   │   ├── companies.js       # Company management routes
│   │   ├── internships.js     # Internship management routes
│   │   ├── evaluations.js     # Evaluation routes
│   │   ├── tasks.js           # Task management routes
│   │   └── notifications.js   # Notification routes
│   ├── database/
│   │   ├── connection.js      # Database connection setup
│   │   └── schema.sql         # Database schema and sample data
│   ├── config.env             # Environment configuration
│   ├── package.json           # Backend dependencies
│   └── server.js              # Main server file
└── README.md                  # This file
```

## Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MySQL** (v8.0 or higher)
- **Git** (for cloning the repository)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd InternshipManagementSystem
```

### Step 2: Database Setup
1. **Install MySQL** if not already installed
2. **Create the database**:
   ```sql
   CREATE DATABASE Internship_db;
   ```
3. **Import the schema** (primary schema file with tables and sample data):
   ```bash
   mysql -u root -p Internship_db < backend/database/schema.sql
   ```
   Optionally apply additional enhancements (views, triggers, procedures, extra tables):
   ```bash
   mysql -u root -p Internship_db < database/enhanced_schema.sql
   ```

### Step 3: Backend Setup
1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `config.env` and update the database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=Internship_db
   DB_PORT=3306
   PORT=3000
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Start the backend server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Step 4: Frontend Setup
1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Open the application**:
   - Simply open `index.html` in a web browser
   - Or serve it using a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```

3. **Access the application**:
   - Frontend: `http://localhost:8000` (or your chosen port)
   - Backend API: `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

### Intern Management
- `GET /interns` - Get all interns (backed by `students` table)
- `GET /interns/:id` - Get intern by ID
- `POST /interns` - Create new intern
- `PUT /interns/:id` - Update intern
- `DELETE /interns/:id` - Delete intern
- `GET /interns/stats/overview` - Get intern statistics

### Company Management
- `GET /companies` - Get all companies (backed by `company` table)
- `GET /companies/:id` - Get company by ID
- `POST /companies` - Create new company
- `PUT /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company
- `GET /companies/stats/overview` - Get company statistics
- `GET /companies/dropdown/list` - Get companies for dropdown

### Internship Management
- `GET /internships` - Get all internships (backed by `jobs` table)
- `GET /internships/:id` - Get internship by ID
- `POST /internships` - Create new internship
- `PUT /internships/:id` - Update internship
- `DELETE /internships/:id` - Delete internship
- `GET /internships/stats/overview` - Get internship statistics
- `GET /internships/company/:companyId` - Get internships by company

### Evaluation Management
- `GET /evaluations` - Get all evaluations
- `GET /evaluations/:id` - Get evaluation by ID
- `POST /evaluations` - Create new evaluation
- `PUT /evaluations/:id` - Update evaluation
- `DELETE /evaluations/:id` - Delete evaluation
- `GET /evaluations/internship/:internshipId/stats` - Get evaluation statistics

### Task Management
- `GET /tasks` - Get all tasks
- `GET /tasks/:id` - Get task by ID
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `GET /tasks/internship/:internshipId` - Get tasks by internship
- `GET /tasks/stats/overview` - Get task statistics

### Notification Management
- `GET /notifications` - Get all notifications
- `GET /notifications/:id` - Get notification by ID
- `POST /notifications` - Create new notification
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/user/:userId/read-all` - Mark all notifications as read
- `DELETE /notifications/:id` - Delete notification
- `GET /notifications/user/:userId/unread-count` - Get unread count
- `GET /notifications/user/:userId` - Get notifications for user

## Default Login Credentials

The system comes with a default admin user:
- **Username**: `admin`
- **Email**: `admin@internship.com`
- **Password**: `password`

> **Note**: Please change the default password after first login for security.

## Sample Data

The database includes sample data for:
- 5 partner companies (`company`) across different industries
- 5 sample students (`students`) with various backgrounds
- 5 sample jobs (`jobs`) representing internships
- Default admin user (`admin`)

## Features in Detail

### Dashboard
- Real-time statistics cards showing total interns, active internships, partner companies, and completed internships
- Interactive charts showing internship status distribution and monthly trends
- Quick access to all major functions

### Intern Management
- Complete CRUD operations for intern records
- Search and filter functionality
- Status tracking (Available, Assigned, Completed, Inactive)
- University and major information tracking
- Skills and GPA tracking

### Company Management
- Partner company database
- Industry categorization
- Contact information management
- Company-internship relationship tracking

### Internship Management
- Full internship lifecycle management
- Company-intern matching
- Date and duration tracking
- Status management (Active, Completed, Cancelled, On Hold)
- Supervisor information tracking

### Evaluation System
- Multi-criteria evaluation (technical skills, communication, teamwork, punctuality)
- 1-5 rating scale
- Comments and feedback
- Multiple evaluator types (supervisor, intern, admin)

### Task Management
- Task assignment and tracking
- Priority levels (Low, Medium, High, Critical)
- Status tracking (Pending, In Progress, Completed, Overdue)
- Due date management

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: API rate limiting to prevent abuse
- **Helmet Security**: Security headers and protection

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Future Enhancements

- Email notifications
- File upload for resumes and documents
- Advanced reporting and analytics
- Mobile app development
- Integration with external systems
- Advanced search and filtering
- Bulk operations
- Data export functionality
