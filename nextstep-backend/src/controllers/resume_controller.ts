import { Request, Response } from 'express';
import { config } from '../config/config';
import fs from 'fs';
import path from 'path';
import { uploadResume } from '../services/resources_service';
import { scoreResume } from '../services/resume_service';
import multer from 'multer';
import { CustomRequest } from "types/customRequest";
import { handleError } from "../utils/handle_error";

const uploadAndScoreResume = async (req: CustomRequest, res: Response) => {
    try {
        const resumeFilename = await uploadResume(req);
        const resumePath = path.resolve(config.resources.resumesDirectoryPath(), resumeFilename);
        const jobDescription = req.body.jobDescription;
        
        const score = await scoreResume(resumePath, jobDescription);

        return res.status(201).json({
            resumeFilename,
            score,
            message: 'Resume uploaded and scored successfully'
        });
    } catch (error) {
        if (error instanceof multer.MulterError || error instanceof TypeError) {
            return res.status(400).send(error.message);
        } else {
            handleError(error, res);
        }
    }
};

const getResumeScore = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const resumePath = path.resolve(config.resources.resumesDirectoryPath(), filename);
        const jobDescription = req.query.jobDescription as string;

        if (!fs.existsSync(resumePath)) {
            return res.status(404).send('Resume not found');
        }

        const score = await scoreResume(resumePath, jobDescription);
        return res.status(200).json({ score });
    } catch (error) {
        handleError(error, res);
    }
};

const getResumeFile = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const resumePath = path.resolve(config.resources.resumesDirectoryPath(), filename);

        if (!fs.existsSync(resumePath)) {
            return res.status(404).send('Resume not found');
        }

        res.sendFile(resumePath);
    } catch (error) {
        handleError(error, res);
    }
};

export default {
    uploadAndScoreResume,
    getResumeScore,
    getResumeFile
}; 