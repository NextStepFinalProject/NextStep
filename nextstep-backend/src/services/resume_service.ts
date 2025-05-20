import { config } from '../config/config';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { chatWithAI, streamChatWithAI } from './chat_api_service';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import AdmZip from 'adm-zip';
import { DOMParser, XMLSerializer } from 'xmldom';

export interface ParsedResume {
    aboutMe: string;
    skills:    string[];
    roleMatch: string;
    experience:string[];
    education?: string[];
}

const SYSTEM_TEMPLATE = `You are a very experienced ATS (Application Tracking System) bot with a deep understanding named Bob the Resume builder.
You will review resumes with or without job descriptions.
You are an expert in resume evaluation and provide constructive feedback with dynamic evaluation.
You should also provide an improvement table, taking into account:
- Content (Medium priority)
- Keyword matching (High priority)
- Hard skills (High priority)
- Soft skills (High priority)
- Overall presentation (Low priority)`;

const feedbackTemplate = (resumeText: string, jdText: string) => `
Resume Feedback Report
Here is the resume you provided:
${resumeText}
And the job description:
${jdText}

Create the Improvement Table in relevance to the resume and give the consideration and suggestion for each section strictly following 
the pattern as below and don't just out this guided pattern :
| Area          | Consideration                                                   | Status | Suggestions |
| ------------- | --------------------------------------------------------------- | ------ | ----------- |
| Content       | Measurable Results: At least 5 specific achievements or impact. |  Low   |             |
|               | Words to avoid: Negative phrases or clichés.                    |        |             |
| Keywords      | Hard Skills: Presence and frequency of hard skills.             |  High  |             |
|               | Soft Skills: Presence and frequency of soft skills.             |        |             |
| Presentation  | Education Match: Does the resume list a degree that matches the job requirements? |  High   |             |

Strengths:
List the strengths of the resume here.

Detailed Feedback:
Provide detailed feedback on the resume's content, structure, grammar, and relevance to the job description.

Suggestions:
Provide actionable suggestions for improvement, including specific keywords to include and skills to highlight.

Based on your analysis, provide a numerical score between 0-100 that represents the overall quality and match of the resume.
The score should be provided at the end of your response in the format: "SCORE: X" where X is the numerical score.
`;

const FEEDBACK_ERROR_MESSAGE = 'The Chat AI feature is turned off. Could not score your resume.';

const parseDocument = async (filePath: string): Promise<string> => {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        switch (ext) {
            case '.pdf':
                return await parsePdf(filePath);
            case '.docx':
            case '.doc':
                return await parseWord(filePath);
            case '.txt':
            case '.text':
                return fs.readFileSync(filePath, 'utf-8');
            default:
                throw new Error(`Unsupported file format: ${ext}`);
        }
    } catch (error: any) {
        console.error(`Error parsing document ${filePath}:`, error);
        throw new Error(`Failed to parse document: ${error.message}`);
    }
};

const parsePdf = async (filePath: string): Promise<string> => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error: any) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF document');
    }
};

const parseWord = async (filePath: string): Promise<string> => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error: any) {
        console.error('Error parsing Word document:', error);
        throw new Error('Failed to parse Word document');
    }
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
        const prompt = `You are a resume expert. Please modify the following resume content based on the feedback and job description.
        
Current Resume Content:
${readableContent}

Feedback:
${feedback}

Job Description:
${jobDescription}

IMPORTANT: You must return your response in the following EXACT JSON format. Do not include any other text or explanation:

[
  {
    "paragraphIndex": 0,
    "text": "First paragraph content here"
  }
]

Rules:
1. Return ONLY the JSON array, nothing else
2. Each paragraph must maintain its original structure
3. The text content should be updated based on the feedback while preserving formatting
4. Maintain the same number of paragraphs as the original
5. Do not include any markdown, formatting, or additional text`;

        // Get the modified content from AI
        const modifiedContent = await chatWithAI(SYSTEM_TEMPLATE, [prompt]);
        console.log('AI Response:', modifiedContent); // Debug log
        
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
    const prompt = `
  Extract from this resume the following fields as JSON:
    • "aboutMe": a 1–2 sentence self-summary.
    • "skills": an array of technical skills.
    • "roleMatch": one-sentence best-fit role suggestion.
    • "experience": an array of 3–5 bullet points of key achievements.
  
  Resume text:
  ---
  ${text}
  ---
    Respond with a single JSON object and nothing else. The json object should begin directly with parentheses and have the following structure: {"a": "value", "b": "value", ...}
  `;
  
    // 3) Call your Chat AI
    const aiResponse = await chatWithAI(
      SYSTEM_TEMPLATE,     // you can reuse your existing SYSTEM_TEMPLATE or define a new one
      [prompt]
    );
  
    // 4) Parse & return
    const parsed = JSON.parse(aiResponse.trim().replace("```json", "").replace("```", "")) as ParsedResume;
    return parsed;
  };

export { scoreResume, streamScoreResume, getResumeTemplates, generateImprovedResume, parseResumeFields };