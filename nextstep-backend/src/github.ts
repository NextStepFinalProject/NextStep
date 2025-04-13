import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const app = express();

dotenvExpand.expand(dotenv.config());

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // Replace with your React app's URL
}));

const clientId = process.env.GITHUB_CLIENT_ID; // Use environment variable
const clientSecret = process.env.GITHUB_CLIENT_SECRET; // Use environment variable

// Endpoint to handle GitHub OAuth token exchange and user details
app.post('/api/github/oauth', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
            }),
        });

        const tokenData = await tokenResponse.text();
        const params = new URLSearchParams(tokenData);
        const accessToken = params.get('access_token');

        if (!accessToken) {
            return res.status(400).json({ error: 'Failed to retrieve access token' });
        }

        const userResponse = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            return res.status(400).json({ error: errorText });
        }

        const userData = await userResponse.json() as { login?: string };

        if (!userData.login) {
            return res.status(400).json({ error: 'Failed to retrieve user information' });
        }

        res.json({ username: userData.login });
    } catch (error) {
        console.error('Error during GitHub OAuth:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to fetch GitHub repositories by username
app.get('/api/github/repos/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const apiUrl = `https://api.github.com/users/${username}/repos`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            return res.status(400).json({ error: `Error fetching repos: ${response.statusText}` });
        }

        const repos = await response.json();
        res.json(repos);
    } catch (error) {
        console.error('Error fetching repos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to fetch languages for a specific repository
app.get('/api/github/languages', async (req, res) => {
    const { repoUrl } = req.query;

    if (!repoUrl) {
        return res.status(400).json({ error: 'Repository URL is required' });
    }

    try {
        const response = await fetch(`${repoUrl}/languages`);

        if (!response.ok) {
            return res.status(400).json({ error: `Error fetching languages: ${response.statusText}` });
        }

        const languages = await response.json();
        res.json(languages);
    } catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
