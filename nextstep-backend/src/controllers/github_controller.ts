import axios from 'axios';
import { Request, Response } from 'express';

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

export const handleGitHubOAuth = async (req: Request, res: Response) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            headers: { 'Content-Type': 'application/json' },
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
        }) as any;

        const tokenData = await tokenResponse.data;
        const params = new URLSearchParams(tokenData);
        const accessToken = params.get('access_token');

        if (!accessToken) {
            return res.status(400).json({ error: 'Failed to retrieve access token' });
        }

        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        }) as {status: number, data: { login?: string }, json: () => Promise<any>};

        if (userResponse.status !== 200) {
            const errorText = await userResponse.data;
            return res.status(400).json({ error: errorText });
        }

        const userData = await userResponse.data;
        res.json({ username: userData.login });
    } catch (error) {
        console.error('Error during GitHub OAuth:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const fetchGitHubRepos = async (req: Request, res: Response) => {
    const { username } = req.params;

    try {
        const apiUrl = `https://api.github.com/users/${username}/repos`;
        const response = await axios.get(apiUrl) as {data: any, status: number};

        if (response.status !== 200) {
            return res.status(400).json({ error: `Error fetching repos: ${response.status}` });
        }

        const repos = await response.data;
        res.json(repos);
    } catch (error) {
        console.error('Error fetching repos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const fetchRepoLanguages = async (req: Request, res: Response) => {
    const { repoUrl } = req.query;

    if (!repoUrl) {
        return res.status(400).json({ error: 'Repository URL is required' });
    }

    try {
        // Convert the repoUrl to the GitHub API URL if necessary
        const apiUrl = (repoUrl as string).replace('https://github.com/', 'https://api.github.com/repos/');
        const response = await axios.get(`${apiUrl}/languages`);

        if (response.status !== 200) {
            return res.status(400).json({ error: `Error fetching languages: ${response.statusText}` });
        }

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
