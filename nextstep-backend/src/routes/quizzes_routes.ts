import express from 'express';
import Quiz from '../controllers/quizzes_controller';

const router = express.Router();

router.get('/raw', Quiz.getQuizzesByTags);

router.post('/generate', Quiz.getGeneratedQuizBySubject);

router.post('/grade', Quiz.getGradedQuizByAnsweredQuiz);

export default router;