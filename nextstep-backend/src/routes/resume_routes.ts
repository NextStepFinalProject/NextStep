import express, { Request, Response } from 'express';
import Resume from '../controllers/resume_controller';
import { CustomRequest } from "types/customRequest";
import multer from 'multer';

const upload = multer(); 

const router = express.Router();

router.get('/score/:filename', Resume.getResumeScore);

router.get('/streamScore/:filename', Resume.getStreamResumeScore);

router.get('/templates', Resume.getTemplates);

router.post('/generate', Resume.generateResume);

router.post('/parseResume',  upload.single('resume'), Resume.parseResume);

export default router; 