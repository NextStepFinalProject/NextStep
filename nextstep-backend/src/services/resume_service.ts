import { config } from '../config/config';
import path from 'path';
import fs from 'fs';
import { chatWithAI, streamChatWithAI } from './chat_api_service';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import AdmZip from 'adm-zip';
import { DOMParser, XMLSerializer } from 'xmldom';
import { ParsedResume } from 'types/resume_types';
import {createResumeExtractionPrompt, createResumeModificationPrompt, feedbackTemplate, SYSTEM_TEMPLATE} from "../utils/resume_handlers/resume_AI_handler";
import { parseDocument } from '../utils/resume_handlers/resume_files_handler';
import {ResumeModel} from "../models/resume_model";
import {PostModel} from "../models/posts_model";





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
): Promise<number> => {
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

        return finalScore;
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

const getResumeTemplates = async (): Promise<{ name: string; content: string; type: string }[]> => {
    try {
        const templatesDir = config.assets.resumeTemplatesDirectoryPath();
        if (!fs.existsSync(templatesDir)) {
            return [];
        }

        const files = fs.readdirSync(templatesDir);
        const templates = await Promise.all(
            files
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.pdf', '.doc', '.docx'].includes(ext);
                })
                .map(async file => {
                    const filePath = path.join(templatesDir, file);
                    const content = fs.readFileSync(filePath);
                    const base64Content = content.toString('base64');
                    const mimeType = {
                        '.pdf': 'application/pdf',
                        '.doc': 'application/msword',
                        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    }[path.extname(file).toLowerCase()] || 'application/octet-stream';

                    return {
                        name: path.basename(file),
                        content: base64Content,
                        type: mimeType
                    };
                })
        );

        return templates;
    } catch (error) {
        console.error('Error reading resume templates:', error);
        return [];
    }
};

// Helper to split a string into N parts
function splitString(str: string, parts: number): string[] {
    const len = Math.ceil(str.length / parts);
    return Array.from({ length: parts }, (_, i) => str.slice(i * len, (i + 1) * len));
}

