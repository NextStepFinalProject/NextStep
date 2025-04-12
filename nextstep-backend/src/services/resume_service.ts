import { config } from '../config/config';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import axios from 'axios';

const createResumesStorage = () => {
    // Ensure the directory exists
    const resumesDirectoryPath = config.resources.resumesDirectoryPath();
    if (!fs.existsSync(resumesDirectoryPath)) {
        fs.mkdirSync(resumesDirectoryPath, { recursive: true });
    }

    const resumesStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `${resumesDirectoryPath}/`);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const id = randomUUID();
            cb(null, id + ext);
        }
    });

    return multer({
        storage: resumesStorage,
        limits: {
            fileSize: config.resources.resumeMaxSize()
        },
        fileFilter: (req, file, cb) => {
            const allowedTypes = /pdf|doc|docx/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (extname && mimetype) {
                return cb(null, true);
            } else {
                return cb(new TypeError(`Invalid file type. Only PDF, DOC, and DOCX files are allowed.`));
            }
        }
    });
};

// TODO - fix the type here
// @ts-ignore
const uploadResume = (req): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        // @ts-ignore
        createResumesStorage().single('file')(req, {}, (error) => {
            if (error) {
                if (error instanceof multer.MulterError || error instanceof TypeError) {
                    return reject(error);
                } else if (!req.file) {
                    return reject(new TypeError('No file uploaded.'));
                } else {
                    return reject(new Error('Internal Server Error'));
                }
            }
            resolve(req.file.filename);
        });
    });
};

const scoreResume = async (resumePath: string, jobDescription?: string): Promise<number> => {
    try {
        // Here you would integrate with an actual ATS system
        // For now, we'll return a mock score
        // In a real implementation, you would:
        // 1. Parse the resume text
        // 2. Compare it with the job description
        // 3. Calculate a score based on keywords, skills, experience, etc.
        
        // Mock implementation
        const score = Math.floor(Math.random() * 100);
        return score;
    } catch (error) {
        throw new Error('Failed to score resume');
    }
};

export { uploadResume, scoreResume }; 