// Enhanced Internship Management System - Frontend JavaScript
// Updated to work with the new database structure and analytics

// Global variables
let students = [];
let companies = [];
let jobs = [];
let applications = [];
let interviews = [];
let skills = [];
let studentSkills = [];
let analytics = {};
let currentSection = 'dashboard';

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadDashboardData();
    showSection('dashboard');
}

// Event Listeners
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Form submissions
    document.getElementById('addStudentForm')?.addEventListener('submit', handleAddStudent);
    document.getElementById('addCompanyForm')?.addEventListener('submit', handleAddCompany);
    document.getElementById('addJobForm')?.addEventListener('submit', handleAddJob);
    document.getElementById('addApplicationForm')?.addEventListener('submit', handleAddApplication);
    document.getElementById('addSkillForm')?.addEventListener('submit', handleAddSkill);
    document.getElementById('addStudentSkillForm')?.addEventListener('submit', handleAddStudentSkill);
}

// Section Management
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Remove active class from sidebar items
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionName;
    }

    // Add active class to clicked sidebar item
    const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'students':
            loadStudents();
            break;
        case 'companies':
            loadCompanies();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'applications':
            loadApplications();
            break;
        case 'interviews':
            loadInterviews();
            break;
        case 'skills':
            loadSkills();
            break;
        case 'student-skills':
            loadStudentSkills();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [studentsData, companiesData, jobsData, applicationsData, analyticsData] = await Promise.all([
            fetchData('/students'),
            fetchData('/companies'),
            fetchData('/jobs'),
            fetchData('/applications'),
            fetchData('/analytics/dashboard')
        ]);

        // Update dashboard cards
        document.getElementById('total-students').textContent = studentsData.data?.length || 0;
        document.getElementById('total-companies').textContent = companiesData.data?.length || 0;
        document.getElementById('active-jobs').textContent = 
            jobsData.data?.filter(j => j.status === 'Active').length || 0;
        document.getElementById('total-applications').textContent = applicationsData.data?.length || 0;

        // Store data globally
        students = studentsData.data || [];
        companies = companiesData.data || [];
        jobs = jobsData.data || [];
        applications = applicationsData.data || [];
        analytics = analyticsData.data || {};

        // Update analytics charts
        updateDashboardCharts();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data', 'danger');
    }
}

function updateDashboardCharts() {
    // Update status distribution chart
    if (analytics.overview) {
        createStatusChart(analytics.overview);
    }

    // Update trends chart
    if (analytics.trends) {
        createTrendsChart(analytics.trends);
    }

    // Update skills chart
    if (analytics.topSkills) {
        createSkillsChart(analytics.topSkills);
    }
}

// Students Management
async function loadStudents() {
    try {
        const response = await fetchData('/students');
        students = response.data || [];
        displayStudents(students);
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Error loading students data', 'danger');
    }
}

function displayStudents(studentsData) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    studentsData.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.stud_id}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.email}</td>
            <td>${student.phone || 'N/A'}</td>
            <td>${student.city || 'N/A'}, ${student.state || 'N/A'}</td>
            <td><span class="badge bg-${getStatusColor(student.status)}">${student.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editStudent(${student.stud_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="viewStudentDetails(${student.stud_id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.stud_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleAddStudent(e) {
    e.preventDefault();
    
    const formData = {
        first_name: document.getElementById('studentFirstName').value,
        middle_name: document.getElementById('studentMiddleName').value,
        last_name: document.getElementById('studentLastName').value,
        email: document.getElementById('studentEmail').value,
        phone: document.getElementById('studentPhone').value,
        city: document.getElementById('studentCity').value,
        state: document.getElementById('studentState').value,
        pin: document.getElementById('studentPin').value,
        age: parseInt(document.getElementById('studentAge').value),
        status: document.getElementById('studentStatus').value
    };

    try {
        await postData('/students', formData);
        showAlert('Student added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
        document.getElementById('addStudentForm').reset();
        loadStudents();
        loadDashboardData();
    } catch (error) {
        console.error('Error adding student:', error);
        showAlert('Error adding student', 'danger');
    }
}

async function editStudent(id) {
    const student = students.find(s => s.stud_id === id);
    if (!student) return;

    // Pre-fill form with student data
    document.getElementById('studentFirstName').value = student.first_name;
    document.getElementById('studentMiddleName').value = student.middle_name || '';
    document.getElementById('studentLastName').value = student.last_name;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phone || '';
    document.getElementById('studentCity').value = student.city || '';
    document.getElementById('studentState').value = student.state || '';
    document.getElementById('studentPin').value = student.pin || '';
    document.getElementById('studentAge').value = student.age || '';
    document.getElementById('studentStatus').value = student.status;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    modal.show();

    // Update form to handle edit
    const form = document.getElementById('addStudentForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            await putData(`/students/${id}`, formData);
            showAlert('Student updated successfully!', 'success');
            modal.hide();
            loadStudents();
            loadDashboardData();
        } catch (error) {
            console.error('Error updating student:', error);
            showAlert('Error updating student', 'danger');
        }
    };
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            await deleteData(`/students/${id}`);
            showAlert('Student deleted successfully!', 'success');
            loadStudents();
            loadDashboardData();
        } catch (error) {
            console.error('Error deleting student:', error);
            showAlert('Error deleting student', 'danger');
        }
    }
}

