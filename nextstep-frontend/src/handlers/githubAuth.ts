// Function to fetch GitHub repositories by username
export const fetchGitHubRepos = async (username: string) => {
    try {
        const response = await fetch(`http://localhost:5000/api/github/repos/${username}`);
        if (!response.ok) {
            throw new Error(`Error fetching repos: ${response.statusText}`);
        }
        return await response.json();
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
    const scope = 'repo'; // Adjust scope as needed
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl; // Redirect the user to GitHub's authorization page
};

// Function to handle GitHub OAuth token exchange and fetching user details
export const handleGitHubOAuth = async (code: string) => {
    try {
        const response = await fetch('http://localhost:5000/api/github/oauth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend OAuth Error:', errorText);
            throw new Error('Failed to authenticate with GitHub');
        }

        const data = await response.json();
        if (!data.username) {
            throw new Error('Failed to retrieve user information');
        }

        return data.username;
    } catch (error) {
        const err : Error = error as Error;
        console.error('Error during GitHub OAuth:', error);
        throw new Error('Internal server error: ' + err.message);
    }
};

// Function to fetch languages for a specific repository
export const fetchRepoLanguages = async (repoUrl: string) => {
    try {
        const response = await fetch(`http://localhost:5000/api/github/languages?repoUrl=${encodeURIComponent(repoUrl)}`);
        if (!response.ok) {
            throw new Error(`Error fetching languages: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return {};
    }
};

// Example usage
fetchGitHubRepos('octocat').then(repos => console.log(repos));