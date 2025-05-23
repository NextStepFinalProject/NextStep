import express from 'express';
import { handleGitHubOAuth, fetchGitHubRepos, fetchRepoLanguages } from '../controllers/github_controller';

const router = express.Router();

router.post('/oauth', handleGitHubOAuth);
router.get('/repos/:username', fetchGitHubRepos);
router.get('/languages', fetchRepoLanguages);

export default router;
