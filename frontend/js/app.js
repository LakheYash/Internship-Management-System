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
        const [studentsData, companiesData, jobsData, applicationsData] = await Promise.all([
            fetchData('/students'),
            fetchData('/companies'),
            fetchData('/jobs'),
            fetchData('/applications')
        ]);

        // Update dashboard cards
        document.getElementById('total-students').textContent = studentsData.length;
        document.getElementById('total-companies').textContent = companiesData.length;
        document.getElementById('active-jobs').textContent = 
            jobsData.filter(j => j.status === 'Active').length;
        document.getElementById('total-applications').textContent = applicationsData.length;

        // Store data globally
        students = studentsData;
        companies = companiesData;
        jobs = jobsData;
        applications = applicationsData;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data', 'danger');
    }
}

// Interns Management
async function loadInterns() {
    try {
        const data = await fetchData('/interns');
        interns = data;
        displayInterns(data);
    } catch (error) {
        console.error('Error loading interns:', error);
        showAlert('Error loading interns data', 'danger');
    }
}

function displayInterns(internsData) {
    const tbody = document.getElementById('internsTableBody');
    tbody.innerHTML = '';

    internsData.forEach(intern => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${intern.id}</td>
            <td>${intern.name}</td>
            <td>${intern.email}</td>
            <td>${intern.phone}</td>
            <td>${intern.university}</td>
            <td>${intern.major}</td>
            <td><span class="badge badge-${intern.status.toLowerCase()}">${intern.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editIntern(${intern.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteIntern(${intern.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleAddIntern(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('internName').value,
        email: document.getElementById('internEmail').value,
        phone: document.getElementById('internPhone').value,
        university: document.getElementById('internUniversity').value,
        major: document.getElementById('internMajor').value,
        status: document.getElementById('internStatus').value
    };

    try {
        await postData('/interns', formData);
        showAlert('Intern added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addInternModal')).hide();
        document.getElementById('addInternForm').reset();
        loadInterns();
        loadDashboardData();
    } catch (error) {
        console.error('Error adding intern:', error);
        showAlert('Error adding intern', 'danger');
    }
}

async function editIntern(id) {
    const intern = interns.find(i => i.id === id);
    if (!intern) return;

    // Pre-fill form with intern data
    document.getElementById('internName').value = intern.name;
    document.getElementById('internEmail').value = intern.email;
    document.getElementById('internPhone').value = intern.phone;
    document.getElementById('internUniversity').value = intern.university;
    document.getElementById('internMajor').value = intern.major;
    document.getElementById('internStatus').value = intern.status;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addInternModal'));
    modal.show();

    // Update form to handle edit
    const form = document.getElementById('addInternForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            await putData(`/interns/${id}`, formData);
            showAlert('Intern updated successfully!', 'success');
            modal.hide();
            loadInterns();
            loadDashboardData();
        } catch (error) {
            console.error('Error updating intern:', error);
            showAlert('Error updating intern', 'danger');
        }
    };
}

async function deleteIntern(id) {
    if (confirm('Are you sure you want to delete this intern?')) {
        try {
            await deleteData(`/interns/${id}`);
            showAlert('Intern deleted successfully!', 'success');
            loadInterns();
            loadDashboardData();
        } catch (error) {
            console.error('Error deleting intern:', error);
            showAlert('Error deleting intern', 'danger');
        }
    }
}

// Companies Management
async function loadCompanies() {
    try {
        const data = await fetchData('/companies');
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
            <td>${company.id}</td>
            <td>${company.name}</td>
            <td>${company.industry}</td>
            <td>${company.contact_person}</td>
            <td>${company.email}</td>
            <td>${company.phone}</td>
            <td>${company.location}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editCompany(${company.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCompany(${company.id})">
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
        contact_person: document.getElementById('companyContact').value,
        email: document.getElementById('companyEmail').value,
        phone: document.getElementById('companyPhone').value,
        location: document.getElementById('companyLocation').value
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
    const company = companies.find(c => c.id === id);
    if (!company) return;

    // Pre-fill form with company data
    document.getElementById('companyName').value = company.name;
    document.getElementById('companyIndustry').value = company.industry;
    document.getElementById('companyContact').value = company.contact_person;
    document.getElementById('companyEmail').value = company.email;
    document.getElementById('companyPhone').value = company.phone;
    document.getElementById('companyLocation').value = company.location;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addCompanyModal'));
    modal.show();
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

// Internships Management
async function loadInternships() {
    try {
        const data = await fetchData('/internships');
        internships = data;
        displayInternships(data);
        populateInternshipDropdowns();
    } catch (error) {
        console.error('Error loading internships:', error);
        showAlert('Error loading internships data', 'danger');
    }
}

function displayInternships(internshipsData) {
    const tbody = document.getElementById('internshipsTableBody');
    tbody.innerHTML = '';

    internshipsData.forEach(internship => {
        const company = companies.find(c => c.id === internship.company_id);
        const intern = interns.find(i => i.id === internship.intern_id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${internship.id}</td>
            <td>${internship.title}</td>
            <td>${company ? company.name : 'N/A'}</td>
            <td>${intern ? intern.name : 'N/A'}</td>
            <td>${formatDate(internship.start_date)}</td>
            <td>${formatDate(internship.end_date)}</td>
            <td><span class="badge badge-${internship.status.toLowerCase()}">${internship.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editInternship(${internship.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteInternship(${internship.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateInternshipDropdowns() {
    // Populate company dropdown
    const companySelect = document.getElementById('internshipCompany');
    companySelect.innerHTML = '<option value="">Select Company</option>';
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        companySelect.appendChild(option);
    });

    // Populate intern dropdown
    const internSelect = document.getElementById('internshipIntern');
    internSelect.innerHTML = '<option value="">Select Intern</option>';
    interns.forEach(intern => {
        const option = document.createElement('option');
        option.value = intern.id;
        option.textContent = intern.name;
        internSelect.appendChild(option);
    });
}

async function handleAddInternship(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('internshipTitle').value,
        company_id: parseInt(document.getElementById('internshipCompany').value),
        intern_id: parseInt(document.getElementById('internshipIntern').value),
        start_date: document.getElementById('internshipStartDate').value,
        end_date: document.getElementById('internshipEndDate').value,
        status: document.getElementById('internshipStatus').value
    };

    try {
        await postData('/internships', formData);
        showAlert('Internship added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addInternshipModal')).hide();
        document.getElementById('addInternshipForm').reset();
        loadInternships();
        loadDashboardData();
    } catch (error) {
        console.error('Error adding internship:', error);
        showAlert('Error adding internship', 'danger');
    }
}

async function editInternship(id) {
    const internship = internships.find(i => i.id === id);
    if (!internship) return;

    // Pre-fill form with internship data
    document.getElementById('internshipTitle').value = internship.title;
    document.getElementById('internshipCompany').value = internship.company_id;
    document.getElementById('internshipIntern').value = internship.intern_id;
    document.getElementById('internshipStartDate').value = internship.start_date;
    document.getElementById('internshipEndDate').value = internship.end_date;
    document.getElementById('internshipStatus').value = internship.status;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addInternshipModal'));
    modal.show();
}

async function deleteInternship(id) {
    if (confirm('Are you sure you want to delete this internship?')) {
        try {
            await deleteData(`/internships/${id}`);
            showAlert('Internship deleted successfully!', 'success');
            loadInternships();
            loadDashboardData();
        } catch (error) {
            console.error('Error deleting internship:', error);
            showAlert('Error deleting internship', 'danger');
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
    const statusCounts = {
        'Active': internships.filter(i => i.status === 'Active').length,
        'Completed': internships.filter(i => i.status === 'Completed').length,
        'Cancelled': internships.filter(i => i.status === 'Cancelled').length
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#28a745', '#17a2b8', '#dc3545']
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
    
    // Group internships by month
    const monthlyData = {};
    internships.forEach(internship => {
        const month = new Date(internship.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(monthlyData),
            datasets: [{
                label: 'Internships Started',
                data: Object.values(monthlyData),
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
        throw new Error(`HTTP error! status: ${response.status}`);
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
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function deleteData(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
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
function addIntern() {
    document.getElementById('addInternForm').dispatchEvent(new Event('submit'));
}

function addCompany() {
    document.getElementById('addCompanyForm').dispatchEvent(new Event('submit'));
}

function addInternship() {
    document.getElementById('addInternshipForm').dispatchEvent(new Event('submit'));
}