const generateImprovedResume = async (
    feedback: string,
    jobDescription: string,
    templateName: string
): Promise<{ content: string; type: string }> => {
    try {
        const templatesDir = config.assets.resumeTemplatesDirectoryPath();
        const templatePath = path.join(templatesDir, templateName);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template ${templateName} not found`);
        }

        // Only handle DOCX files for now
        if (!templateName.toLowerCase().endsWith('.docx')) {
            throw new Error('Only DOCX templates are currently supported');
        }

        // Read and unzip the DOCX template
        const zip = new AdmZip(templatePath);
        const documentXml = zip.getEntry('word/document.xml');
        if (!documentXml) {
            throw new Error('Could not find document.xml in the template');
        }

        // Parse the XML content
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml.getData().toString(), 'text/xml');

        // Extract the content structure with full XML context
        const paragraphs = xmlDoc.getElementsByTagName('w:p');
        const contentStructure = [];
        
        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            const runs = paragraph.getElementsByTagName('w:r');
            const paragraphContent = [];
            
            // Get paragraph properties
            const pPr = paragraph.getElementsByTagName('w:pPr')[0];
            const paragraphStyle = pPr ? pPr.toString().replace(/"/g, '\\"') : '';
            
            for (let j = 0; j < runs.length; j++) {
                const run = runs[j];
                const text = run.getElementsByTagName('w:t')[0];
                if (text) {
                    // Get run properties
                    const rPr = run.getElementsByTagName('w:rPr')[0];
                    const runStyle = rPr ? rPr.toString().replace(/"/g, '\\"') : '';
                    
                    paragraphContent.push({
                        text: text.textContent,
                        style: runStyle
                    });
                }
            }
            
            if (paragraphContent.length > 0) {
                contentStructure.push({
                    type: 'paragraph',
                    content: paragraphContent,
                    style: paragraphStyle
                });
            }
        }

        // Convert structure to readable text for AI while preserving context
        const readableContent = contentStructure.map((para, index) => {
            const content = para.content.map(run => run.text).join('');
            return `[Paragraph ${index + 1}]
Content: ${content}`;
        }).join('\n\n');

        // Prepare the prompt for AI to modify the content
        const prompt = createResumeModificationPrompt(readableContent, feedback, jobDescription);

        // Get the modified content from AI
        const modifiedContent = await chatWithAI(SYSTEM_TEMPLATE, [prompt]);
        console.debug('AI Response:', modifiedContent); // Debug log
        
        let modifiedParagraphs;
        try {
            // Clean the response to ensure it's valid JSON
            const cleanedResponse = modifiedContent.trim()
                .replace(/^```json\s*/, '')
                .replace(/```\s*$/, '')
                .replace(/^\[/, '[')
                .replace(/\]$/, ']')
                .replace(/\n/g, ' ') // Remove newlines that might break JSON
                .replace(/\r/g, '')  // Remove carriage returns
                .replace(/\t/g, ' ') // Replace tabs with spaces
                .replace(/\s+/g, ' '); // Normalize whitespace
            
            modifiedParagraphs = JSON.parse(cleanedResponse);
            
            // Validate the structure
            if (!Array.isArray(modifiedParagraphs)) {
                throw new Error('Response is not an array');
            }
            
            for (const para of modifiedParagraphs) {
                if (!para.text || typeof para.text !== 'string') {
                    throw new Error('Invalid paragraph structure: missing or invalid text property');
                }
            }
            
        } catch (error: any) {
            console.error('Error parsing AI response:', error);
            console.error('Raw AI response:', modifiedContent);
            throw new Error(`Failed to parse AI response: ${error.message}`);
        }

        // Update the document with modified content while preserving structure
        for (let i = 0; i < paragraphs.length && i < modifiedParagraphs.length; i++) {
            const paragraph = paragraphs[i];
            const modifiedParagraph = modifiedParagraphs[i];
            const runs = paragraph.getElementsByTagName('w:r');
            
            // Update the first run's text content while preserving its style
            if (runs.length > 0) {
                const firstRun = runs[0];
                const text = firstRun.getElementsByTagName('w:t')[0];
                if (text) {
                    text.textContent = modifiedParagraph.text;
                }
            }
        }

        // Serialize the modified XML
        const serializer = new XMLSerializer();
        const modifiedXml = serializer.serializeToString(xmlDoc);

        // Update the document.xml in the zip
        zip.updateFile('word/document.xml', Buffer.from(modifiedXml));

        // Get the modified DOCX as a buffer
        const modifiedDocxBuffer = zip.toBuffer();

        return {
            content: modifiedDocxBuffer.toString('base64'),
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
    } catch (error: any) {
        console.error('Error generating improved resume:', error);
        throw error;
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


const saveParsedResume = async (parsedData: ParsedResume, ownerId: string, resumeRawLink: string): Promise<ResumeData> => {
    const lastVersion = await getLatestResumeByUser(ownerId);
    const newVersion = lastVersion + 1;

    const newResume = new ResumeModel({
        owner: ownerId,
        version: newVersion,
        rawContentLink: resumeRawLink,
        parsedData: {
            aboutMe: parsedData.aboutMe,
            skills: parsedData.skills,
            roleMatch: parsedData.roleMatch,
            experience: parsedData.experience
        }
    });

    const savedResume = await newResume.save();
    return resumeToResumeData(savedResume);
};


const ysgetResumeByOwner = async (ownerId: string, version?: number) => {
    try {
        let query = {
            owner: ownerId
        };

        // If version is specified, add it to the query
        if (version !== undefined) {
            query = { ...query, version };
        }

        const resume = await ResumeModel.findOne(query)
            .sort(version === undefined ? { version: -1 } : {}) // Sort by version descending only if no specific version requested
            .exec();

        if (!resume) {
            throw new Error(version !== undefined
                ? `Resume version ${version} not found for user ${ownerId}`
                : `No resume found for user ${ownerId}`);
        }

        return resume;
    } catch (error) {
        console.error('Error retrieving resume:', error);
        throw error;
    }
};

export { scoreResume, streamScoreResume,
    getResumeTemplates, generateImprovedResume, parseResumeFields,
    saveParsedResume, getResumeByOwner };