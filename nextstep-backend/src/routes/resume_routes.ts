import express, { Request, Response } from 'express';
import Resume from '../controllers/resume_controller';
import { CustomRequest } from "types/customRequest";

const router = express.Router();

router.get('/score/:filename', Resume.getResumeScore);

router.get('/streamScore/:filename', Resume.getStreamResumeScore);

export default router; 