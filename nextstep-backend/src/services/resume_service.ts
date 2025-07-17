import { config } from '../config/config';
import path from 'path';
import fs from 'fs';
import { chatWithAI, streamChatWithAI } from './chat_api_service';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import AdmZip from 'adm-zip';
import { DOMParser, XMLSerializer } from 'xmldom';
import {ParsedResume, ResumeData} from 'types/resume_types';
import {createResumeExtractionPrompt, createResumeModificationPrompt, feedbackTemplate, SYSTEM_TEMPLATE} from "../utils/resume_handlers/resume_AI_handler";
import { parseDocument } from '../utils/resume_handlers/resume_files_handler';
import {ResumeModel} from "../models/resume_model";
import {Document} from 'mongoose';





const FEEDBACK_ERROR_MESSAGE = 'The Chat AI feature is turned off. Could not score your resume.';


const resumeToResumeData = async (resume: Document<unknown, {}, any> & any): Promise<ResumeData> => {
    // The mongoose schema's toJSON transform already handles basic conversion
    // You could add additional fields here if needed in the future
    return resume.toJSON();
};

const scoreResume = async (resumePath: string, jobDescription?: string): Promise<{ score: number; feedback: string }> => {
    try {
        const resumeText = await parseDocument(resumePath);
        if (resumeText.trim() == '') {
            throw new TypeError('Could not parse the resume file');
        }
        const prompt = feedbackTemplate(resumeText, jobDescription || 'No job description provided.');

        let feedback = FEEDBACK_ERROR_MESSAGE;
        if (config.chatAi.turned_on()) {
            // Get feedback from the AI
            feedback = await chatWithAI(SYSTEM_TEMPLATE, [prompt]);
        }

        // Extract the score from the feedback
        const scoreMatch = feedback.match(/SCORE: (\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        return { score, feedback };
    } catch (error: any) {
        if (error instanceof TypeError) {
            console.error('TypeError while scoring resume:', error);
            throw error;
        } else {
            console.error('Unexpected error while scoring resume:', error);
            throw new Error('Failed to score resume');
        }
    }
};

const streamScoreResume = async (
    resumePath: string,
    jobDescription: string | undefined,
    onChunk: (chunk: string) => void
): Promise<[number, string]> => {
    try {
        const resumeText = await parseDocument(resumePath);
        if (resumeText.trim() == '') {
            throw new TypeError('Could not parse the resume file');
        }
        const prompt = feedbackTemplate(resumeText, jobDescription || 'No job description provided.');
        
        let fullResponse = '';
        let finalScore = 0;

        if (config.chatAi.turned_on()) {
            await streamChatWithAI(
                SYSTEM_TEMPLATE,
                [prompt],
                (chunk) => {
                    fullResponse += chunk;
                    onChunk(chunk);
                    
                    // Try to extract score from the accumulated response
                    const scoreMatch = fullResponse.match(/SCORE: (\d+)/);
                    if (scoreMatch) {
                        finalScore = parseInt(scoreMatch[1]);
                    }
                }
            );
        } else {
            onChunk(FEEDBACK_ERROR_MESSAGE);
        }

        return [finalScore, fullResponse];
    } catch (error: any) {
        if (error instanceof TypeError) {
            console.error('TypeError while streaming resume score:', error);
            throw error;
        } else {
            console.error('Unexpected error while streaming resume score:', error);
            throw new Error('Failed to stream resume score');
        }
    }
};

/**
 * Extracts raw text from the uploaded resume buffer,
 * prompts the AI to return { aboutMe, skills[], roleMatch, experience[] } as JSON.
 */
const parseResumeFields = async (
    fileBuffer: Buffer,
    originalName: string
  ): Promise<ParsedResume> => {
    // 1) Extract text
    const ext = path.extname(originalName).toLowerCase();
    let text: string;
    if (ext === '.pdf') {
      const data = await pdfParse(fileBuffer);
      text = data.text;
    } else {
      // mammoth supports buffer input
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      text = value;
    }
  
    // 2) Build the extraction prompt
    const prompt = createResumeExtractionPrompt(text);
  
    // 3) Call Chat AI
    const aiResponse = await chatWithAI(
      SYSTEM_TEMPLATE,
      [prompt]
    );
  
    // 4) Parse & return
    const parsed = JSON.parse(aiResponse.trim().replace("```json", "").replace("```", "")) as ParsedResume;
    return parsed;
  };


const getLatestResumeByUser = async (ownerId: string): Promise<number> => {
    try {
        const latestResume = await ResumeModel.findOne({ owner: ownerId })
            .sort({ version: -1 })
            .exec();

        return latestResume ? latestResume.version : 0; // Return version number or 0 if no resume exists
    } catch (error) {
        console.error('Error finding latest resume:', error);
        throw new Error('Failed to retrieve latest resume');
    }
};


const saveParsedResume = async (parsedData: ParsedResume, ownerId: string, resumeRawLink: string, filename: string): Promise<ResumeData> => {
    const lastVersion = await getLatestResumeByUser(ownerId);
    const newVersion = lastVersion + 1;

    const newResume = new ResumeModel({
        owner: ownerId,
        version: newVersion,
        rawContentLink: resumeRawLink,
        parsedData: {
            fileName: filename,
            aboutMe: parsedData.aboutMe,
            skills: parsedData.skills,
            roleMatch: parsedData.roleMatch,
            experience: parsedData.experience
        }
    });

    const savedResume = await newResume.save();
    return resumeToResumeData(savedResume);
};

const updateResume = async (ownerId: string, jobDescription: string, feedback?: string, score?: number, filename?: string): Promise<void> => {
    try {
        const resume = await getResumeByOwner(ownerId);
        if (!resume) {
            throw new Error(`Resume not found`);
        }
        const parsedData = resume.parsedData as ParsedResume; // Ensure parsedData is of type ParsedResume
        if (jobDescription !== parsedData.jobDescription) {
            resume.parsedData = {
                ...parsedData,
                jobDescription: jobDescription || parsedData.jobDescription,
                feedback: feedback || parsedData.feedback || '',
                score: score || parsedData.score || 0,
                fileName: parsedData.fileName || filename || ''
            };
            resume.markModified('parsedData');
            await resume.save();
            
        }
    }
    catch (error) {
            console.error('Error updating resume:', error);
            throw new Error(`Failed to update resume`);
        }
}

const getResumeByOwner = async (ownerId: string, version?: number) => {
    try {
        let query: {owner: string, version?: number} = {
            owner: ownerId,
        };

        // If version is specified, add it to the query
        if (version !== undefined) {
            query = { ...query, version };
        }

        const resume = await ResumeModel.findOne(query)
            .sort(version === undefined ? { version: -1 } : {}) // Sort by version descending only if no specific version requested
            .exec();

        if (!resume) {
            if (version !== undefined) {
                throw new Error(`Resume version ${version} not found for user ${ownerId}`);
            }
            console.log(`No resume found for user ${ownerId}`);
        }

        return resume;
    } catch (error) {
        console.error('Error retrieving resume:', error);
        throw error;
    }
};

export { scoreResume, streamScoreResume, parseResumeFields,
    saveParsedResume, getResumeByOwner, updateResume, };