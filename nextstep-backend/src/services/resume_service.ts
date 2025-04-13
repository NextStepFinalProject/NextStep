import { config } from '../config/config';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { chatWithAI, streamChatWithAI } from './chat_api_service';

const SYSTEM_TEMPLATE = `You are a very experienced ATS (Application Tracking System) bot with a deep understanding named BOb the Resume builder.
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

const scoreResume = async (resumePath: string, jobDescription?: string): Promise<{ score: number; feedback: string }> => {
    try {
        const resumeText = fs.readFileSync(resumePath, 'utf-8');
        const prompt = feedbackTemplate(resumeText, jobDescription || 'No job description provided.');

        let feedback = FEEDBACK_ERROR_MESSAGE;
        if (config.chatAi.turned_on()) {
            // Get feedback from the AI
            feedback = await chatWithAI(prompt, SYSTEM_TEMPLATE);
        }

        // Extract the score from the feedback
        const scoreMatch = feedback.match(/SCORE: (\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        return { score, feedback };
    } catch (error) {
        console.error('Error scoring resume:', error);
        throw new Error('Failed to score resume');
    }
};

const streamScoreResume = async (
    resumePath: string,
    jobDescription: string | undefined,
    onChunk: (chunk: string) => void
): Promise<number> => {
    try {
        const resumeText = fs.readFileSync(resumePath, 'utf-8');
        const prompt = feedbackTemplate(resumeText, jobDescription || 'No job description provided.');
        
        let fullResponse = '';
        let finalScore = 0;

        if (config.chatAi.turned_on()) {
            await streamChatWithAI(
                prompt,
                SYSTEM_TEMPLATE,
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
    } catch (error) {
        console.error('Error streaming resume score:', error);
        throw new Error('Failed to stream resume score');
    }
};

export { scoreResume, streamScoreResume };