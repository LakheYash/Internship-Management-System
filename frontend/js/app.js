// Internship Management System - Frontend JavaScript

// Global variables
let students = [];
let companies = [];
let jobs = [];
let applications = [];
let interviews = [];
let skills = [];
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
        case 'reports':
            loadReports();
            break;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [studentsStats, companiesStats, jobsStats, applicationsStats, studentsData, companiesData, jobsData, applicationsData] = await Promise.all([
            fetchData('/students/stats/overview'),
            fetchData('/companies/stats/overview'),
            fetchData('/jobs/stats/overview'),
            fetchData('/applications/stats/overview'),
            fetchData('/students?limit=1000'),
            fetchData('/companies?limit=1000'),
            fetchData('/jobs?limit=1000'),
            fetchData('/applications?limit=1000')
        ]);

        const totalStudents = studentsStats?.total ?? (studentsData || []).length ?? 0;
        const totalCompanies = companiesStats?.total ?? (companiesData || []).length ?? 0;
        const activeJobs = (jobsStats?.byStatus && jobsStats.byStatus['Active']) ? jobsStats.byStatus['Active'] : ((jobsData || []).filter(j => j.status === 'Active').length);
        const totalApplications = applicationsStats?.total ?? (applicationsData || []).length ?? 0;

        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('total-companies').textContent = totalCompanies;
        document.getElementById('active-jobs').textContent = activeJobs;
        document.getElementById('total-applications').textContent = totalApplications;

        students = studentsData || [];
        companies = companiesData || [];
        jobs = jobsData || [];
        applications = applicationsData || [];

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data', 'danger');
    }
}

// Students Management
async function loadStudents() {
    try {
        const data = await fetchData('/students?limit=1000');
        students = data;
        displayStudents(data);
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Error loading students data', 'danger');
    }
}

