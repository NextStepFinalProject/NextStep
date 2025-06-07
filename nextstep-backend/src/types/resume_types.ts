import { Document } from 'mongoose';


export interface ParsedResume {
    aboutMe: string;
    skills: string[];
    roleMatch: string;
    experience: string[];
    education?: string[];
    jobDescription?: string;
    feedback?: string;
    score?: number;
    fileName?: string;
}

export interface ResumeDocument extends Document {
    _id: string;
    owner: string;
    version: number;
    rawContentLink: string;
    parsedData: ParsedResume;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ResumeData {
    id: string;
    owner: string;
    version: number;
    rawContentLink: string;
    parsedData: ParsedResume;
    createdAt?: Date;
    updatedAt?: Date;
}

