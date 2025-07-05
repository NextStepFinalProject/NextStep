import { config } from '../config/config';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { Request } from 'express';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const createFilesStorage = () => {
    // Ensure the directory exists
    const filesResourcesDir = config.resources.filesDirectoryPath();
    if (!fs.existsSync(filesResourcesDir)) {
        fs.mkdirSync(filesResourcesDir, { recursive: true });
    }

    const filesStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `${filesResourcesDir}/`);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const id = randomUUID();
            cb(null, id + ext);
        }
    });

    return multer({
        storage: filesStorage,
        limits: {
            fileSize: config.resources.fileMaxSize()
        },
        fileFilter: (req, file, cb) => {
            const allowedExts  = ['.pdf', '.doc', '.docx', '.docs'];
            const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            const ext  = path.extname(file.originalname).toLowerCase();
            const mime = file.mimetype;
            if (allowedExts.includes(ext) && allowedMimes.includes(mime)) {
                return cb(null, true);
            } else {
                return cb(new TypeError(`Invalid file type (${mime}). Allowed: ${allowedExts.join(', ')}`));
            }
        }
    });
};

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

const uploadFile = (req: MulterRequest): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        createFilesStorage().single('file')(req, {} as any, (error) => {
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

const getResumePath = (filename: string): string => {
    const resumesDirectoryPath = config.resources.resumesDirectoryPath();
    const resumePath = path.resolve(resumesDirectoryPath, filename);

    if (!fs.existsSync(resumePath)) {
        throw new TypeError('Resume not found');
    }

    return resumePath;
}

const getResumeBuffer = (filename: string): Buffer => {
    const resumePath = getResumePath(filename);

    try {
        return fs.readFileSync(resumePath);
    } catch (error: any) {
        throw new Error(`Failed to read resume file: ${error.message}`);
    }
}

const resumeExists = (filename: string): boolean => {
    const resumesDirectoryPath = config.resources.resumesDirectoryPath();
    const resumePath = path.resolve(resumesDirectoryPath, filename);
    return fs.existsSync(resumePath);
};


export { uploadImage, uploadResume, getResumeBuffer, resumeExists, uploadFile };