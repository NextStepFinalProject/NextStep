import request from 'supertest';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';
import resumeRoutes from '../routes/resume_routes';
import { scoreResume } from '../services/resume_service';
import resourcesRoutes from '../routes/resources_routes';
import { authenticateToken } from '../middleware/auth';

// Mock the resume service
jest.mock('../services/resume_service');

// Mock the authentication middleware
jest.mock('../middleware/auth', () => ({
    authenticateToken: jest.fn((req, res, next) => next())
}));

describe('Resume API Tests', () => {
    let app: express.Application;
    const testResumePath = path.join(process.cwd(), 'test-resume.pdf');
    const testResumeContent = 'Test resume content';
    const testJobDescription = 'Software Engineer with 5 years of experience';
    const testToken = 'test-token';

    beforeAll(() => {
        // Create the resumes directory if it doesn't exist
        const resumesDir = path.join(process.cwd(), config.resources.resumesDirectoryPath());
        if (!fs.existsSync(resumesDir)) {
            fs.mkdirSync(resumesDir, { recursive: true });
        }
        
        // Create a test resume file
        fs.writeFileSync(testResumePath, testResumeContent);
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
        app.use('/resource', resourcesRoutes);
        app.use('/resume', resumeRoutes);
    });

    describe('GET /resume/score/:filename', () => {
        it('should return a score for a valid resume', async () => {
            // First upload a resume
            const uploadResponse = await request(app)
                .post('/resource/resume')
                .set('Authorization', `Bearer ${testToken}`)
                .attach('file', testResumePath);

            const filename = uploadResponse.text;

            // Mock the scoreResume function
            (scoreResume as jest.Mock).mockResolvedValue({ score: 85 });

            const response = await request(app)
                .get(`/resume/score/${filename}?jobDescription=${encodeURIComponent(testJobDescription)}`)
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('score');
            expect(typeof response.body.score).toBe('number');
            expect(scoreResume).toHaveBeenCalledWith(
                expect.stringContaining(filename),
                testJobDescription
            );

            // Clean up the uploaded file
            const uploadedFilePath = path.join(config.resources.resumesDirectoryPath(), filename);
            if (fs.existsSync(uploadedFilePath)) {
                fs.unlinkSync(uploadedFilePath);
            }
        });

        it('should return 404 for non-existent resume', async () => {
            const response = await request(app)
                .get('/resume/score/nonexistent.pdf')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(404);

            expect(response.text).toBe('Resume not found');
        });

        it('should handle errors gracefully', async () => {
            // First upload a resume
            const uploadResponse = await request(app)
                .post('/resource/resume')
                .set('Authorization', `Bearer ${testToken}`)
                .attach('file', testResumePath);

            const filename = uploadResponse.text;

            // Mock the scoreResume function to throw an error
            (scoreResume as jest.Mock).mockRejectedValue(new Error('Scoring failed'));

            const response = await request(app)
                .get(`/resume/score/${filename}?jobDescription=${encodeURIComponent(testJobDescription)}`)
                .set('Authorization', `Bearer ${testToken}`)
                .expect(500);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Scoring failed');

            // Clean up the uploaded file
            const uploadedFilePath = path.join(config.resources.resumesDirectoryPath(), filename);
            if (fs.existsSync(uploadedFilePath)) {
                fs.unlinkSync(uploadedFilePath);
            }
        });
    });

    describe('POST /resource/resume', () => {
        it('should upload a resume successfully', async () => {
            const response = await request(app)
                .post('/resource/resume')
                .set('Authorization', `Bearer ${testToken}`)
                .attach('file', testResumePath)
                .expect(201);

            expect(response.text).toBeDefined();
            expect(response.text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/);

            // Clean up the uploaded file
            const uploadedFilePath = path.join(config.resources.resumesDirectoryPath(), response.text);
            if (fs.existsSync(uploadedFilePath)) {
                fs.unlinkSync(uploadedFilePath);
            }
        });

        it('should validate file type', async () => {
            const response = await request(app)
                .post('/resource/resume')
                .set('Authorization', `Bearer ${testToken}`)
                .attach('file', Buffer.from('invalid content'), { filename: 'test.png' })
                .expect(400);

            expect(response.text).toBe(`{"message":"Invalid file type. Only PDF, DOC, DOCX and TXT/TEXT files are allowed."}`);
        });

        it('should handle missing file', async () => {
            const response = await request(app)
                .post('/resource/resume')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(400);

            expect(response.text).toBe(`{"message":"No file uploaded."}`);
        });
    });

    describe('GET /resource/resume/:filename', () => {
        it('should download a resume successfully', async () => {
            // First upload a resume
            const uploadResponse = await request(app)
                .post('/resource/resume')
                .set('Authorization', `Bearer ${testToken}`)
                .attach('file', testResumePath);

            const filename = uploadResponse.text;

            // Then try to download it
            const response = await request(app)
                .get(`/resource/resume/${filename}`)
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            expect(response.body).toBeDefined();

            // Clean up the uploaded file
            const uploadedFilePath = path.join(config.resources.resumesDirectoryPath(), filename);
            if (fs.existsSync(uploadedFilePath)) {
                fs.unlinkSync(uploadedFilePath);
            }
        });

        it('should return 404 for non-existent resume', async () => {
            const response = await request(app)
                .get('/resource/resume/nonexistent.pdf')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(404);

            expect(response.text).toBe('Resume not found');
        });
    });
}); 