const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const ensureUploadDirs = async () => {
    const dirs = [
        'uploads',
        'uploads/resumes',
        'uploads/documents',
        'uploads/images',
        'uploads/temp'
    ];

    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`Error creating directory ${dir}:`, error);
            }
        }
    }
};

// File filter function
const fileFilter = (allowedTypes, maxSize = 5 * 1024 * 1024) => { // Default 5MB
    return (req, file, cb) => {
        // Check file size
        if (file.size && file.size > maxSize) {
            return cb(new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`), false);
        }

        // Check file type
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;

        const isValidType = allowedTypes.some(type => {
            if (typeof type === 'string') {
                return fileExtension === type || mimeType === type;
            }
            return type.test(fileExtension) || type.test(mimeType);
        });

        if (isValidType) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
    };
};

// Storage configuration
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await ensureUploadDirs();
        
        let uploadPath = 'uploads/temp';
        
        // Determine upload path based on file type
        if (file.fieldname === 'resume') {
            uploadPath = 'uploads/resumes';
        } else if (file.fieldname === 'document') {
            uploadPath = 'uploads/documents';
        } else if (file.fieldname === 'image' || file.fieldname === 'avatar') {
            uploadPath = 'uploads/images';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File upload configurations
const uploadConfigs = {
    // Resume upload
    resume: multer({
        storage,
        fileFilter: fileFilter([
            '.pdf',
            '.doc',
            '.docx',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ], 10 * 1024 * 1024), // 10MB for resumes
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 1
        }
    }).single('resume'),

    // Document upload
    document: multer({
        storage,
        fileFilter: fileFilter([
            '.pdf',
            '.doc',
            '.docx',
            '.txt',
            '.rtf',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/rtf'
        ], 5 * 1024 * 1024), // 5MB for documents
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
            files: 1
        }
    }).single('document'),

    // Image upload
    image: multer({
        storage,
        fileFilter: fileFilter([
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.webp',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ], 2 * 1024 * 1024), // 2MB for images
        limits: {
            fileSize: 2 * 1024 * 1024, // 2MB
            files: 1
        }
    }).single('image'),

    // Avatar upload
    avatar: multer({
        storage,
        fileFilter: fileFilter([
            '.jpg',
            '.jpeg',
            '.png',
            'image/jpeg',
            'image/png'
        ], 1 * 1024 * 1024), // 1MB for avatars
        limits: {
            fileSize: 1 * 1024 * 1024, // 1MB
            files: 1
        }
    }).single('avatar'),

    // Multiple files upload
    multiple: multer({
        storage,
        fileFilter: fileFilter([
            '.pdf',
            '.doc',
            '.docx',
            '.txt',
            '.jpg',
            '.jpeg',
            '.png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png'
        ], 5 * 1024 * 1024), // 5MB per file
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB per file
            files: 5 // Maximum 5 files
        }
    }).array('files', 5)
};

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = 'File upload error';
        let code = 'UPLOAD_ERROR';

        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File size too large';
                code = 'FILE_TOO_LARGE';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files';
                code = 'TOO_MANY_FILES';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field';
                code = 'UNEXPECTED_FILE';
                break;
        }

        return res.status(400).json({
            success: false,
            message,
            code,
            details: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
            code: 'UPLOAD_VALIDATION_ERROR'
        });
    }

    next();
};

// File processing utilities
const fileUtils = {
    // Get file info
    getFileInfo: (file) => {
        if (!file) return null;
        
        return {
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date().toISOString()
        };
    },

    // Delete file
    deleteFile: async (filePath) => {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    },

    // Move file from temp to permanent location
    moveFile: async (sourcePath, destinationPath) => {
        try {
            await fs.mkdir(path.dirname(destinationPath), { recursive: true });
            await fs.rename(sourcePath, destinationPath);
            return destinationPath;
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    },

    // Get file URL
    getFileUrl: (filePath, baseUrl = '') => {
        if (!filePath) return null;
        const relativePath = filePath.replace(/\\/g, '/');
        return `${baseUrl}/${relativePath}`;
    },

    // Validate file exists
    fileExists: async (filePath) => {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }
};

// Cleanup old temporary files
const cleanupTempFiles = async (maxAge = 24 * 60 * 60 * 1000) => { // 24 hours
    try {
        const tempDir = 'uploads/temp';
        const files = await fs.readdir(tempDir);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old temp file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up temp files:', error);
    }
};

// Schedule cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = {
    uploadConfigs,
    handleUploadError,
    fileUtils,
    cleanupTempFiles,
    ensureUploadDirs
};
