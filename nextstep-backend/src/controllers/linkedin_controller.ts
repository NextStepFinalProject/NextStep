import passport from 'passport';
import {NextFunction, Request, Response} from 'express';
import {CustomRequest} from "types/customRequest";

export const loginFailure = (req: Request, res: Response): void => {
    res.status(401).json({ message: 'Authentication Failed' });
};

export const startLinkedIn = (req: CustomRequest, res: Response): void => {
    res.cookie('linkedin_temp_user', req.user.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // TODO - change when https
        maxAge: 5 * 60 * 1000
    });

    res.send({ message: 'Ready for LinkedIn auth' });
};

export const auth = (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.cookies.linkedin_temp_user;
    if (!userId) {
        res.status(401).send('No temp session');
    }
    else {
        const sese = req.session //.tempUserId = userId;
        passport.authenticate('linkedin')(req, res, next);
    }
}


export const getProfile = (req: Request, res: Response): void => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    const profile = req.user;
    const recommendations: Record<string, string> = {};

    // if (!profile.displayName) {
    //     recommendations.name = 'Add your full name to your LinkedIn profile.';
    // }
    //
    // if (!profile.emails || profile.emails.length === 0) {
    //     recommendations.email = 'Consider adding an email to your LinkedIn profile.';
    // }
    //
    // if (!profile.photos || profile.photos.length === 0) {
    //     recommendations.profilePhoto = 'Upload a profile picture to enhance your LinkedIn presence.';
    // }

    res.json({
        profile,
        recommendations,
    });
};
