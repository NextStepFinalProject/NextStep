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

interface Run {
    text: string;
    style: string;
}

interface Paragraph {
    index: number;
    text: string;
    style: string;
    runs: Run[];
}

interface ResumeSections {
    header: Paragraph[];
    summary: Paragraph[];
    experience: Paragraph[];
    education: Paragraph[];
    skills: Paragraph[];
    other: Paragraph[];
}

interface ModifiedSection {
    text: string;
}

interface ModifiedSections {
    [key: string]: ModifiedSection[];
}

type SectionKey = keyof ResumeSections;

const generateImprovedResume = async (
    feedback: string,
    jobDescription: string,
    templateName: string,
    resumePath: string
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

        // Read and parse the user's resume
        const resumeText = await parseDocument(resumePath);
        if (resumeText.trim() == '') {
            throw new TypeError('Could not parse the resume file');
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
        
        // Identify different sections of the resume
        const sections = {
            header: [],
            summary: [],
            experience: [],
            education: [],
            skills: [],
            other: []
        } as ResumeSections;

        let currentSection = 'other' as SectionKey;
        
        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            const runs = paragraph.getElementsByTagName('w:r');
            const paragraphContent = [];
            
            // Get paragraph properties for styling
            const pPr = paragraph.getElementsByTagName('w:pPr')[0];
            const paragraphStyle = pPr ? pPr.toString().replace(/"/g, '\\"') : '';
            
            // Get the text content
            let fullText = '';
            for (let j = 0; j < runs.length; j++) {
                const run = runs[j];
                const text = run.getElementsByTagName('w:t')[0];
                if (text) {
                    fullText += text.textContent;
                }
            }

            // Identify section based on content and formatting
            const text = fullText.toLowerCase().trim();
            if (text.includes('summary') || text.includes('objective') || text.includes('profile')) {
                currentSection = 'summary' as SectionKey;
            } else if (text.includes('experience') || text.includes('work history') || text.includes('employment')) {
                currentSection = 'experience' as SectionKey;
            } else if (text.includes('education') || text.includes('academic')) {
                currentSection = 'education' as SectionKey;
            } else if (text.includes('skills') || text.includes('competencies')) {
                currentSection = 'skills' as SectionKey;
            } else if (i === 0) { // First paragraph is usually header
                currentSection = 'header' as SectionKey;
            }

            // Store paragraph with its section and style information
            sections[currentSection].push({
                index: i,
                text: fullText,
                style: paragraphStyle,
                runs: Array.from(runs).map(run => {
                    const text = run.getElementsByTagName('w:t')[0];
                    const rPr = run.getElementsByTagName('w:rPr')[0];
                    return {
                        text: text ? text.textContent || '' : '',
                        style: rPr ? rPr.toString().replace(/"/g, '\\"') : ''
                    };
                })
            });
        }

        // Prepare the prompt for AI to modify the content
        const prompt = `You are a resume expert. Please modify the following resume content based on the feedback and job description.
        
Original Resume Content:
${resumeText}

Template Structure:
${Object.entries(sections)
    .filter(([_, content]) => content.length > 0)
    .map(([section, content]) => 
        `[${section.toUpperCase()} SECTION]
${content.map((p: Paragraph) => p.text).join('\n')}`
    ).join('\n\n')}

Feedback:
${feedback}

Job Description:
${jobDescription}

IMPORTANT: You must return your response in the following EXACT JSON format. Do not include any other text or explanation:

{
  "header": [
    {
      "text": "Updated header text"
    }
  ],
  "summary": [
    {
      "text": "Updated summary text"
    }
  ],
  "experience": [
    {
      "text": "Updated experience text"
    }
  ],
  "education": [
    {
      "text": "Updated education text"
    }
  ],
  "skills": [
    {
      "text": "Updated skills text"
    }
  ],
  "other": [
    {
      "text": "Updated other text"
    }
  ]
}

Rules:
1. Return ONLY the JSON object, nothing else
2. Each section must maintain its original structure and formatting
3. The text content should be updated based on the feedback while preserving professional formatting
4. Maintain bullet points, lists, and other formatting elements
5. Keep the same number of paragraphs in each section
6. Do not include any markdown, formatting, or additional text
7. Ensure the content fits naturally within the template's layout
8. Maintain consistent spacing and alignment
9. Use relevant content from the original resume where appropriate
10. Ensure the content matches the job description requirements`;

        // Get the modified content from AI
        const modifiedContent = await chatWithAI(SYSTEM_TEMPLATE, [prompt]);
        console.log('AI Response:', modifiedContent); // Debug log
        
        let modifiedSections: ModifiedSections;
        try {
            // Clean the response to ensure it's valid JSON
            const cleanedResponse = modifiedContent.trim()
                .replace(/^```json\s*/, '')
                .replace(/```\s*$/, '')
                .replace(/\n/g, ' ')
                .replace(/\r/g, '')
                .replace(/\t/g, ' ')
                .replace(/\s+/g, ' ');
            
            modifiedSections = JSON.parse(cleanedResponse);
            
            // Validate the structure
            if (typeof modifiedSections !== 'object') {
                throw new Error('Response is not an object');
            }
            
            // Update the document with modified content while preserving structure
            for (const [section, content] of Object.entries(sections)) {
                const modifiedContent = modifiedSections[section] || [];
                for (let i = 0; i < content.length && i < modifiedContent.length; i++) {
                    const paragraph = paragraphs[content[i].index];
                    const runs = paragraph.getElementsByTagName('w:r');
                    
                    // Update the first run's text content while preserving its style
                    if (runs.length > 0) {
                        const firstRun = runs[0];
                        const text = firstRun.getElementsByTagName('w:t')[0];
                        if (text) {
                            text.textContent = modifiedContent[i].text;
                        }
                    }
                }
            }
            
        } catch (error: any) {
            console.error('Error parsing AI response:', error);
            console.error('Raw AI response:', modifiedContent);
            throw new Error(`Failed to parse AI response: ${error.message}`);
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