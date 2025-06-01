import express, { Request, Response } from 'express';
import Resume from '../controllers/resume_controller';
import { CustomRequest } from "types/customRequest";
import multer from 'multer';
import * as commentsController from "../controllers/comments_controller";

const upload = multer(); 

const router = express.Router();

router.get('/score/:filename', Resume.getResumeScore);

router.get('/streamScore/:filename', Resume.getStreamResumeScore);

router.get('/templates', Resume.getTemplates);

router.post('/generate', Resume.generateResume);

router.post('/parseResume',  upload.single('resume'), (req: Request, res: Response) => Resume.parseResume(req as CustomRequest, res));

// TODO - Use it in the frontend after the parse and upload resume
router.get('/resumeData/:version', (req: Request, res: Response) => Resume.getResumeData(req as CustomRequest, res))


export default router; 