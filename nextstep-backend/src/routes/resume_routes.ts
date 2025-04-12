import express, { Request, Response } from 'express';
import ResumeController from '../controllers/resume_controller';
import { CustomRequest } from "types/customRequest";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Get score for an existing resume
router.get('/score/:filename', authenticateToken, (req: Request, res: Response) => 
    ResumeController.getResumeScore(req, res));

export default router; 