function displayStudents(studentsData) {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';

    studentsData.forEach(s => {
        const row = document.createElement('tr');
        const fullName = [s.first_name, s.last_name].filter(Boolean).join(' ');
        row.innerHTML = `
            <td>${s.stud_id}</td>
            <td>${fullName}</td>
            <td>${s.email || ''}</td>
            <td>${s.phone || ''}</td>
            <td>${s.city || ''}</td>
            <td>${s.state || ''}</td>
            <td><span class="badge bg-secondary">${s.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editStudent(${s.stud_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.stud_id})">
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
        last_name: document.getElementById('studentLastName').value,
        email: document.getElementById('studentEmail').value,
        phone: document.getElementById('studentPhone').value,
        city: document.getElementById('studentCity').value,
        state: document.getElementById('studentState').value,
        age: document.getElementById('studentAge').value ? parseInt(document.getElementById('studentAge').value) : null,
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

    document.getElementById('studentFirstName').value = student.first_name || '';
    document.getElementById('studentLastName').value = student.last_name || '';
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentPhone').value = student.phone || '';
    document.getElementById('studentCity').value = student.city || '';
    document.getElementById('studentState').value = student.state || '';
    document.getElementById('studentAge').value = student.age || '';
    document.getElementById('studentStatus').value = student.status || 'Available';

    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    modal.show();

    const form = document.getElementById('addStudentForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const updateData = {
            first_name: document.getElementById('studentFirstName').value,
            last_name: document.getElementById('studentLastName').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
            city: document.getElementById('studentCity').value,
            state: document.getElementById('studentState').value,
            age: document.getElementById('studentAge').value ? parseInt(document.getElementById('studentAge').value) : null,
            status: document.getElementById('studentStatus').value
        };
        try {
            await putData(`/students/${id}`, updateData);
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

// Companies Management
async function loadCompanies() {
    try {
        const data = await fetchData('/companies?limit=1000');
        companies = data;
        displayCompanies(data);
    } catch (error) {
        console.error('Error loading companies:', error);
        showAlert('Error loading companies data', 'danger');
    }
}

function displayCompanies(companiesData) {
    const tbody = document.getElementById('companiesTableBody');
    tbody.innerHTML = '';

    companiesData.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${company.comp_id}</td>
            <td>${company.name}</td>
            <td>${company.industry || ''}</td>
            <td>${company.hr_name || ''}</td>
            <td>${company.hr_email || ''}</td>
            <td>${company.contact_no || ''}</td>
            <td>${[company.city, company.state].filter(Boolean).join(', ')}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editCompany(${company.comp_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCompany(${company.comp_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleAddCompany(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('companyName').value,
        industry: document.getElementById('companyIndustry').value,
        hr_name: document.getElementById('companyHrName').value,
        hr_email: document.getElementById('companyHrEmail').value,
        contact_no: document.getElementById('companyContactNo').value,
        city: document.getElementById('companyCity').value,
        state: document.getElementById('companyState').value,
        website: document.getElementById('companyWebsite').value
    };

    try {
        await postData('/companies', formData);
        showAlert('Company added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addCompanyModal')).hide();
        document.getElementById('addCompanyForm').reset();
        loadCompanies();
        loadDashboardData();
    } catch (error) {
        console.error('Error adding company:', error);
        showAlert('Error adding company', 'danger');
    }
}

async function editCompany(id) {
    const company = companies.find(c => c.comp_id === id);
    if (!company) return;

    // Pre-fill form with company data
    document.getElementById('companyName').value = company.name;
    document.getElementById('companyIndustry').value = company.industry;
    document.getElementById('companyHrName').value = company.hr_name || '';
    document.getElementById('companyHrEmail').value = company.hr_email || '';
    document.getElementById('companyContactNo').value = company.contact_no || '';
    document.getElementById('companyCity').value = company.city || '';
    document.getElementById('companyState').value = company.state || '';
    document.getElementById('companyWebsite').value = company.website || '';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addCompanyModal'));
    modal.show();

    const form = document.getElementById('addCompanyForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const updateData = {
            name: document.getElementById('companyName').value,
            industry: document.getElementById('companyIndustry').value,
            hr_name: document.getElementById('companyHrName').value,
            hr_email: document.getElementById('companyHrEmail').value,
            contact_no: document.getElementById('companyContactNo').value,
            city: document.getElementById('companyCity').value,
            state: document.getElementById('companyState').value,
            website: document.getElementById('companyWebsite').value
        };
        try {
            await putData(`/companies/${id}`, updateData);
            showAlert('Company updated successfully!', 'success');
            modal.hide();
            loadCompanies();
            loadDashboardData();
        } catch (error) {
            console.error('Error updating company:', error);
            showAlert('Error updating company', 'danger');
        }
    };
}

async function deleteCompany(id) {
    if (confirm('Are you sure you want to delete this company?')) {
        try {
            await deleteData(`/companies/${id}`);
            showAlert('Company deleted successfully!', 'success');
            loadCompanies();
            loadDashboardData();
        } catch (error) {
            console.error('Error deleting company:', error);
            showAlert('Error deleting company', 'danger');
        }
    }
}

// Jobs Management
async function loadJobs() {
    try {
        const data = await fetchData('/jobs?limit=1000');
        jobs = data;
        displayJobs(data);
        populateJobCompanyDropdown();
    } catch (error) {
        console.error('Error loading jobs:', error);
        showAlert('Error loading jobs data', 'danger');
    }
}

function displayJobs(jobsData) {
    const tbody = document.getElementById('jobsTableBody');
    tbody.innerHTML = '';

    jobsData.forEach(j => {
        const company = companies.find(c => c.comp_id === j.comp_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${j.job_id}</td>
            <td>${j.title}</td>
            <td>${company ? company.name : (j.company_name || 'N/A')}</td>
            <td>${j.job_type}</td>
            <td>${j.salary != null ? j.salary : ''}</td>
            <td>${[j.city, j.state].filter(Boolean).join(', ')}</td>
            <td><span class="badge bg-secondary">${j.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editJob(${j.job_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteJob(${j.job_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateJobCompanyDropdown() {
    const companySelect = document.getElementById('jobCompany');
    if (!companySelect) return;
    companySelect.innerHTML = '<option value="">Select Company</option>';
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.comp_id;
        option.textContent = company.name;
        companySelect.appendChild(option);
    });
}

async function handleAddJob(e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('jobTitle').value,
        description: document.getElementById('jobDescription').value,
        comp_id: parseInt(document.getElementById('jobCompany').value),
        admin_id: 1,
        required_skills: document.getElementById('jobRequiredSkills').value,
        salary: document.getElementById('jobSalary').value ? parseFloat(document.getElementById('jobSalary').value) : null,
        job_type: document.getElementById('jobType').value,
        city: document.getElementById('jobCity').value,
        state: document.getElementById('jobState').value,
        posted_date: document.getElementById('jobPostedDate').value,
        deadline: document.getElementById('jobDeadline').value || null,
        status: document.getElementById('jobStatus').value,
        requirements: ''
    };

    try {
        await postData('/jobs', formData);
        showAlert('Job added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addJobModal')).hide();
        document.getElementById('addJobForm').reset();
        loadJobs();
        loadDashboardData();
    } catch (error) {
        console.error('Error adding job:', error);
        showAlert('Error adding job', 'danger');
    }
}

async function editJob(id) {
    const job = jobs.find(j => j.job_id === id);
    if (!job) return;

    document.getElementById('jobTitle').value = job.title || '';
    document.getElementById('jobDescription').value = job.description || '';
    document.getElementById('jobCompany').value = job.comp_id || '';
    document.getElementById('jobType').value = job.job_type || 'Internship';
    document.getElementById('jobSalary').value = job.salary != null ? job.salary : '';
    document.getElementById('jobCity').value = job.city || '';
    document.getElementById('jobState').value = job.state || '';
    document.getElementById('jobPostedDate').value = job.posted_date ? job.posted_date.substring(0, 10) : '';
    document.getElementById('jobDeadline').value = job.deadline ? job.deadline.substring(0, 10) : '';
    document.getElementById('jobRequiredSkills').value = job.required_skills || '';
    document.getElementById('jobStatus').value = job.status || 'Active';

    const modal = new bootstrap.Modal(document.getElementById('addJobModal'));
    modal.show();

    const form = document.getElementById('addJobForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const updateData = {
            title: document.getElementById('jobTitle').value,
            description: document.getElementById('jobDescription').value,
            comp_id: parseInt(document.getElementById('jobCompany').value),
            required_skills: document.getElementById('jobRequiredSkills').value,
            salary: document.getElementById('jobSalary').value ? parseFloat(document.getElementById('jobSalary').value) : null,
            job_type: document.getElementById('jobType').value,
            city: document.getElementById('jobCity').value,
            state: document.getElementById('jobState').value,
            posted_date: document.getElementById('jobPostedDate').value,
            deadline: document.getElementById('jobDeadline').value || null,
            status: document.getElementById('jobStatus').value
        };
        try {
            await putData(`/jobs/${id}`, updateData);
            showAlert('Job updated successfully!', 'success');
            modal.hide();
            loadJobs();
            loadDashboardData();
        } catch (error) {
            console.error('Error updating job:', error);
            showAlert('Error updating job', 'danger');
        }
    };
}

async function deleteJob(id) {
    if (confirm('Are you sure you want to delete this job?')) {
        try {
            await deleteData(`/jobs/${id}`);
            showAlert('Job deleted successfully!', 'success');
            loadJobs();
            loadDashboardData();
        } catch (error) {
            console.error('Error deleting job:', error);
            showAlert('Error deleting job', 'danger');
        }
    }
}

// Reports
function loadReports() {
    createStatusChart();
    createTrendsChart();
}

function createStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    const statusCounts = applications.reduce((acc, app) => {
        const key = app.status || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#28a745', '#17a2b8', '#dc3545', '#ffc107', '#6c757d']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createTrendsChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    // Group applications by application month
    const monthlyData = {};
    (applications || []).forEach(app => {
        if (!app.application_date) return;
        const month = new Date(app.application_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const labels = Object.keys(monthlyData);
    labels.sort((a, b) => new Date(a) - new Date(b));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Applications Submitted',
                data: labels.map(l => monthlyData[l]),
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

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// API Helper Functions
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result && typeof result === 'object' && 'data' in result) {
            return result.data;
        }
        return result;
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return ('data' in result) ? result.data : result;
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

async function putData(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return ('data' in result) ? result.data : result;
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

async function deleteData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return ('data' in result) ? result.data : result;
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

// Utility Functions
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
function addCompany() {
    document.getElementById('addCompanyForm').dispatchEvent(new Event('submit'));
}

function addInternship() {
    document.getElementById('addInternshipForm').dispatchEvent(new Event('submit'));
}

// Applications
async function loadApplications() {
    try {
        const data = await fetchData('/applications?limit=1000');
        applications = data;
        displayApplications(data);
    } catch (error) {
        console.error('Error loading applications:', error);
        showAlert('Error loading applications data', 'danger');
    }
}

function displayApplications(appsData) {
    const tbody = document.getElementById('applicationsTableBody');
    tbody.innerHTML = '';
    appsData.forEach(a => {
        const row = document.createElement('tr');
        const studentName = [a.first_name, a.last_name].filter(Boolean).join(' ');
        row.innerHTML = `
            <td>${a.app_id}</td>
            <td>${studentName}</td>
            <td>${a.job_title || ''}</td>
            <td>${a.company_name || ''}</td>
            <td>${a.application_date ? formatDate(a.application_date) : ''}</td>
            <td><span class="badge bg-secondary">${a.status}</span></td>
            <td class="action-buttons"></td>
        `;
        tbody.appendChild(row);
    });
}

// Interviews
async function loadInterviews() {
    try {
        const data = await fetchData('/interviews?limit=1000');
        interviews = data;
        displayInterviews(data);
    } catch (error) {
        console.error('Error loading interviews:', error);
        showAlert('Error loading interviews data', 'danger');
    }
}

function displayInterviews(intData) {
    const tbody = document.getElementById('interviewsTableBody');
    tbody.innerHTML = '';
    intData.forEach(i => {
        const studentName = [i.first_name, i.last_name].filter(Boolean).join(' ');
        row = document.createElement('tr');
        row.innerHTML = `
            <td>${i.interview_id}</td>
            <td>${studentName}</td>
            <td>${i.job_title || ''}</td>
            <td>${i.mode}</td>
            <td>${i.interview_date ? new Date(i.interview_date).toLocaleString() : ''}</td>
            <td>${i.interview_score != null ? i.interview_score : ''}</td>
            <td><span class="badge bg-secondary">${i.status}</span></td>
            <td class="action-buttons"></td>
        `;
        tbody.appendChild(row);
    });
}

// Skills
async function loadSkills() {
    try {
        const data = await fetchData('/skills?limit=1000');
        skills = data;
        displaySkills(data);
    } catch (error) {
        console.error('Error loading skills:', error);
        showAlert('Error loading skills data', 'danger');
    }
}

function displaySkills(skillsData) {
    const tbody = document.getElementById('skillsTableBody');
    tbody.innerHTML = '';
    skillsData.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${s.skill_id}</td>
            <td>${s.skill_name}</td>
            <td>${s.category || ''}</td>
            <td class="action-buttons"></td>
        `;
        tbody.appendChild(row);
    });
}
