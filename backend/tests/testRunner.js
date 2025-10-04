const request = require('supertest');
const app = require('../server');
const { executeQuery } = require('../database/connection');
const jwt = require('jsonwebtoken');

// Test database setup
const setupTestDatabase = async () => {
    // Create test database if it doesn't exist
    await executeQuery('CREATE DATABASE IF NOT EXISTS test_internship_db');
    await executeQuery('USE test_internship_db');
    
    // Run schema setup
    // This would typically import and run the schema.sql file
    console.log('Test database setup completed');
};

// Clean up test database
const cleanupTestDatabase = async () => {
    await executeQuery('DROP DATABASE IF EXISTS test_internship_db');
    console.log('Test database cleaned up');
};

// Test data fixtures
const testData = {
    admin: {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
    },
    student: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '1234567890',
        age: 22,
        city: 'Test City',
        state: 'Test State',
        pin: '123456',
        status: 'Available'
    },
    company: {
        name: 'Test Company',
        email: 'company@test.com',
        phone: '9876543210',
        website: 'https://testcompany.com',
        description: 'A test company',
        city: 'Test City',
        state: 'Test State',
        pin: '654321'
    },
    job: {
        comp_id: 1,
        title: 'Software Developer Intern',
        description: 'A software development internship position',
        requirements: 'Knowledge of programming languages',
        salary: 50000,
        location: 'Remote',
        job_type: 'Internship',
        status: 'Active',
        application_deadline: '2024-12-31'
    }
};

// Helper functions
const helpers = {
    // Generate JWT token for testing
    generateToken: (payload = {}) => {
        const defaultPayload = {
            userId: 1,
            username: 'testuser',
            role: 'admin',
            ...payload
        };
        return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test_secret');
    },

    // Create authenticated request
    authenticatedRequest: (token = null) => {
        const authToken = token || helpers.generateToken();
        return request(app)
            .set('Authorization', `Bearer ${authToken}`);
    },

    // Create test user
    createTestUser: async (userData = testData.admin) => {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const result = await executeQuery(
            'INSERT INTO admin (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [userData.name, userData.email, hashedPassword, userData.role]
        );
        
        return result.data.insertId;
    },

    // Create test student
    createTestStudent: async (studentData = testData.student) => {
        const result = await executeQuery(
            'INSERT INTO students (first_name, last_name, email, phone, age, city, state, pin, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [studentData.first_name, studentData.last_name, studentData.email, studentData.phone, studentData.age, studentData.city, studentData.state, studentData.pin, studentData.status]
        );
        
        return result.data.insertId;
    },

    // Create test company
    createTestCompany: async (companyData = testData.company) => {
        const result = await executeQuery(
            'INSERT INTO company (name, email, phone, website, description, city, state, pin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [companyData.name, companyData.email, companyData.phone, companyData.website, companyData.description, companyData.city, companyData.state, companyData.pin]
        );
        
        return result.data.insertId;
    },

    // Clean up test data
    cleanupTestData: async () => {
        await executeQuery('DELETE FROM application WHERE 1=1');
        await executeQuery('DELETE FROM interview WHERE 1=1');
        await executeQuery('DELETE FROM jobs WHERE 1=1');
        await executeQuery('DELETE FROM company WHERE 1=1');
        await executeQuery('DELETE FROM students WHERE 1=1');
        await executeQuery('DELETE FROM admin WHERE 1=1');
    }
};

// Test suites
const testSuites = {
    // Authentication tests
    auth: {
        register: async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testData.admin);
            
            return response.status === 201 && response.body.success;
        },

        login: async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: testData.admin.email,
                    password: testData.admin.password
                });
            
            return response.status === 200 && response.body.success && response.body.token;
        },

        profile: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .get('/api/auth/profile');
            
            return response.status === 200 && response.body.success;
        }
    },

    // Student tests
    students: {
        create: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .post('/api/students')
                .send(testData.student);
            
            return response.status === 201 && response.body.success;
        },

        getAll: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .get('/api/students');
            
            return response.status === 200 && response.body.success;
        },

        getById: async () => {
            const studentId = await helpers.createTestStudent();
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .get(`/api/students/${studentId}`);
            
            return response.status === 200 && response.body.success;
        },

        update: async () => {
            const studentId = await helpers.createTestStudent();
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .put(`/api/students/${studentId}`)
                .send({ status: 'Applied' });
            
            return response.status === 200 && response.body.success;
        },

        delete: async () => {
            const studentId = await helpers.createTestStudent();
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .delete(`/api/students/${studentId}`);
            
            return response.status === 200 && response.body.success;
        }
    },

    // Company tests
    companies: {
        create: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .post('/api/companies')
                .send(testData.company);
            
            return response.status === 201 && response.body.success;
        },

        getAll: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .get('/api/companies');
            
            return response.status === 200 && response.body.success;
        }
    },

    // Job tests
    jobs: {
        create: async () => {
            const companyId = await helpers.createTestCompany();
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .post('/api/jobs')
                .send({ ...testData.job, comp_id: companyId });
            
            return response.status === 201 && response.body.success;
        },

        getAll: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .get('/api/jobs');
            
            return response.status === 200 && response.body.success;
        }
    },

    // Application tests
    applications: {
        create: async () => {
            const studentId = await helpers.createTestStudent();
            const companyId = await helpers.createTestCompany();
            const jobId = await helpers.createTestJob(companyId);
            const token = helpers.generateToken();
            
            const response = await helpers.authenticatedRequest(token)
                .post('/api/applications')
                .send({
                    stud_id: studentId,
                    job_id: jobId,
                    cover_letter: 'Test cover letter'
                });
            
            return response.status === 201 && response.body.success;
        }
    },

    // Analytics tests
    analytics: {
        dashboard: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .get('/api/analytics/dashboard');
            
            return response.status === 200 && response.body.success;
        },

        students: async () => {
            const token = helpers.generateToken();
            const response = await helpers.authenticatedRequest(token)
                .get('/api/analytics/students');
            
            return response.status === 200 && response.body.success;
        }
    }
};

// Test runner
const runTests = async () => {
    console.log('🧪 Starting API Tests...\n');
    
    let passed = 0;
    let failed = 0;
    const results = [];

    // Setup test database
    await setupTestDatabase();

    // Run all test suites
    for (const [suiteName, suite] of Object.entries(testSuites)) {
        console.log(`📋 Running ${suiteName} tests...`);
        
        for (const [testName, testFn] of Object.entries(suite)) {
            try {
                // Clean up before each test
                await helpers.cleanupTestData();
                
                const result = await testFn();
                if (result) {
                    console.log(`  ✅ ${testName}: PASSED`);
                    passed++;
                } else {
                    console.log(`  ❌ ${testName}: FAILED`);
                    failed++;
                }
                results.push({ suite: suiteName, test: testName, passed: result });
            } catch (error) {
                console.log(`  ❌ ${testName}: ERROR - ${error.message}`);
                failed++;
                results.push({ suite: suiteName, test: testName, passed: false, error: error.message });
            }
        }
        console.log('');
    }

    // Cleanup
    await cleanupTestDatabase();

    // Summary
    console.log('📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);

    return { passed, failed, results };
};

// Export for use in test files
module.exports = {
    setupTestDatabase,
    cleanupTestDatabase,
    testData,
    helpers,
    testSuites,
    runTests
};
