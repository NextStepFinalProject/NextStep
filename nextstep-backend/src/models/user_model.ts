import mongoose, { Schema } from 'mongoose';
import { IUser , UserData} from 'types/user_types';

const userSchema: Schema = new Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
    }, // Store hashed passwords
    imageFilename: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    authProvider: {
        type: String
    }
}, { timestamps: true, strict: true, versionKey: false });

userSchema.set('toJSON', {
    transform: (doc: mongoose.Document, ret: Record<string, any>): UserData => {
        return {
            id: ret._id.toString(),
            username: ret.username as string,
            email: ret.email as string,
            password: ret.password as string,
            imageFilename: ret?.imageFilename as string | undefined,
            createdAt: ret.createdAt ? ret.createdAt.toISOString() : undefined,
            updatedAt: ret.updatedAt ? ret.updatedAt.toISOString() : undefined
        };
    }
});

export const UserModel = mongoose.model<IUser>('User', userSchema);