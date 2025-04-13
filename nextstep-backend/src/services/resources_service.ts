import { config } from '../config/config';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { Request } from 'express';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const createImagesStorage = () => {
    // Ensure the directory exists
    const imagesResourcesDir = config.resources.imagesDirectoryPath();
    if (!fs.existsSync(imagesResourcesDir)) {
        fs.mkdirSync(imagesResourcesDir, { recursive: true });
    }

    const imagesStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `${imagesResourcesDir}/`);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const id = randomUUID();
            cb(null, id + ext);
        }
    });

    return multer({
        storage: imagesStorage,
        limits: {
            fileSize: config.resources.imageMaxSize()
        },
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (extname && mimetype) {
                return cb(null, true);
            } else {
                return cb(new TypeError(`Invalid file type. Only images are allowed: ${allowedTypes}`));
            }
        }
    });
};

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
            const allowedTypes = /pdf|doc|docx|txt|text/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (extname && mimetype) {
                return cb(null, true);
            } else {
                return cb(new TypeError(`Invalid file type. Only PDF, DOC, DOCX and TXT/TEXT files are allowed.`));
            }
        }
    });
};

const uploadImage = (req: MulterRequest): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        createImagesStorage().single('file')(req, {} as any, (error) => {
            if (error) {
                if (error instanceof multer.MulterError || error instanceof TypeError) {
                    return reject(error);
                } else if (!req.file) {
                    return reject(new TypeError('No file uploaded.'));
                } else {
                    return reject(new Error('Internal Server Error'));
                }
            }
            if (!req.file) {
                return reject(new TypeError('No file uploaded.'));
            }
            resolve(req.file.filename);
        });
    });
};

const uploadResume = (req: MulterRequest): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        createResumesStorage().single('file')(req, {} as any, (error) => {
            if (error) {
                if (error instanceof multer.MulterError || error instanceof TypeError) {
                    return reject(error);
                } else if (!req.file) {
                    return reject(new TypeError('No file uploaded.'));
                } else {
                    return reject(new Error('Internal Server Error'));
                }
            }
            if (!req.file) {
                return reject(new TypeError('No file uploaded.'));
            }
            resolve(req.file.filename);
        });
    });
};

export { uploadImage, uploadResume };