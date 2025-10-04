const nodemailer = require('nodemailer');
const { logger } = require('./errorHandler');

// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};

// Create transporter
let transporter = null;

const initEmailService = async () => {
    try {
        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            console.log('⚠️ Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
            return false;
        }

        transporter = nodemailer.createTransporter(emailConfig);
        
        // Verify connection
        await transporter.verify();
        console.log('✅ Email service initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Email service initialization failed:', error.message);
        return false;
    }
};

// Email templates
const emailTemplates = {
    welcome: (userName) => ({
        subject: 'Welcome to Internship Management System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to Internship Management System!</h2>
                <p>Hello ${userName},</p>
                <p>Welcome to our internship management platform. You can now:</p>
                <ul>
                    <li>Browse available internship opportunities</li>
                    <li>Apply for positions that match your skills</li>
                    <li>Track your application status</li>
                    <li>Manage your profile and skills</li>
                </ul>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br>The Internship Management Team</p>
            </div>
        `
    }),

    applicationSubmitted: (studentName, jobTitle, companyName) => ({
        subject: 'Application Submitted Successfully',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Application Submitted Successfully!</h2>
                <p>Hello ${studentName},</p>
                <p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been submitted successfully.</p>
                <p>We will review your application and get back to you soon. You can track your application status in your dashboard.</p>
                <p>Thank you for your interest!</p>
                <p>Best regards,<br>The Internship Management Team</p>
            </div>
        `
    }),

    interviewScheduled: (studentName, jobTitle, companyName, interviewDate, interviewTime, mode, location) => ({
        subject: 'Interview Scheduled',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Interview Scheduled!</h2>
                <p>Hello ${studentName},</p>
                <p>Congratulations! You have been selected for an interview for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">Interview Details:</h3>
                    <p><strong>Date:</strong> ${interviewDate}</p>
                    <p><strong>Time:</strong> ${interviewTime}</p>
                    <p><strong>Mode:</strong> ${mode}</p>
                    ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
                </div>
                <p>Please prepare well and arrive on time. Good luck!</p>
                <p>Best regards,<br>The Internship Management Team</p>
            </div>
        `
    }),

    applicationStatusUpdate: (studentName, jobTitle, companyName, status) => ({
        subject: 'Application Status Update',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Application Status Update</h2>
                <p>Hello ${studentName},</p>
                <p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">New Status: <span style="color: #2563eb;">${status}</span></h3>
                </div>
                <p>You can view more details in your dashboard.</p>
                <p>Best regards,<br>The Internship Management Team</p>
            </div>
        `
    }),

    passwordReset: (userName, resetLink) => ({
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hello ${userName},</p>
                <p>You have requested to reset your password. Click the link below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                </div>
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>Best regards,<br>The Internship Management Team</p>
            </div>
        `
    }),

    jobPosted: (companyName, jobTitle, jobDescription) => ({
        subject: 'New Job Posted',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Job Opportunity!</h2>
                <p>Hello,</p>
                <p><strong>${companyName}</strong> has posted a new job opportunity:</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">${jobTitle}</h3>
                    <p>${jobDescription.substring(0, 200)}${jobDescription.length > 200 ? '...' : ''}</p>
                </div>
                <p>Log in to your account to view the full job description and apply!</p>
                <p>Best regards,<br>The Internship Management Team</p>
            </div>
        `
    })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
    if (!transporter) {
        logger.warn('Email service not initialized');
        return { success: false, message: 'Email service not available' };
    }

    try {
        const emailTemplate = emailTemplates[template];
        if (!emailTemplate) {
            throw new Error(`Email template '${template}' not found`);
        }

        const emailContent = typeof emailTemplate === 'function' 
            ? emailTemplate(...data) 
            : emailTemplate;

        const mailOptions = {
            from: `"Internship Management System" <${emailConfig.auth.user}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            ...emailContent
        };

        const result = await transporter.sendMail(mailOptions);
        
        logger.info(`Email sent successfully to ${to}`, {
            messageId: result.messageId,
            template,
            recipient: to
        });

        return {
            success: true,
            messageId: result.messageId,
            message: 'Email sent successfully'
        };
    } catch (error) {
        logger.error('Email sending failed', {
            error: error.message,
            template,
            recipient: to
        });

        return {
            success: false,
            message: 'Failed to send email',
            error: error.message
        };
    }
};

// Send bulk emails
const sendBulkEmail = async (recipients, template, data = {}) => {
    const results = [];
    
    for (const recipient of recipients) {
        const result = await sendEmail(recipient, template, data);
        results.push({ recipient, ...result });
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
};

// Send custom email
const sendCustomEmail = async (to, subject, html, text = null) => {
    if (!transporter) {
        logger.warn('Email service not initialized');
        return { success: false, message: 'Email service not available' };
    }

    try {
        const mailOptions = {
            from: `"Internship Management System" <${emailConfig.auth.user}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };

        const result = await transporter.sendMail(mailOptions);
        
        logger.info(`Custom email sent successfully to ${to}`, {
            messageId: result.messageId,
            subject
        });

        return {
            success: true,
            messageId: result.messageId,
            message: 'Email sent successfully'
        };
    } catch (error) {
        logger.error('Custom email sending failed', {
            error: error.message,
            subject,
            recipient: to
        });

        return {
            success: false,
            message: 'Failed to send email',
            error: error.message
        };
    }
};

// Email notification service
const notificationService = {
    async notifyApplicationSubmitted(studentEmail, studentName, jobTitle, companyName) {
        return await sendEmail(studentEmail, 'applicationSubmitted', [studentName, jobTitle, companyName]);
    },

    async notifyInterviewScheduled(studentEmail, studentName, jobTitle, companyName, interviewDate, interviewTime, mode, location) {
        return await sendEmail(studentEmail, 'interviewScheduled', [studentName, jobTitle, companyName, interviewDate, interviewTime, mode, location]);
    },

    async notifyApplicationStatusUpdate(studentEmail, studentName, jobTitle, companyName, status) {
        return await sendEmail(studentEmail, 'applicationStatusUpdate', [studentName, jobTitle, companyName, status]);
    },

    async notifyNewJobPosted(studentEmails, companyName, jobTitle, jobDescription) {
        return await sendBulkEmail(studentEmails, 'jobPosted', [companyName, jobTitle, jobDescription]);
    },

    async sendWelcomeEmail(studentEmail, studentName) {
        return await sendEmail(studentEmail, 'welcome', [studentName]);
    },

    async sendPasswordResetEmail(userEmail, userName, resetLink) {
        return await sendEmail(userEmail, 'passwordReset', [userName, resetLink]);
    }
};

module.exports = {
    initEmailService,
    sendEmail,
    sendBulkEmail,
    sendCustomEmail,
    notificationService,
    emailTemplates
};
