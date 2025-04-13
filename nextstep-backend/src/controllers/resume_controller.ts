import { Request, Response } from 'express';
import { config } from '../config/config';
import fs from 'fs';
import path from 'path';
import { scoreResume } from '../services/resume_service';
import multer from 'multer';
import { CustomRequest } from "types/customRequest";
import { handleError } from "../utils/handle_error";

const getResumeScore = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const resumePath = path.resolve(config.resources.resumesDirectoryPath(), filename);
        const jobDescription = req.query.jobDescription as string;

        if (!fs.existsSync(resumePath)) {
            return res.status(404).send('Resume not found');
        }

        const scoreAndFeedback = await scoreResume(resumePath, jobDescription);
        return res.status(200).send(scoreAndFeedback);
    } catch (error) {
        handleError(error, res);
    }
};


export default {
    getResumeScore,
}; 