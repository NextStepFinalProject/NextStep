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

interface ResumeSection {
    name: string;
    content: string;
    formatting: {
        style: string;
        fontSize: string;
        isBold: boolean;
        isItalic: boolean;
    };
}

interface ResumeContent {
    sections: ResumeSection[];
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

// Utility function to encode text for JSON
const encodeTextForJson = (text: string): string => {
    return text
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/'/g, "\\'")    // Escape single quotes
        .replace(/"/g, '\\"')    // Escape double quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t');  // Escape tabs
};

const feedbackTemplate = (resumeText: string, jdText: string) => {
    // Encode quotes in both resume text and job description
    const encodedResumeText = encodeTextForJson(resumeText);
    const encodedJdText = encodeTextForJson(jdText);

    // Create the template with encoded text
    const template = `
Resume Feedback Report
Here is the resume you provided:
${encodedResumeText}
And the job description:
${encodedJdText}

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

    return encodeTextForJson(template);
};

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

        // Escape quotes in resume text and job description
        const escapedResumeText = resumeText.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const escapedJobDescription = (jobDescription || 'No job description provided.').replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const prompt = feedbackTemplate(escapedResumeText, escapedJobDescription);

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

        // Escape quotes in resume text and job description
        const escapedResumeText = resumeText.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const escapedJobDescription = (jobDescription || 'No job description provided.').replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const prompt = feedbackTemplate(escapedResumeText, escapedJobDescription);
        
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
    jobDescription: string
): Promise<{ content: string; type: string }> => {
    try {
        const templatesDir = config.assets.resumeTemplatesDirectoryPath();
        if (!fs.existsSync(templatesDir)) {
            throw new Error('Resume templates directory not found');
        }

        // Get all DOCX templates
        let templateFiles = fs.readdirSync(templatesDir)
            .filter(file => file.toLowerCase().endsWith('.docx'));

        if (templateFiles.length === 0) {
            throw new Error('No DOCX templates found in the templates directory');
        }

        // Encode the feedback and job description
        const encodedFeedback = encodeTextForJson(feedback);
        const encodedJobDescription = encodeTextForJson(jobDescription);

        // Process each template one by one
        let bestTemplate = null;
        let bestScore = 0;

        templateFiles = [templateFiles[0]]
        for (const templateFile of templateFiles) {
            const templatePath = path.join(templatesDir, templateFile);
            const content = fs.readFileSync(templatePath);
            const base64Content = content.toString('base64');

            // Prepare the prompt for AI to analyze this template
            const prompt = `Create an improved resume based on this feedback and template. Return ONLY a JSON object with this exact structure:
{
  "docx": "base64_encoded_docx_content",
  "score": number // 0-100 score
}

Feedback: ${encodedFeedback}
Job Description: ${encodedJobDescription}
Template: ${templateFile}

Formatting Requirements:
1. Professional fonts and sizes
2. Clear section headers
3. Proper spacing and margins
4. Bullet points for achievements
5. Consistent styling throughout
6. Include: Summary, Experience, Education, Skills sections
7. Focus on achievements and metrics
8. Optimize for the job description

IMPORTANT: 
- Keep the response under 14900 characters total
- The base64 content must not be truncated.
- Return ONLY the JSON object, no other text`;

            // Get the new resume content from AI
            const aiResponse = await chatWithAI(SYSTEM_TEMPLATE, [prompt]);
            
            try {
                // First check if the response starts with an error message
                if (aiResponse.trim().startsWith('Sorry') || aiResponse.trim().startsWith('Error')) {
                    console.warn(`Skipping template ${templateFile} due to AI service error: ${aiResponse.trim()}`);
                    continue;
                }

                // Try to find JSON content within the response
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.warn(`Skipping template ${templateFile} due to invalid JSON response`);
                    continue;
                }

                let response;
                try {
                    // First try parsing the exact JSON match
                    response = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    // If that fails, try cleaning the response more thoroughly
                    const cleanedResponse = jsonMatch[0]
                        .replace(/^```json\s*/, '')
                        .replace(/```\s*$/, '')
                        .replace(/\n/g, ' ')
                        .replace(/\r/g, '')
                        .replace(/\t/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // Ensure property names are quoted
                        .replace(/(:\s*)([^",\{\}\[\]\s][^",\{\}\[\]]*?)(\s*[,\}])/g, '$1"$2"$3'); // Ensure string values are quoted
                    
                    try {
                        response = JSON.parse(cleanedResponse);
                    } catch (secondParseError) {
                        console.warn(`Failed to parse JSON response for template ${templateFile}:`, secondParseError);
                        console.warn('Original response:', jsonMatch[0]);
                        console.warn('Cleaned response:', cleanedResponse);
                        continue;
                    }
                }
                
                if (!response.docx || typeof response.docx !== 'string' || typeof response.score !== 'number') {
                    console.warn(`Skipping template ${templateFile} due to invalid response format`);
                    continue;
                }

                // Update best template if this one has a higher score
                if (response.score > bestScore) {
                    bestScore = response.score;
                    bestTemplate = response.docx;
                }
            } catch (error: any) {
                console.warn(`Error processing template ${templateFile}:`, error);
                continue;
            }
        }

        if (!bestTemplate) {
            throw new Error('Failed to generate an improved resume from any template');
        }

        return {
            content: bestTemplate,
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