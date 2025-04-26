import {Request, Response, Router} from 'express';
import passport from 'passport';
import {loginFailure, getProfile, startLinkedIn, auth, linkedinCallback} from '../controllers/linkedin_controller';
import {CustomRequest} from "types/customRequest";


const router = Router();

router.post('/start-linkedin', (req: Request, res: Response) => startLinkedIn(req as CustomRequest, res));


router.get('/auth', (req, res, next) => auth(req, res, next));

router.get('/callback', linkedinCallback);

router.get('/failure', loginFailure);
router.get('/profile', getProfile);

export default router;
