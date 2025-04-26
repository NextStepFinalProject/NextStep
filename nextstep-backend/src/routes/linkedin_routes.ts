import {Request, Response, Router} from 'express';
import passport from 'passport';
import {loginFailure, getProfile, startLinkedIn, auth} from '../controllers/linkedin_controller';
import {CustomRequest} from "types/customRequest";


const router = Router();

router.post('/start-linkedin', (req: Request, res: Response) => startLinkedIn(req as CustomRequest, res));


router.get('/auth', (req, res, next) => auth(req, res, next));

router.get('/callback',
    passport.authenticate('linkedin', {
        failureRedirect: '/failure',
    }),
    (req, res) => {
    const ses = req.session
    const userId = "" //req.session.tempUserId;
        const { profile, accessToken } = req.user as any;

        // TODO: Update your DB with LinkedIn info
        console.log('LinkedIn user', profile.displayName);

        res.clearCookie('linkedin_temp_user');
        res.redirect('/profile');
    }
);

router.get('/failure', loginFailure);
router.get('/profile', getProfile);

export default router;
