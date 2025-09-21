const express = require('express');
const { executeQuery } = require('../database/connection');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        // Get overall statistics
        const statsResult = await executeQuery(`
            SELECT 
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(*) FROM company) as total_companies,
                (SELECT COUNT(*) FROM jobs WHERE status = 'Active') as active_jobs,
                (SELECT COUNT(*) FROM application) as total_applications,
                (SELECT COUNT(*) FROM interview WHERE status = 'Scheduled') as upcoming_interviews,
                (SELECT COUNT(*) FROM application WHERE status = 'Selected') as selected_applications
        `);

        // Get monthly trends
        const trendsResult = await executeQuery(`
            SELECT 
                DATE_FORMAT(application_date, '%Y-%m') as month,
                COUNT(*) as applications,
                COUNT(DISTINCT stud_id) as unique_students,
                COUNT(DISTINCT job_id) as unique_jobs
            FROM application 
            WHERE application_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(application_date, '%Y-%m')
            ORDER BY month DESC
        `);

        // Get top skills
        const skillsResult = await executeQuery(`
            SELECT 
                s.skill_name,
                s.category,
                COUNT(js.job_id) as jobs_requiring_skill,
                COUNT(ss.stud_id) as students_with_skill
            FROM skills s
            LEFT JOIN job_skills js ON s.skill_id = js.skill_id
            LEFT JOIN student_skills ss ON s.skill_id = ss.skill_id
            GROUP BY s.skill_id, s.skill_name, s.category
            HAVING COUNT(js.job_id) > 0
            ORDER BY jobs_requiring_skill DESC
            LIMIT 10
        `);

        // Get geographic distribution
        const geoResult = await executeQuery(`
            SELECT 
                j.city,
                j.state,
                COUNT(DISTINCT j.job_id) as total_jobs,
                COUNT(DISTINCT a.app_id) as total_applications,
                AVG(j.salary) as avg_salary
            FROM jobs j
            LEFT JOIN application a ON j.job_id = a.job_id
            WHERE j.status = 'Active'
            GROUP BY j.city, j.state
            ORDER BY total_jobs DESC
            LIMIT 10
        `);

        if (statsResult.success && trendsResult.success && skillsResult.success && geoResult.success) {
            res.json({
                success: true,
                data: {
                    overview: statsResult.data[0],
                    trends: trendsResult.data,
                    topSkills: skillsResult.data,
                    geographicDistribution: geoResult.data
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard analytics',
                error: 'Database query failed'
            });
        }
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching dashboard analytics',
            error: error.message
        });
    }
});

// Get student analytics
router.get('/students', async (req, res) => {
    try {
        const { stud_id } = req.query;

        if (stud_id) {
            // Get specific student analytics
            const studentResult = await executeQuery(`
                SELECT * FROM v_student_dashboard WHERE stud_id = ?
            `, [stud_id]);

            if (studentResult.success && studentResult.data.length > 0) {
                res.json({
                    success: true,
                    data: studentResult.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
        } else {
            // Get all students analytics
            const studentsResult = await executeQuery(`
                SELECT * FROM v_student_dashboard 
                ORDER BY total_applications DESC, avg_interview_score DESC
            `);

            if (studentsResult.success) {
                res.json({
                    success: true,
                    data: studentsResult.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch student analytics',
                    error: studentsResult.error
                });
            }
        }
    } catch (error) {
        console.error('Student analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student analytics',
            error: error.message
        });
    }
});

// Get company analytics
router.get('/companies', async (req, res) => {
    try {
        const { comp_id } = req.query;

        if (comp_id) {
            // Get specific company analytics
            const companyResult = await executeQuery(`
                SELECT * FROM v_company_dashboard WHERE comp_id = ?
            `, [comp_id]);

            if (companyResult.success && companyResult.data.length > 0) {
                res.json({
                    success: true,
                    data: companyResult.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }
        } else {
            // Get all companies analytics
            const companiesResult = await executeQuery(`
                SELECT * FROM v_company_dashboard 
                ORDER BY total_applications DESC, avg_rating DESC
            `);

            if (companiesResult.success) {
                res.json({
                    success: true,
                    data: companiesResult.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch company analytics',
                    error: companiesResult.error
                });
            }
        }
    } catch (error) {
        console.error('Company analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company analytics',
            error: error.message
        });
    }
});

// Get job analytics
router.get('/jobs', async (req, res) => {
    try {
        const { job_id } = req.query;

        if (job_id) {
            // Get specific job analytics
            const jobResult = await executeQuery(`
                SELECT * FROM v_job_application_summary WHERE job_id = ?
            `, [job_id]);

            if (jobResult.success && jobResult.data.length > 0) {
                res.json({
                    success: true,
                    data: jobResult.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Job not found'
                });
            }
        } else {
            // Get all jobs analytics
            const jobsResult = await executeQuery(`
                SELECT * FROM v_job_application_summary 
                ORDER BY total_applications DESC, posted_date DESC
            `);

            if (jobsResult.success) {
                res.json({
                    success: true,
                    data: jobsResult.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch job analytics',
                    error: jobsResult.error
                });
            }
        }
    } catch (error) {
        console.error('Job analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching job analytics',
            error: error.message
        });
    }
});

// Get interview analytics
router.get('/interviews', async (req, res) => {
    try {
        const { status, mode, upcoming } = req.query;
        
        let sql = 'SELECT * FROM v_interview_schedule WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND interview_status = ?';
            params.push(status);
        }

        if (mode) {
            sql += ' AND mode = ?';
            params.push(mode);
        }

        if (upcoming === 'true') {
            sql += ' AND interview_date >= NOW() AND interview_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)';
        }

        sql += ' ORDER BY interview_date';

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch interview analytics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Interview analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching interview analytics',
            error: error.message
        });
    }
});

