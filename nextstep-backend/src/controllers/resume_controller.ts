import { Request, Response } from 'express';
import { config } from '../config/config';
import fs from 'fs';
import path from 'path';
import { scoreResume, streamScoreResume, parseResumeFields } from '../services/resume_service';
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
        if (error instanceof TypeError) {
            return res.status(400).send(error.message);
        } else {
            handleError(error, res);
        }
    }
};

const getStreamResumeScore = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const resumePath = path.resolve(config.resources.resumesDirectoryPath(), filename);
        const jobDescription = req.query.jobDescription as string;

        if (!fs.existsSync(resumePath)) {
            return res.status(404).send('Resume not found');
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Handle client disconnect
        req.on('close', () => {
            res.end();
        });

        // Stream the response
        const score = await streamScoreResume(
            resumePath,
            jobDescription,
            (chunk) => {
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
        );

        // Send the final score
        res.write(`data: ${JSON.stringify({ score, done: true })}\n\n`);
        res.end();
    } catch (error) {
        if (error instanceof TypeError) {
            return res.status(400).send(error.message);
        } else {
            handleError(error, res);
        }
    }
};

const parseResume = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No resume file uploaded' });
      }
      const parsed = await parseResumeFields(req.file.buffer, req.file.originalname);
      return res.status(200).json(parsed);
    } catch (err: any) {
      console.error('Error parsing resume:', err);
      return handleError(err, res);
    }
  };

export default { parseResume, getResumeScore, getStreamResumeScore };