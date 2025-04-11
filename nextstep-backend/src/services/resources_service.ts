import { config } from '../config/config';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';

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

    // TODO - consider to make a Promise
    const uploadImage = multer({
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

    return uploadImage;
};

// TODO - fix the type here
// @ts-ignore
const uploadImage = (req) : Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        // @ts-ignore
        createImagesStorage().single('file')(req, {}, (error) => {
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

export { uploadImage };