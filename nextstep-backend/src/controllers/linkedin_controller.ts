import passport from 'passport';
import {NextFunction, Request, Response} from 'express';
import {CustomRequest} from "types/customRequest";

export const loginFailure = (req: Request, res: Response): void => {
    res.status(401).json({ message: 'Authentication Failed' });
};

export const startLinkedIn = (req: CustomRequest, res: Response): void => {
    res.cookie('temp_user', req.user.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // TODO - change when https
        maxAge: 5 * 60 * 1000
    });

    res.send({ message: 'Ready for LinkedIn auth' });
};

export const auth = (req: Request, res: Response, next: NextFunction): void => {
    const reqFromUrl = req.query.fromUrl as string;
    const fromUrl = Buffer.from(reqFromUrl as string, 'base64').toString('utf-8');

    const userId = req.cookies['temp_user'];
    if (!userId) {
        res.status(401).send('No temp session');
    }
    else {
        const state = Buffer.from(JSON.stringify({ userId, fromUrl })).toString('base64');

        passport.authenticate('linkedin', {state})(req, res, next);
    }
}


export const linkedinCallback = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('linkedin',
        { failureRedirect: '/failure' },
        (err: any, user: any, info: any) => {
        if (err || !user) {
            console.error('LinkedIn auth error:', err || 'No user');
            return res.redirect('/failure');
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error('Session login error:', err);
                return res.redirect('/failure');
            }

            const state = req.query.state as string;
            let fromUrl = '/profile';

            if (state) {
                try {
                    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                    const { userId } = decoded
                    console.log('Decoded state:', decoded);
                    console.log('userId:', userId);
                    fromUrl = decoded.fromUrl || '/profile';
                } catch (error) {
                    console.error('Failed to decode state:', error);
                }
            }

            console.log('LinkedIn user logged in:', user.displayName);
            // Add the profile data to DB with the userId

            res.clearCookie('temp_user');
            res.redirect(fromUrl);
        });
    })(req, res, next);
};



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
