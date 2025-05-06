import api from "../serverApi.ts";

// Function to fetch GitHub repositories by username
export const fetchGitHubRepos = async (username: string) => {
    try {
        const response = await api.get(`github/repos/${username}`) as any;
        if (response.status !== 200) {
            throw new Error(`Error fetching repos: ${response.statusText}`);
        }
        return response.data;
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Function to connect to GitHub by username
export const connectToGitHub = async (username: string) => {
    if (!username) {
        throw new Error('Username is required to connect to GitHub.');
        }
    return await fetchGitHubRepos(username);
};

// Function to initiate GitHub OAuth login (redirect only)
export const initiateGitHubOAuth = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID; // Use environment variable
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI; // Use environment variable
    const scope = 'public_repo'; // Only read access to repositories
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl; // Redirect the user to GitHub's authorization page
};

// Function to handle GitHub OAuth token exchange and fetching user details
export const handleGitHubOAuth = async (code: string) => {
    try {
        const response = await api.post('github/oauth', {
            headers: { 'Content-Type': 'application/json' },
            code: code,
        }) as {data: {username?: string, error?: string}, status: number};

        if (response.status !== 200) {
            const errorText = await response.data.error;
            console.error('Backend OAuth Error:', errorText);
            throw new Error('Failed to authenticate with GitHub');
        }
        else if (!response.data.username) {
            console.error('Backend OAuth Error:', response.data.error);
            throw new Error('Failed to retrieve user information from GitHub');
        }

        return response.data.username;
    } catch (error) {
        const err : Error = error as Error;
        console.error('Error during GitHub OAuth:', error);
        throw new Error('Internal server error: ' + err.message);
    }
};

// Function to fetch languages for a specific repository
export const fetchRepoLanguages = async (repoUrl: string) => {
    try {
        const response = await api.get(`github/languages?repoUrl=${encodeURIComponent(repoUrl)}`) as any;
        if (response.status !== 200) {
            throw new Error(`Error fetching languages: ${response.statusText}`);
        }
        return await response.data;
    } catch (error) {
        console.error(error);
        return {};
    }
};