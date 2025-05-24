import express from 'express';
import { getJobsBySkillsAndRole, viewJobDetails } from '../controllers/linkedin_jobs_controller';

const router = express.Router();

router.get('/jobs', getJobsBySkillsAndRole);
router.get('/jobs/:id', viewJobDetails);

export default router;
