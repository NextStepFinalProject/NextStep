import mongoose, { Schema, Document } from 'mongoose';

export interface IGitHubConnection extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    githubUsername: string;
    repositories: {
        name: string;
        url: string;
        languages: string[];
    }[];
}

const githubConnectionSchema: Schema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    githubUsername: {
        type: String,
        required: true,
    },
    repositories: [
        {
            name: { type: String, required: true },
            url: { type: String, required: true },
            languages: { type: [String], default: [] },
        },
    ],
}, { timestamps: true, versionKey: false });

export const GitHubConnectionModel = mongoose.model<IGitHubConnection>('GitHubConnection', githubConnectionSchema);
