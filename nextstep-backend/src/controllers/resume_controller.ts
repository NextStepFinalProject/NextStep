import { Request, Response } from 'express';
import { config } from '../config/config';
import fs from 'fs';
import path from 'path';
import { scoreResume, streamScoreResume, getResumeTemplates,
    generateImprovedResume, parseResumeFields,
    saveParsedResume, getResumeByOwner, updateResume } from '../services/resume_service';
import multer from 'multer';
import {getResumeBuffer, resumeExists} from '../services/resources_service';
import { CustomRequest } from "types/customRequest";
import { handleError } from "../utils/handle_error";

// Simple in-memory cache: { [key: string]: { scoreAndFeedback, timestamp } }
const resumeScoreCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL_MS = 24* 60 * 60 * 1000; // 24 hour

const getCacheKey = (filename: string, jobDescription?: string) =>
    `${filename}::${jobDescription || ''}`;

const getResumeScore = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const resumePath = path.resolve(config.resources.resumesDirectoryPath(), filename);
        const jobDescription = req.query.jobDescription as string;

        if (!fs.existsSync(resumePath)) {
            return res.status(404).send('Resume not found');
        }

        const cacheKey = getCacheKey(filename, jobDescription);
        const cached = resumeScoreCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return res.status(200).send(cached.data);
        }

        const scoreAndFeedback = await scoreResume(resumePath, jobDescription);
        resumeScoreCache[cacheKey] = { data: scoreAndFeedback, timestamp: Date.now() };
        return res.status(200).send(scoreAndFeedback);
    } catch (error) {
        if (error instanceof TypeError) {
            return res.status(400).send(error.message);
        } else {
            handleError(error, res);
        }
    }
};

const getStreamResumeScore = async (req: CustomRequest, res: Response) => {
    try {
        const { filename } = req.params;
        const resumePath = path.resolve(config.resources.resumesDirectoryPath(), filename);
        const jobDescription = req.query.jobDescription as string;

        if (!fs.existsSync(resumePath)) {
            return res.status(404).send('Resume not found');
        }

        const cacheKey = getCacheKey(filename, jobDescription);
        const cached = resumeScoreCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            // Stream cached result as SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.write(`data: ${JSON.stringify({ ...cached.data, done: true })}\n\n`);
            res.end();
            return;
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
        let fullChunk = '';
        const [score, fullText] = await streamScoreResume(
            resumePath,
            jobDescription,
            (chunk) => {
                fullChunk += chunk;
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
        );

        // Send the final score
        res.write(`data: ${JSON.stringify({ score, done: true })}\n\n`);
        res.end();

        // Optionally cache the result (score and fullText)
        resumeScoreCache[cacheKey] = { data: { score, fullText }, timestamp: Date.now() };
        await updateResume(req.user.id, jobDescription, fullText, score);

    } catch (error) {
        if (error instanceof TypeError) {
            return res.status(400).send(error.message);
        } else {
            handleError(error, res);
        }
    }
};

const getTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await getResumeTemplates();
        return res.status(200).json(templates);
    } catch (error) {
        handleError(error, res);
    }
};

const generateResume = async (req: Request, res: Response) => {
    try {
        const { feedback, jobDescription, templateName } = req.body;
        
        if (!feedback || !jobDescription || !templateName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await generateImprovedResume(feedback, jobDescription, templateName);
        return res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};


const parseResume = async (req: CustomRequest, res: Response) => {
    try {
      if (!req.body.resumefileName) {
        return res.status(400).json({ error: 'No resume file uploaded' });
      }
      else if (!resumeExists(req.body.resumefileName)) {
          return res.status(400).json({ error: 'No resume file uploaded' });
      }

      const resumeFilename = req.body.resumefileName;
      const parsed = await parseResumeFields(getResumeBuffer(req.body.resumefileName), resumeFilename);
      const resumeData = await saveParsedResume(parsed, req.user.id, resumeFilename, req.body.originfilename);

      return res.status(200).json(parsed);
    } catch (err: any) {
      console.error('Error parsing resume:', err);
      return handleError(err, res);
    }
  };

const getResume = async (req: CustomRequest, res: Response) => {
    try {
        const ownerId = req.user.id;
        const resume = await getResumeByOwner(ownerId);

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        return res.status(200).json(resume);
    } catch (error) {
        console.error('Error retrieving resume:', error);
        return handleError(error, res);
    }
}


const getResumeData = async (req: CustomRequest, res: Response) => {
    try {
        const ownerId = req.user.id;
        // Get the optional version parameter from query string
        const version = req.query.version ? parseInt(req.query.version as string) : undefined;
        const resume = await getResumeByOwner(ownerId, version);

        return res.status(200).json(resume);
    } catch (error) {
        console.error('Error retrieving resume data:', error);
        return handleError(error, res);
    }
};

export default { parseResume, getResumeScore,
    getStreamResumeScore, getTemplates,
    generateResume, getResumeData, getResume };