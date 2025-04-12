import express, { Request, Response } from 'express';
import ResumeController from '../controllers/resume_controller';
import { CustomRequest } from "types/customRequest";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Upload and score a resume
router.post('/upload', authenticateToken, (req: Request, res: Response) => 
    ResumeController.uploadAndScoreResume(req as CustomRequest, res));

// Get score for an existing resume
router.get('/score/:filename', authenticateToken, (req: Request, res: Response) => 
    ResumeController.getResumeScore(req, res));

// Get resume file
router.get('/file/:filename', authenticateToken, (req: Request, res: Response) => 
    ResumeController.getResumeFile(req, res));

export default router; 