import express, {Request, Response} from 'express';
import Resource from '../controllers/resources_controller';
import {CustomRequest} from "types/customRequest";

const router = express.Router();

router.post('/image/user', (req: Request, res: Response) => Resource.createUserImageResource(req as CustomRequest, res));

router.post('/image', Resource.createImageResource);
router.post('/file', Resource.createFileResource);

router.get('/image/:filename', Resource.getImageResource);
router.get('/file/:filename', Resource.getFileResource);

router.post('/resume', Resource.createResumeResource);

router.get('/resume/:filename', Resource.getResumeResource);

export default router;