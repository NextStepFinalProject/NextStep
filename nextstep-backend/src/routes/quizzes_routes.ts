import express from 'express';
import Quiz from '../controllers/quizzes_controller';

const router = express.Router();

router.get('/raw', Quiz.getQuizzesByTags);

router.get('/generate/:subject', Quiz.getGeneratedQuizBySubject);

export default router;