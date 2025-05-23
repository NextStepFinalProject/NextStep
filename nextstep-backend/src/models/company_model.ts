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
            },
            process_details: {
                type: String,
                required: false,
            },
            interview_questions: {
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

// Add indexes to CompanySchema
companySchema.index({ tags: 1 }); // For efficient matching on company tags
companySchema.index({ 'quizzes.tags': 1 }); // For efficient matching on quiz tags in subdocuments

// For content fields, consider a text index if you want to search for *words* within them.
// If you create the text index, you must then change the search logic to use $text operator.
// A regular index (like { 'quizzes.content': 1 }) will NOT accelerate $regexMatch.
// For `$regexMatch` performance, only a collection scan or a dedicated full-text search works.
companySchema.index(
    {
      'quizzes.content': 'text',
      'quizzes.process_details': 'text',
      'quizzes.interview_questions': 'text',
    },
    {
      name: 'quiz_content_text_index',
      weights: {
        'quizzes.content': 10, // Give more weight to content
        'quizzes.process_details': 5,
        'quizzes.interview_questions': 5,
      }
    }
  );

export const CompanyModel = mongoose.model('Companies', companySchema); 