async function viewStudentDetails(id) {
    try {
        const response = await fetchData(`/students/${id}/details`);
        const studentData = response.data;
        
        // Display student details in a modal or dedicated section
        displayStudentDetailsModal(studentData);
    } catch (error) {
        console.error('Error loading student details:', error);
        showAlert('Error loading student details', 'danger');
    }
}

function displayStudentDetailsModal(studentData) {
    // Create and show a detailed modal with student information
    const modalHtml = `
        <div class="modal fade" id="studentDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Student Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Personal Information</h6>
                                <p><strong>Name:</strong> ${studentData.student.first_name} ${studentData.student.last_name}</p>
                                <p><strong>Email:</strong> ${studentData.student.email}</p>
                                <p><strong>Phone:</strong> ${studentData.student.phone || 'N/A'}</p>
                                <p><strong>Location:</strong> ${studentData.student.city}, ${studentData.student.state}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Academic Information</h6>
                                <p><strong>Education:</strong> ${studentData.education.length} records</p>
                                <p><strong>Projects:</strong> ${studentData.projects.length} projects</p>
                                <p><strong>Skills:</strong> ${studentData.skills.length} skills</p>
                                <p><strong>Applications:</strong> ${studentData.applications.length} applications</p>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Skills</h6>
                                <div class="d-flex flex-wrap gap-2">
                                    ${studentData.skills.map(skill => 
                                        `<span class="badge bg-primary">${skill.skill_name} (${skill.proficiency_level})</span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('studentDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('studentDetailsModal'));
    modal.show();
}

// Skills Management
async function loadSkills() {
    try {
        const response = await fetchData('/skills');
        skills = response.data || [];
        displaySkills(skills);
    } catch (error) {
        console.error('Error loading skills:', error);
        showAlert('Error loading skills data', 'danger');
    }
}

function displaySkills(skillsData) {
    const tbody = document.getElementById('skillsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    skillsData.forEach(skill => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${skill.skill_id}</td>
            <td>${skill.skill_name}</td>
            <td><span class="badge bg-secondary">${skill.category}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editSkill(${skill.skill_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSkill(${skill.skill_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleAddSkill(e) {
    e.preventDefault();
    
    const formData = {
        skill_name: document.getElementById('skillName').value,
        category: document.getElementById('skillCategory').value
    };

    try {
        await postData('/skills', formData);
        showAlert('Skill added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addSkillModal')).hide();
        document.getElementById('addSkillForm').reset();
        loadSkills();
    } catch (error) {
        console.error('Error adding skill:', error);
        showAlert('Error adding skill', 'danger');
    }
}

// Student Skills Management
async function loadStudentSkills() {
    try {
        const response = await fetchData('/student-skills');
        studentSkills = response.data || [];
        displayStudentSkills(studentSkills);
    } catch (error) {
        console.error('Error loading student skills:', error);
        showAlert('Error loading student skills data', 'danger');
    }
}

function displayStudentSkills(studentSkillsData) {
    const tbody = document.getElementById('studentSkillsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    studentSkillsData.forEach(studentSkill => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${studentSkill.stud_id}</td>
            <td>${studentSkill.student_name}</td>
            <td>${studentSkill.skill_name}</td>
            <td><span class="badge bg-${getProficiencyColor(studentSkill.proficiency_level)}">${studentSkill.proficiency_level}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-warning" onclick="editStudentSkill(${studentSkill.stud_id}, ${studentSkill.skill_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudentSkill(${studentSkill.stud_id}, ${studentSkill.skill_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleAddStudentSkill(e) {
    e.preventDefault();
    
    const formData = {
        stud_id: parseInt(document.getElementById('studentSkillStudent').value),
        skill_id: parseInt(document.getElementById('studentSkillSkill').value),
        proficiency_level: document.getElementById('studentSkillProficiency').value
    };

    try {
        await postData('/student-skills', formData);
        showAlert('Student skill added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addStudentSkillModal')).hide();
        document.getElementById('addStudentSkillForm').reset();
        loadStudentSkills();
    } catch (error) {
        console.error('Error adding student skill:', error);
        showAlert('Error adding student skill', 'danger');
    }
}

// Analytics Functions
async function loadAnalytics() {
    try {
        const [dashboardData, studentsData, companiesData, skillsData] = await Promise.all([
            fetchData('/analytics/dashboard'),
            fetchData('/analytics/students'),
            fetchData('/analytics/companies'),
            fetchData('/analytics/skills')
        ]);

        analytics = {
            dashboard: dashboardData.data,
            students: studentsData.data,
            companies: companiesData.data,
            skills: skillsData.data
        };

        displayAnalytics(analytics);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showAlert('Error loading analytics data', 'danger');
    }
}

function displayAnalytics(analyticsData) {
    // Display various analytics charts and metrics
    if (analyticsData.dashboard) {
        createDashboardAnalytics(analyticsData.dashboard);
    }
    
    if (analyticsData.students) {
        createStudentAnalytics(analyticsData.students);
    }
    
    if (analyticsData.skills) {
        createSkillAnalytics(analyticsData.skills);
    }
}

function createDashboardAnalytics(data) {
    // Create comprehensive dashboard analytics
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Students', 'Companies', 'Active Jobs', 'Applications', 'Selected Applications', 'Upcoming Interviews'],
            datasets: [{
                label: 'Count',
                data: [
                    data.overview?.total_students || 0,
                    data.overview?.total_companies || 0,
                    data.overview?.active_jobs || 0,
                    data.overview?.total_applications || 0,
                    data.overview?.selected_applications || 0,
                    data.overview?.upcoming_interviews || 0
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Chart Functions
function createStatusChart(data) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const statusCounts = {
        'Available': data.available || 0,
        'Applied': data.applied || 0,
        'Selected': data.selected || 0,
        'Completed': data.completed || 0,
        'Inactive': data.inactive || 0
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#6f42c1', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createTrendsChart(trendsData) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendsData.map(t => t.month),
            datasets: [{
                label: 'Applications',
                data: trendsData.map(t => t.applications),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createSkillsChart(skillsData) {
    const ctx = document.getElementById('skillsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: skillsData.slice(0, 10).map(s => s.skill_name),
            datasets: [{
                label: 'Jobs Requiring Skill',
                data: skillsData.slice(0, 10).map(s => s.jobs_requiring_skill),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// API Helper Functions
async function fetchData(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function postData(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function putData(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function deleteData(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

// Utility Functions
function getStatusColor(status) {
    const colors = {
        'Available': 'success',
        'Applied': 'info',
        'Selected': 'warning',
        'Completed': 'primary',
        'Inactive': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getProficiencyColor(level) {
    const colors = {
        'Beginner': 'danger',
        'Intermediate': 'warning',
        'Advanced': 'info',
        'Expert': 'success'
    };
    return colors[level] || 'secondary';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Global functions for onclick handlers
function addStudent() {
    document.getElementById('addStudentForm').dispatchEvent(new Event('submit'));
}

function addCompany() {
    document.getElementById('addCompanyForm').dispatchEvent(new Event('submit'));
}

function addJob() {
    document.getElementById('addJobForm').dispatchEvent(new Event('submit'));
}

function addSkill() {
    document.getElementById('addSkillForm').dispatchEvent(new Event('submit'));
}

function addStudentSkill() {
    document.getElementById('addStudentSkillForm').dispatchEvent(new Event('submit'));
}
