import express from 'express';
import Quiz from '../controllers/quizzes_controller';

const router = express.Router();

router.get('/', Quiz.getQuizzesByTags);

export default router;