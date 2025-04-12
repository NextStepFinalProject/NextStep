import express, { Request, Response } from 'express';
import Resume from '../controllers/resume_controller';
import { CustomRequest } from "types/customRequest";

const router = express.Router();

router.get('/score/:filename', Resume.getResumeScore);

export default router; 