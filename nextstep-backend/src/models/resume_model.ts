import mongoose, { Schema } from 'mongoose';
import {ResumeData, ParsedResume} from "types/resume_types";

const ResumeSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true },
    rawContentLink: { type: String, required: true },
    parsedData: {
        type: {
            fileName: { type: String, required: false },
            aboutMe: { type: String, required: false },
            skills: { type: [String], required: false },
            roleMatch: { type: String, required: false },
            experience: { type: [String], required: false },
            jobDescription: { type: String, required: false },
            feedback: { type: String, required: false },
            score: { type: Number, required: false },
        },
        required: false
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });


ResumeSchema.set('toJSON', {
    transform: (doc: mongoose.Document, ret: Record<string, any>): ResumeData => {
        return {
            id: ret._id.toString(),
            owner: ret.owner._id.toString(),
            createdAt: ret.createdAt ? ret.createdAt.toISOString() : undefined,
            updatedAt: ret.updatedAt ? ret.updatedAt.toISOString() : undefined,
            version: ret.version as number,
            rawContentLink: ret.rawContentLink as string,
            parsedData: ret.parsedData as ParsedResume || {
                aboutMe: '',
                skills: [],
                roleMatch: '',
                experience: [],
                education: [],
                jobDescription: '',
                feedback: '',
                score: 0,
                fileName: ''
            }
        };
    }
});

export const ResumeModel = mongoose.model('Resume', ResumeSchema);