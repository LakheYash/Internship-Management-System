// Professional Internship Management System - Main Application
class InternshipManagementSystem {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.pageSize = 10;
        this.data = {
            students: [],
            companies: [],
            jobs: [],
            applications: [],
            interviews: [],
            skills: [],
            analytics: {}
        };
        
        // Enhanced UI State Management
        this.uiState = {
            sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
            animations: localStorage.getItem('animations') !== 'false',
            soundEnabled: localStorage.getItem('soundEnabled') === 'true'
        };
        
        // Animation and loading managers
        this.animationQueue = [];
        this.isLoading = false;
        this.toastManager = new ToastManager();
        this.loadingManager = new LoadingManager();
        this.animationManager = new AnimationManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.initializeAOS();
        // Ensure dashboard is shown and data loaded on first load
        this.showSection('dashboard');
    }

    initializeAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                offset: 100
            });
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            });
        });

        // Form submissions
        document.getElementById('saveStudentBtn')?.addEventListener('click', () => this.saveStudent());
        document.getElementById('saveCompanyBtn')?.addEventListener('click', () => this.saveCompany());
        document.getElementById('saveJobBtn')?.addEventListener('click', () => this.saveJob());
        document.getElementById('saveSkillBtn')?.addEventListener('click', () => this.saveSkill());
        document.getElementById('saveInterviewBtn')?.addEventListener('click', () => this.scheduleInterview());

        // Filters
        document.getElementById('studentStatusFilter')?.addEventListener('change', () => this.filterStudents());
        document.getElementById('studentSearch')?.addEventListener('input', () => this.filterStudents());
        document.getElementById('clearStudentFilters')?.addEventListener('click', () => this.clearStudentFilters());

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
    }

    setupNavigation() {
        // Set active navigation item
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    async showSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('active');
        });

        // Show loading spinner
        this.showLoading();

        try {
            // Show the requested section
            const targetSection = document.getElementById(`${section}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
                this.currentSection = section;

                // Load section-specific data
                await this.loadSectionData(section);
            }
        } catch (error) {
            console.error('Error loading section:', error);
            this.showToast('Error loading section', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'students':
                await this.loadStudents();
                break;
            case 'companies':
                await this.loadCompanies();
                break;
            case 'jobs':
                await this.loadJobs();
                break;
            case 'applications':
                await this.loadApplications();
                break;
            case 'interviews':
                await this.loadInterviews();
                break;
            case 'skills':
                await this.loadSkills();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadDashboard() {
        const dashboardElement = document.getElementById('dashboard-section');
        
        try {
            // Show loading state with animation
            if (this.loadingManager) {
                this.loadingManager.show(dashboardElement, 'Loading dashboard data...');
            }
            
            // Load dashboard analytics
            const response = await fetch(`${this.apiBaseUrl}/analytics/dashboard`);
            const result = await response.json();

            if (result.success) {
                this.data.analytics = result.data;
                this.updateDashboardStats();
                this.updateDashboardCharts();
                this.loadRecentActivity();
                
                // Hide loading state
                if (this.loadingManager) {
                    this.loadingManager.hide(dashboardElement);
                }
                
                // Animate stats cards
                this.animateDashboardCards();
                
                this.showToast('Dashboard loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showToast('Error loading dashboard data', 'error');
            
            // Hide loading state on error
            if (this.loadingManager) {
                this.loadingManager.hide(dashboardElement);
            }
        }
    }
    
    animateDashboardCards() {
        const statsCards = document.querySelectorAll('.stats-card');
        if (this.animationManager && statsCards.length > 0) {
            this.animationManager.staggerAnimation(statsCards, 'fadeInUp', 150);
        }
    }

    updateDashboardStats() {
        const analytics = this.data.analytics;
        if (analytics.overview) {
            document.getElementById('totalStudents').textContent = analytics.overview.total_students || 0;
            document.getElementById('activeJobs').textContent = analytics.overview.active_jobs || 0;
            document.getElementById('totalApplications').textContent = analytics.overview.total_applications || 0;
            document.getElementById('selectedApplications').textContent = analytics.overview.selected_applications || 0;
        }
    }

    updateDashboardCharts() {
        const analytics = this.data.analytics;
        
        // Application Trends Chart
        if (analytics.trends) {
            this.createApplicationTrendsChart(analytics.trends);
        }

        // Top Skills Chart
        if (analytics.topSkills) {
            this.createTopSkillsChart(analytics.topSkills);
        }
    }

    createApplicationTrendsChart(trendsData) {
        const ctx = document.getElementById('applicationTrendsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendsData.map(t => t.month),
                datasets: [{
                    label: 'Applications',
                    data: trendsData.map(t => t.applications),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createTopSkillsChart(skillsData) {
        const ctx = document.getElementById('topSkillsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: skillsData.slice(0, 5).map(s => s.skill_name),
                datasets: [{
                    data: skillsData.slice(0, 5).map(s => s.jobs_requiring_skill),
                    backgroundColor: [
                        '#2563eb',
                        '#10b981',
                        '#06b6d4',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    async loadRecentActivity() {
        try {
            // Load recent applications
            const applicationsResponse = await fetch(`${this.apiBaseUrl}/applications?limit=5`);
            const applicationsResult = await applicationsResponse.json();
            
            if (applicationsResult.success) {
                this.displayRecentApplications(applicationsResult.data);
            }

            // Load upcoming interviews
            const interviewsResponse = await fetch(`${this.apiBaseUrl}/interviews?upcoming=true&limit=5`);
            const interviewsResult = await interviewsResponse.json();
            
            if (interviewsResult.success) {
                this.displayUpcomingInterviews(interviewsResult.data);
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    displayRecentApplications(applications) {
        const container = document.getElementById('recentApplications');
        if (!container) return;

        container.innerHTML = applications.map(app => `
            <div class="d-flex align-items-center mb-3 p-2 rounded" style="background: rgba(255, 255, 255, 0.5);">
                <div class="flex-shrink-0">
                    <i class="fas fa-user-circle text-primary fs-4"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <div class="fw-bold">${app.student_name || 'Unknown Student'}</div>
                    <div class="text-muted small">${app.job_title || 'Unknown Job'}</div>
                </div>
                <div class="flex-shrink-0">
                    <span class="badge badge-${app.status?.toLowerCase().replace(' ', '-')}">${app.status}</span>
                </div>
            </div>
        `).join('');
    }

    displayUpcomingInterviews(interviews) {
        const container = document.getElementById('upcomingInterviews');
        if (!container) return;

        container.innerHTML = interviews.map(interview => `
            <div class="d-flex align-items-center mb-3 p-2 rounded" style="background: rgba(255, 255, 255, 0.5);">
                <div class="flex-shrink-0">
                    <i class="fas fa-calendar text-info fs-4"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <div class="fw-bold">${interview.student_name || 'Unknown Student'}</div>
                    <div class="text-muted small">${interview.job_title || 'Unknown Job'}</div>
                    <div class="text-muted small">${new Date(interview.interview_date).toLocaleDateString()}</div>
                </div>
                <div class="flex-shrink-0">
                    <span class="badge badge-${interview.mode?.toLowerCase()}">${interview.mode}</span>
                </div>
            </div>
        `).join('');
    }

    // Utility methods
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    showToast(message, type = 'info', duration = 5000) {
        // Use enhanced ToastManager if available
        if (this.toastManager) {
            this.toastManager.show(message, type, duration);
            return;
        }
        
        // Fallback to basic toast
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastHeader = toast.querySelector('.toast-header i');
        
        if (toast && toastMessage && toastHeader) {
            toastMessage.textContent = message;
            
            // Update icon based on type
            toastHeader.className = `fas me-2 text-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'}`;
            toastHeader.classList.add(`fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}`);
            
            // Show toast
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        } else {
            // Ultimate fallback
            alert(message);
        }
    }

    async loadStudents() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/students?page=${this.currentPage}&limit=${this.pageSize}`);
            const result = await response.json();

            if (result.success) {
                this.data.students = result.data;
                this.displayStudents(result.data);
                this.updatePagination(result.pagination, 'students');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showToast('Error loading students', 'error');
        }
    }

    displayStudents(students) {
        const tbody = document.querySelector('#studentsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.stud_id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-primary text-white rounded-circle me-2 d-flex align-items-center justify-content-center">
                            ${student.first_name.charAt(0)}${student.last_name.charAt(0)}
                        </div>
                        <div>
                            <div class="fw-bold">${student.first_name} ${student.last_name}</div>
                            <small class="text-muted">${student.email}</small>
                        </div>
                    </div>
                </td>
                <td>${student.email}</td>
                <td>${student.phone || '-'}</td>
                <td><span class="badge badge-${student.status?.toLowerCase()}">${student.status}</span></td>
                <td>${student.city || '-'}, ${student.state || '-'}</td>
                <td>
                    <div class="d-flex flex-wrap gap-1">
                        ${this.getStudentSkills(student.stud_id).slice(0, 3).map(skill => 
                            `<span class="badge bg-light">${skill}</span>`
                        ).join('')}
                        ${this.getStudentSkills(student.stud_id).length > 3 ? 
                            `<span class="badge bg-secondary">+${this.getStudentSkills(student.stud_id).length - 3}</span>` : ''
                        }
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewStudent(${student.stud_id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.editStudent(${student.stud_id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteStudent(${student.stud_id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStudentSkills(studentId) {
        // This would typically come from the API, but for now return mock data
        const skillMap = {
            1: ['JavaScript', 'React', 'Node.js'],
            2: ['Python', 'SQL', 'Machine Learning'],
            3: ['Project Management', 'Data Analysis'],
            4: ['Java', 'C++', 'System Design'],
            5: ['Data Analysis', 'Sustainability', 'Research']
        };
        return skillMap[studentId] || [];
    }

    async loadCompanies() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/companies`);
            const result = await response.json();

            if (result.success) {
                this.data.companies = result.data;
                this.displayCompanies(result.data);
                this.populateCompanyDropdown();
            }
        } catch (error) {
            console.error('Error loading companies:', error);
            this.showToast('Error loading companies', 'error');
        }
    }

    displayCompanies(companies) {
        const tbody = document.querySelector('#companiesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = companies.map(company => `
            <tr>
                <td>${company.comp_id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-success text-white rounded-circle me-2 d-flex align-items-center justify-content-center">
                            ${company.name.charAt(0)}
                        </div>
                        <div>
                            <div class="fw-bold">${company.name}</div>
                            <small class="text-muted">${company.industry || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>${company.industry || '-'}</td>
                <td>${company.city || '-'}, ${company.state || '-'}</td>
                <td>${company.contact_no || '-'}</td>
                <td>
                    ${company.website ? 
                        `<a href="${company.website}" target="_blank" class="text-decoration-none">
                            <i class="fas fa-external-link-alt me-1"></i>Website
                        </a>` : '-'
                    }
                </td>
                <td><span class="badge badge-${company.is_active ? 'active' : 'inactive'}">${company.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewCompany(${company.comp_id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.editCompany(${company.comp_id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populateCompanyDropdown() {
        const dropdown = document.getElementById('jobCompany');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Select Company</option>' +
            this.data.companies.map(company => 
                `<option value="${company.comp_id}">${company.name}</option>`
            ).join('');
    }

    async loadJobs() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/jobs`);
            const result = await response.json();

            if (result.success) {
                this.data.jobs = result.data;
                this.displayJobs(result.data);
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
            this.showToast('Error loading jobs', 'error');
        }
    }

    displayJobs(jobs) {
        const tbody = document.querySelector('#jobsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = jobs.map(job => `
            <tr>
                <td>${job.job_id}</td>
                <td>
                    <div class="fw-bold">${job.title}</div>
                    <small class="text-muted">${job.description ? job.description.substring(0, 50) + '...' : ''}</small>
                </td>
                <td>${job.company_name || 'Unknown Company'}</td>
                <td><span class="badge bg-info">${job.job_type}</span></td>
                <td>$${job.salary ? job.salary.toLocaleString() : '-'}</td>
                <td>${job.city || '-'}, ${job.state || '-'}</td>
                <td>
                    ${job.deadline ? 
                        `<span class="text-${new Date(job.deadline) > new Date() ? 'success' : 'danger'}">
                            ${new Date(job.deadline).toLocaleDateString()}
                        </span>` : '-'
                    }
                </td>
                <td><span class="badge badge-${job.status?.toLowerCase()}">${job.status}</span></td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewJob(${job.job_id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.editJob(${job.job_id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadApplications() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/applications`);
            const result = await response.json();

            if (result.success) {
                this.data.applications = result.data;
                this.displayApplications(result.data);
                this.populateApplicationDropdown();
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            this.showToast('Error loading applications', 'error');
        }
    }

    displayApplications(applications) {
        const tbody = document.querySelector('#applicationsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = applications.map(app => `
            <tr>
                <td>${app.app_id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-primary text-white rounded-circle me-2 d-flex align-items-center justify-content-center">
                            ${app.student_name ? app.student_name.split(' ').map(n => n[0]).join('') : '??'}
                        </div>
                        <div>
                            <div class="fw-bold">${app.student_name || 'Unknown Student'}</div>
                            <small class="text-muted">${app.student_email || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="fw-bold">${app.job_title || 'Unknown Job'}</div>
                    <small class="text-muted">${app.company_name || 'Unknown Company'}</small>
                </td>
                <td>${app.company_name || 'Unknown Company'}</td>
                <td><span class="badge badge-${app.status?.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                <td>${new Date(app.application_date).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewApplication(${app.app_id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.updateApplicationStatus(${app.app_id})" title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populateApplicationDropdown() {
        const dropdown = document.getElementById('interviewApplication');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Select Application</option>' +
            this.data.applications.filter(app => app.status === 'Shortlisted' || app.status === 'Under Review')
                .map(app => 
                    `<option value="${app.app_id}">${app.student_name} - ${app.job_title}</option>`
                ).join('');
    }

    async loadInterviews() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/interviews`);
            const result = await response.json();

            if (result.success) {
                this.data.interviews = result.data;
                this.displayInterviews(result.data);
            }
        } catch (error) {
            console.error('Error loading interviews:', error);
            this.showToast('Error loading interviews', 'error');
        }
    }

    displayInterviews(interviews) {
        const tbody = document.querySelector('#interviewsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = interviews.map(interview => `
            <tr>
                <td>${interview.interview_id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-info text-white rounded-circle me-2 d-flex align-items-center justify-content-center">
                            ${interview.student_name ? interview.student_name.split(' ').map(n => n[0]).join('') : '??'}
                        </div>
                        <div>
                            <div class="fw-bold">${interview.student_name || 'Unknown Student'}</div>
                            <small class="text-muted">${interview.student_email || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="fw-bold">${interview.job_title || 'Unknown Job'}</div>
                    <small class="text-muted">${interview.company_name || 'Unknown Company'}</small>
                </td>
                <td>${interview.company_name || 'Unknown Company'}</td>
                <td>
                    <div class="fw-bold">${new Date(interview.interview_date).toLocaleDateString()}</div>
                    <small class="text-muted">${new Date(interview.interview_date).toLocaleTimeString()}</small>
                </td>
                <td><span class="badge badge-${interview.mode?.toLowerCase()}">${interview.mode}</span></td>
                <td><span class="badge badge-${interview.status?.toLowerCase()}">${interview.status}</span></td>
                <td>
                    ${interview.interview_score ? 
                        `<span class="badge ${interview.interview_score >= 80 ? 'bg-success' : interview.interview_score >= 60 ? 'bg-warning' : 'bg-danger'}">
                            ${interview.interview_score}%
                        </span>` : '-'
                    }
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewInterview(${interview.interview_id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.editInterview(${interview.interview_id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadSkills() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/skills`);
            const result = await response.json();

            if (result.success) {
                this.data.skills = result.data;
                this.displaySkills(result.data);
            }
        } catch (error) {
            console.error('Error loading skills:', error);
            this.showToast('Error loading skills', 'error');
        }
    }

    displaySkills(skills) {
        const tbody = document.querySelector('#skillsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = skills.map(skill => `
            <tr>
                <td>${skill.skill_id}</td>
                <td>
                    <div class="fw-bold">${skill.skill_name}</div>
                    <small class="text-muted">${skill.category || 'Uncategorized'}</small>
                </td>
                <td><span class="badge bg-secondary">${skill.category || 'Uncategorized'}</span></td>
                <td>
                    <span class="badge bg-primary">${skill.students_count || 0} students</span>
                </td>
                <td>
                    <span class="badge bg-info">${skill.jobs_count || 0} jobs</span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewSkill(${skill.skill_id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.editSkill(${skill.skill_id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteSkill(${skill.skill_id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadAnalytics() {
        try {
            // Load various analytics
            const [studentsResponse, companiesResponse, jobsResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/analytics/students`),
                fetch(`${this.apiBaseUrl}/analytics/companies`),
                fetch(`${this.apiBaseUrl}/analytics/jobs`)
            ]);

            const studentsResult = await studentsResponse.json();
            const companiesResult = await companiesResponse.json();
            const jobsResult = await jobsResponse.json();

            if (studentsResult.success) {
                this.createStudentAnalyticsChart(studentsResult.data);
            }

            if (companiesResult.success) {
                this.createCompanyAnalyticsChart(companiesResult.data);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showToast('Error loading analytics', 'error');
        }
    }

    createStudentAnalyticsChart(data) {
        const ctx = document.getElementById('studentAnalyticsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(s => s.student_name),
                datasets: [{
                    label: 'Applications',
                    data: data.map(s => s.total_applications),
                    backgroundColor: '#2563eb',
                    borderColor: '#1d4ed8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createCompanyAnalyticsChart(data) {
        const ctx = document.getElementById('companyAnalyticsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(c => c.company_name),
                datasets: [{
                    data: data.map(c => c.total_applications),
                    backgroundColor: [
                        '#2563eb',
                        '#10b981',
                        '#06b6d4',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Form submission methods
    async saveStudent() {
        const formData = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            age: parseInt(document.getElementById('age').value),
            city: document.getElementById('city').value,
            state: document.getElementById('state').value
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Student added successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
                document.getElementById('addStudentForm').reset();
                this.loadStudents();
            } else {
                this.showToast(result.message || 'Error adding student', 'error');
            }
        } catch (error) {
            console.error('Error saving student:', error);
            this.showToast('Error saving student', 'error');
        }
    }

    async saveCompany() {
        const formData = {
            name: document.getElementById('companyName').value,
            industry: document.getElementById('industry').value,
            city: document.getElementById('companyCity').value,
            state: document.getElementById('companyState').value,
            contact_no: document.getElementById('contactNo').value,
            website: document.getElementById('website').value
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/companies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Company added successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('addCompanyModal')).hide();
                document.getElementById('addCompanyForm').reset();
                this.loadCompanies();
            } else {
                this.showToast(result.message || 'Error adding company', 'error');
            }
        } catch (error) {
            console.error('Error saving company:', error);
            this.showToast('Error saving company', 'error');
        }
    }

    async saveJob() {
        const formData = {
            title: document.getElementById('jobTitle').value,
            comp_id: parseInt(document.getElementById('jobCompany').value),
            job_type: document.getElementById('jobType').value,
            salary: parseFloat(document.getElementById('salary').value),
            city: document.getElementById('jobCity').value,
            state: document.getElementById('jobState').value,
            deadline: document.getElementById('deadline').value,
            description: document.getElementById('jobDescription').value
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Job added successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('addJobModal')).hide();
                document.getElementById('addJobForm').reset();
                this.loadJobs();
            } else {
                this.showToast(result.message || 'Error adding job', 'error');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            this.showToast('Error saving job', 'error');
        }
    }

    async saveSkill() {
        const formData = {
            skill_name: document.getElementById('skillName').value,
            category: document.getElementById('skillCategory').value
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/skills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Skill added successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('addSkillModal')).hide();
                document.getElementById('addSkillForm').reset();
                this.loadSkills();
            } else {
                this.showToast(result.message || 'Error adding skill', 'error');
            }
        } catch (error) {
            console.error('Error saving skill:', error);
            this.showToast('Error saving skill', 'error');
        }
    }

    async scheduleInterview() {
        const formData = {
            app_id: parseInt(document.getElementById('interviewApplication').value),
            mode: document.getElementById('interviewMode').value,
            interview_date: document.getElementById('interviewDate').value,
            interviewer_name: document.getElementById('interviewerName').value,
            interviewer_email: document.getElementById('interviewerEmail').value
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/procedures/schedule-interview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Interview scheduled successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('scheduleInterviewModal')).hide();
                document.getElementById('scheduleInterviewForm').reset();
                this.loadInterviews();
            } else {
                this.showToast(result.message || 'Error scheduling interview', 'error');
            }
        } catch (error) {
            console.error('Error scheduling interview:', error);
            this.showToast('Error scheduling interview', 'error');
        }
    }

    // Filter methods
    async filterStudents() {
        const status = document.getElementById('studentStatusFilter').value;
        const search = document.getElementById('studentSearch').value;
        
        let url = `${this.apiBaseUrl}/students?page=${this.currentPage}&limit=${this.pageSize}`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${search}`;

        try {
            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                this.data.students = result.data;
                this.displayStudents(result.data);
                this.updatePagination(result.pagination, 'students');
            }
        } catch (error) {
            console.error('Error filtering students:', error);
            this.showToast('Error filtering students', 'error');
        }
    }

    clearStudentFilters() {
        document.getElementById('studentStatusFilter').value = '';
        document.getElementById('studentSearch').value = '';
        this.loadStudents();
    }

    updatePagination(pagination, section) {
        const paginationContainer = document.getElementById(`${section}Pagination`);
        if (!paginationContainer || !pagination) return;

        const totalPages = pagination.pages;
        const currentPage = pagination.page;
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="app.changePage(${currentPage - 1}, '${section}')">Previous</a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage || (i >= currentPage - 2 && i <= currentPage + 2) || i === 1 || i === totalPages) {
                paginationHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="app.changePage(${i}, '${section}')">${i}</a>
                    </li>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="app.changePage(${currentPage + 1}, '${section}')">Next</a>
            </li>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page, section) {
        this.currentPage = page;
        this.loadSectionData(section);
    }

    // Placeholder methods for CRUD operations
    viewStudent(id) {
        this.showToast(`View student ${id} - Feature coming soon`, 'info');
    }

    editStudent(id) {
        this.showToast(`Edit student ${id} - Feature coming soon`, 'info');
    }

    async deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.success) {
                    this.showToast('Student deleted successfully', 'success');
                    this.loadStudents();
                } else {
                    this.showToast(result.message || 'Error deleting student', 'error');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                this.showToast('Error deleting student', 'error');
            }
        }
    }

    viewCompany(id) {
        this.showToast(`View company ${id} - Feature coming soon`, 'info');
    }

    editCompany(id) {
        this.showToast(`Edit company ${id} - Feature coming soon`, 'info');
    }

    viewJob(id) {
        this.showToast(`View job ${id} - Feature coming soon`, 'info');
    }

    editJob(id) {
        this.showToast(`Edit job ${id} - Feature coming soon`, 'info');
    }

    viewApplication(id) {
        this.showToast(`View application ${id} - Feature coming soon`, 'info');
    }

    updateApplicationStatus(id) {
        this.showToast(`Update application status ${id} - Feature coming soon`, 'info');
    }

    viewInterview(id) {
        this.showToast(`View interview ${id} - Feature coming soon`, 'info');
    }

    editInterview(id) {
        this.showToast(`Edit interview ${id} - Feature coming soon`, 'info');
    }

    viewSkill(id) {
        this.showToast(`View skill ${id} - Feature coming soon`, 'info');
    }

    editSkill(id) {
        this.showToast(`Edit skill ${id} - Feature coming soon`, 'info');
    }

    async deleteSkill(id) {
        if (confirm('Are you sure you want to delete this skill?')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/skills/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.success) {
                    this.showToast('Skill deleted successfully', 'success');
                    this.loadSkills();
                } else {
                    this.showToast(result.message || 'Error deleting skill', 'error');
                }
            } catch (error) {
                console.error('Error deleting skill:', error);
                this.showToast('Error deleting skill', 'error');
            }
        }
    }

    logout() {
        this.showToast('Logout - Feature coming soon', 'info');
    }
}

// Enhanced Utility Classes
class ToastManager {
    constructor() {
        this.container = this.createContainer();
    }
    
    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast show animate-fadeInRight`;
        toast.style.cssText = `
            margin-bottom: 10px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        const iconMap = {
            success: 'fas fa-check-circle text-success',
            error: 'fas fa-exclamation-circle text-danger',
            warning: 'fas fa-exclamation-triangle text-warning',
            info: 'fas fa-info-circle text-info'
        };
        
        toast.innerHTML = `
            <div class="toast-header">
                <i class="${iconMap[type] || iconMap.info} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        this.container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);
    }
    
    remove(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }
    
    show(element, message = 'Loading...') {
        const loaderId = `loader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.activeLoaders.add(loaderId);
        
        const originalContent = element.innerHTML;
        element.dataset.originalContent = originalContent;
        element.dataset.loaderId = loaderId;
        
        element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border animate-pulse" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="mt-2 text-muted">${message}</div>
            </div>
        `;
        
        return loaderId;
    }
    
    hide(element) {
        const loaderId = element.dataset.loaderId;
        if (loaderId && this.activeLoaders.has(loaderId)) {
            this.activeLoaders.delete(loaderId);
            element.innerHTML = element.dataset.originalContent || '';
            delete element.dataset.originalContent;
            delete element.dataset.loaderId;
        }
    }
    
    hideAll() {
        document.querySelectorAll('[data-loader-id]').forEach(el => {
            this.hide(el);
        });
    }
}

class AnimationManager {
    constructor() {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        this.observeElements();
    }
    
    observeElements() {
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            this.observer.observe(el);
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
                this.observer.unobserve(entry.target);
            }
        });
    }
    
    animateElement(element, animation = 'fadeInUp', delay = 0) {
        return new Promise(resolve => {
            setTimeout(() => {
                element.classList.add(`animate-${animation}`);
                setTimeout(resolve, 600);
            }, delay);
        });
    }
    
    staggerAnimation(elements, animation = 'fadeInUp', staggerDelay = 100) {
        return Promise.all(
            Array.from(elements).map((el, index) => 
                this.animateElement(el, animation, index * staggerDelay)
            )
        );
    }
}

// Global refresh function
function refreshDashboard() {
    if (window.app) {
        window.app.loadDashboard();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InternshipManagementSystem();
});