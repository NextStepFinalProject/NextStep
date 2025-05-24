import { Request, Response } from 'express';
import linkedIn from 'linkedin-jobs-api';
import { getCompanyLogo } from '../services/company_logo_service';

export const getJobsBySkillsAndRole = async (req: Request, res: Response) => {
    try {
        const skillsParam = String(req.query.skills || '').trim();
        const role = String(req.query.role || '').trim();
        const location = String(req.query.location || 'Israel').trim();
        const dateSincePosted = String(req.query.dateSincePosted || 'past week').trim();
        const jobType = String(req.query.jobType || 'full time').trim();
        const experienceLevel = String(req.query.experienceLevel || 'entry level').trim();

        if (!skillsParam || !role) {
            return res.status(400).json({ error: 'Skills and role are required' });
        }

        // Split skills by comma and trim whitespace
        const skillsArray = skillsParam
            .split(',')
            .map(skill => skill.trim())
            .filter(Boolean);

        // Construct keyword by combining role and skills
        const keyword = `${role} ${skillsArray.join(' ')}`.trim();

        const queryOptions = {
            keyword,
            location,
            dateSincePosted,
            jobType,
            experienceLevel,
            limit: '10',
            page: '0',
        };

        const jobs = await linkedIn.query(queryOptions);

        // Fetch company logos for each job
        const jobsWithLogos = await Promise.all(
            jobs.map(async (job: any) => {
                const companyLogo = await getCompanyLogo(job.company);
                return { 
                    ...job, 
                    companyLogo, 
                    position: job.position // Add position field
                };
            })
        );

        res.status(200).json(jobsWithLogos);
    } catch (error: any) {
        console.error('Error fetching jobs from LinkedIn Jobs API:', error.message);
        res.status(500).json({ error: 'Failed to fetch jobs from LinkedIn Jobs API' });
    }
};

export const viewJobDetails = async (req: Request, res: Response) => {
    try {
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        const jobDetails = await linkedIn.query({ keyword: jobId, limit: '1' });
        res.status(200).json(jobDetails);
    } catch (error: any) {
        console.error('Error fetching job details:', error.message);
        res.status(500).json({ error: 'Failed to fetch job details' });
    }
};
