import mongoose, { Document, Schema } from 'mongoose';

const companySchema: Schema = new mongoose.Schema({
    company: {
        type: String,
        required: true,
    },
    company_he: {
        type: String,
        required: true,
    },
    tags: [
        {
            type: String,
            required: true,
        }
    ],
    quizzes: [
        {
            title: {
                type: String,
                required: true,
            },
            quiz_id: {
                type: Number,
                required: true,
            },
            tags: [
                {
                    type: String,
                    required: true,
                }
            ],
            content: {
                type: String,
                required: true,
            },
            forum_link: {
                type: String,
                required: false,
            }
        }
    ]
}, { timestamps: true, strict: true, versionKey: false });

companySchema.set('toJSON', {
    transform: (doc: Document, ret: Record<string, any>) => {
        return {
            id: ret._id,
            company: ret.company,
            company_he: ret.company_he,
            tags: ret.tags,
            quizzes: ret.quizzes,
        }
    }
});

export const CompanyModel = mongoose.model('Companies', companySchema); 