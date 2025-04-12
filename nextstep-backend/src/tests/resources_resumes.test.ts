import request from 'supertest';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';
import resumeRoutes from '../routes/resume_routes';
import { scoreResume } from '../services/resume_service';

// Mock the resume service
jest.mock('../services/resume_service');

describe('Resume API Tests', () => {
    let app: express.Application;
    const testResumePath = path.join(process.cwd(), config.resources.resumesDirectoryPath(), 'test-resume.pdf');
    const testJobDescription = 'Software Engineer with 5 years of experience';

    beforeAll(() => {
        // Create the resumes directory if it doesn't exist
        const resumesDir = path.join(process.cwd(), config.resources.resumesDirectoryPath());
        if (!fs.existsSync(resumesDir)) {
            fs.mkdirSync(resumesDir, { recursive: true });
        }
        
        // Create a test resume file
        fs.writeFileSync(testResumePath, 'Test resume content');
    });

    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(testResumePath)) {
            fs.unlinkSync(testResumePath);
        }
    });

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/resume', resumeRoutes);
    });

    describe('GET /resume/score/:filename', () => {
        it('should return a score for a valid resume', async () => {
            // Mock the scoreResume function
            (scoreResume as jest.Mock).mockResolvedValue(85);

            const response = await request(app)
                .get(`/resume/score/test-resume.pdf?jobDescription=${encodeURIComponent(testJobDescription)}`)
                .expect(200);

            expect(response.body).toHaveProperty('score');
            expect(typeof response.body.score).toBe('number');
            expect(scoreResume).toHaveBeenCalledWith(
                expect.stringContaining('test-resume.pdf'),
                testJobDescription
            );
        });

        it('should return 404 for non-existent resume', async () => {
            const response = await request(app)
                .get('/resume/score/nonexistent.pdf')
                .expect(404);

            expect(response.text).toBe('Resume not found');
        });

        it('should handle errors gracefully', async () => {
            // Mock the scoreResume function to throw an error
            (scoreResume as jest.Mock).mockRejectedValue(new Error('Scoring failed'));

            const response = await request(app)
                .get(`/resume/score/test-resume.pdf?jobDescription=${encodeURIComponent(testJobDescription)}`)
                .expect(500);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Scoring failed');
        });
    });

    // Note: Since the actual upload/download endpoints are not implemented yet,
    // these tests are placeholders for when those features are added
    describe('POST /resume/upload', () => {
        it('should upload a resume successfully', async () => {
            // This test will be implemented when the upload endpoint is added
            expect(true).toBe(true);
        });

        it('should validate file type', async () => {
            // This test will be implemented when the upload endpoint is added
            expect(true).toBe(true);
        });
    });

    describe('GET /resume/download/:filename', () => {
        it('should download a resume successfully', async () => {
            // This test will be implemented when the download endpoint is added
            expect(true).toBe(true);
        });

        it('should return 404 for non-existent resume', async () => {
            // This test will be implemented when the download endpoint is added
            expect(true).toBe(true);
        });
    });
}); 