import mongoose, { Schema } from 'mongoose';
import {ResumeData} from "types/resume_types";

const ResumeSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true },
    rawContentLink: { type: String, required: true },
    parsedData: {
        type: {
            aboutMe: { type: String, required: false },
            skills: { type: [String], required: false },
            roleMatch: { type: String, required: false },
            experience: { type: [String], required: false }

        },
        required: false
    },
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });


ResumeSchema.set('toJSON', {
    transform: (doc, ret): ResumeData => {
        return {
            id: ret._id,
            owner: ret.owner._id.toString(),
            createdAt: ret.createdAt,
            updatedAt: ret.updatedAt,
            version: ret.version,
            rawContentLink: ret.rawContentLink,
            parsedData: ret.parsedData
        };
    }
});

export const ResumeModel = mongoose.model('Resume', ResumeSchema);