// Get skill analytics
router.get('/skills', async (req, res) => {
    try {
        const { category } = req.query;
        
        let sql = `
            SELECT 
                s.skill_name,
                s.category,
                COUNT(js.job_id) as jobs_requiring_skill,
                COUNT(ss.stud_id) as students_with_skill,
                ROUND((COUNT(ss.stud_id) / COUNT(js.job_id)) * 100, 2) as supply_demand_ratio
            FROM skills s
            LEFT JOIN job_skills js ON s.skill_id = js.skill_id
            LEFT JOIN student_skills ss ON s.skill_id = ss.skill_id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            sql += ' AND s.category = ?';
            params.push(category);
        }

        sql += ' GROUP BY s.skill_id, s.skill_name, s.category HAVING COUNT(js.job_id) > 0 ORDER BY jobs_requiring_skill DESC';

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch skill analytics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Skill analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching skill analytics',
            error: error.message
        });
    }
});

// Get application timeline
router.get('/timeline', async (req, res) => {
    try {
        const { stud_id, job_id, app_id } = req.query;
        
        let sql = 'SELECT * FROM v_application_timeline WHERE 1=1';
        const params = [];

        if (stud_id) {
            sql += ' AND stud_id = ?';
            params.push(stud_id);
        }

        if (job_id) {
            sql += ' AND job_id = ?';
            params.push(job_id);
        }

        if (app_id) {
            sql += ' AND app_id = ?';
            params.push(app_id);
        }

        sql += ' ORDER BY app_id, status_change_date';

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application timeline',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Application timeline error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching application timeline',
            error: error.message
        });
    }
});

// Get monthly statistics
router.get('/monthly', async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let sql = 'SELECT * FROM v_monthly_statistics WHERE 1=1';
        const params = [];

        if (year) {
            sql += ' AND year = ?';
            params.push(year);
        }

        if (month) {
            sql += ' AND month = ?';
            params.push(month);
        }

        sql += ' ORDER BY year DESC, month DESC';

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch monthly statistics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Monthly statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching monthly statistics',
            error: error.message
        });
    }
});

// Get company reviews analytics
router.get('/reviews', async (req, res) => {
    try {
        const { comp_id } = req.query;
        
        let sql = 'SELECT * FROM v_company_reviews_summary WHERE 1=1';
        const params = [];

        if (comp_id) {
            sql += ' AND comp_id = ?';
            params.push(comp_id);
        }

        sql += ' ORDER BY avg_rating DESC, total_reviews DESC';

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch company reviews analytics',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Company reviews analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company reviews analytics',
            error: error.message
        });
    }
});

// Get student skills matrix
router.get('/skills-matrix', async (req, res) => {
    try {
        const { stud_id } = req.query;
        
        let sql = 'SELECT * FROM v_student_skills_matrix WHERE 1=1';
        const params = [];

        if (stud_id) {
            sql += ' AND stud_id = ?';
            params.push(stud_id);
        }

        sql += ' ORDER BY stud_id, skill_category, skill_name';

        const result = await executeQuery(sql, params);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch student skills matrix',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Student skills matrix error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student skills matrix',
            error: error.message
        });
    }
});

// Get matching students for jobs
router.get('/job-matches/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const result = await executeQuery(`
            SELECT 
                s.stud_id,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                j.title as job_title,
                c.name as company_name,
                GROUP_CONCAT(sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') as matching_skills,
                COUNT(js.skill_id) as matching_skills_count,
                COUNT(DISTINCT js.skill_id) as total_required_skills,
                ROUND((COUNT(js.skill_id) / COUNT(DISTINCT js.skill_id)) * 100, 2) as skill_match_percentage
            FROM students s
            JOIN student_skills ss ON s.stud_id = ss.stud_id
            JOIN skills sk ON ss.skill_id = sk.skill_id
            JOIN job_skills js ON sk.skill_id = js.skill_id
            JOIN jobs j ON js.job_id = j.job_id
            JOIN company c ON j.comp_id = c.comp_id
            WHERE j.job_id = ? AND j.status = 'Active'
            GROUP BY s.stud_id, s.first_name, s.last_name, j.title, c.name
            HAVING skill_match_percentage >= 50
            ORDER BY skill_match_percentage DESC, matching_skills_count DESC
        `, [jobId]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch job matches',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Job matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching job matches',
            error: error.message
        });
    }
});

module.exports = router;
