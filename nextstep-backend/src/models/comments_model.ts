import mongoose, { Document, Schema } from 'mongoose';
import { IComment } from 'types/comment_types';


const commentSchema: Schema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Posts",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true, strict: true, versionKey: false });

commentSchema.set('toJSON', {
    transform: (doc: Document, ret: Record<string, any>) => {
        return {
            id: ret._id.toString(),
            postId: ret.postId.toString(),
            content: ret.content as string,
            owner: ret.owner.toString(),
            createdAt: ret.createdAt ? ret.createdAt.toISOString() : undefined,
            updatedAt: ret.updatedAt ? ret.updatedAt.toISOString() : undefined,
        };
    }
});

export const CommentModel = mongoose.model<IComment>("Comments", commentSchema);


