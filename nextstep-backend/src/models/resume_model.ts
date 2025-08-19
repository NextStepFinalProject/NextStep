import mongoose, { Schema } from 'mongoose';
import {ResumeData} from "types/resume_types";

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
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });


ResumeSchema.set('toJSON', {
    transform: (doc, ret): ResumeData => {
        return {
            id: ret._id.toString(),
            owner: ret.owner._id.toString(),
            createdAt: ret.createdAt as any,
            version: ret.version as any,
            rawContentLink: ret.rawContentLink as any,
            parsedData: ret.parsedData as any
        };
    }
});

export const ResumeModel = mongoose.model('Resume', ResumeSchema);