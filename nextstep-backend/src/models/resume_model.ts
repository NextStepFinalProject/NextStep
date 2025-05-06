import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    filename: string;
    uploadedAt: Date;
    score?: number;
    feedback?: string;
}

const resumeSchema: Schema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    filename: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    score: {
        type: Number,
    },
    feedback: {
        type: String,
    },
}, { timestamps: true, versionKey: false });

export const ResumeModel = mongoose.model<IResume>('Resume', resumeSchema);
