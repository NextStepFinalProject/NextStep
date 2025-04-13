import { config } from '../config/config';
import path from 'path';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';

const uploadFileToTempHosting = async (resumePath: string): Promise<{status: string, data: { url: string }}> => {
    const form = new FormData.default();
    form.append('file', fs.createReadStream(resumePath));

    try {
        const response = await axios.post(
            config.tempFileHosting.api_base_url() + config.tempFileHosting.api_upload_relative_url(),
            form,
            {
                headers: {
                    ...form.getHeaders()
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const scoreResume = async (resumePath: string, jobDescription?: any): Promise<number> => {
    // TODO: make this jobDescription as a model.
    jobDescription = {
        title: "Backend .NET Engineer",
        roleDescription: "As a Backend .NET Engineer, you'll be responsible for developing and maintaining the critical backend systems. You'll work on challenging projects that directly impact our users' experiences and help us scale our rapidly growing business.",
        lookingFor: "4+ years of professional development experience with .NET and PowerShell"
    }

    try {
        const tempFileHostingResponse = await uploadFileToTempHosting(resumePath);
        const originalUrl = tempFileHostingResponse.data.url;
        const fileUrl = originalUrl.replace(`${config.tempFileHosting.api_base_url()}/`,
            `${config.tempFileHosting.api_base_url()}${config.tempFileHosting.api_file_relative_url()}/`);

        // Here you would integrate with an actual ATS system
        // For now, we'll return a mock score
        // In a real implementation, you would:
        // 1. Parse the resume text
        // 2. Compare it with the job description
        // 3. Calculate a score based on keywords, skills, experience, etc.
        
        // const options = {
        //     method: 'POST',
        //     url: config.resumeRating.api_url(),
        //     headers: config.resumeRating.headers(),
        //     data: {
        //         resumeURL: fileUrl,
        //         job: jobDescription
        //     }
        // };
        const options = {
            method: 'GET',
            url: `https://api.apilayer.com/resume_parser/url?url=${fileUrl}`,
            headers: {
                apikey: "LMVNylMBLPUqy7mW23F3fe9rUzPrraML"
            },
        };

        // const resumeRatingResponse = await axios.request(options);

        const resumeParserResponse = await axios.request(options);

        

        // Mock implementation
        // const score = Math.floor(Math.random() * 100);
        // return resumeRatingResponse.data;
        return resumeParserResponse.data;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to score resume');
    }
};

export { scoreResume }; 