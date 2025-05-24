import { Request, Response } from 'express';
import * as companiesService from '../services/companies_service';
import { handleError } from '../utils/handle_error';


const getQuizzesByTags = async (req: Request, res: Response): Promise<void> => {
    try {
        const tagsQueryParams: string = typeof req.query.tags === 'string' ? req.query.tags : '';
        const tags = tagsQueryParams.split(',');
        const quizzes = await companiesService.searchQuizzesByTags(tags);        
        res.json(quizzes);
    } catch (err) {
        handleError(err, res);
    }
};

const getGeneratedQuizBySubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { subject } = req.body;

        if (!subject) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const generatedQuiz = await companiesService.generateQuiz(subject);
        res.json(generatedQuiz);
    } catch (err) {
        handleError(err, res);
    }
};

export default { getQuizzesByTags, getGeneratedQuizBySubject };