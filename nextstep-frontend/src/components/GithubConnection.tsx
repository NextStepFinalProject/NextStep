import React, { useState, useEffect } from 'react';
import { connectToGitHub, initiateGitHubOAuth, fetchRepoLanguages, handleGitHubOAuth } from '../handlers/githubAuth';
import { FaGithub } from 'react-icons/fa'; // Import GitHub icon

const GitHubReposUI = () => {
    const [username, setUsername] = useState('');
    const [repos, setRepos] = useState<{ id: number; name: string; html_url: string; url: string }[]>([]);
    const [error, setError] = useState('');
    const [languages, setLanguages] = useState<Record<string, Record<string, number>>>({});

    
    const handleOAuthAndFetchRepos = async () => {
        setError('');
        try {
            // Redirect the user to GitHub's authorization page
            initiateGitHubOAuth();
        } catch (err) {
            const error: Error = err as Error;
            setError(error.message);
        }
    };

    useEffect(() => {
        const fetchReposAfterOAuth = async () => {
            const queryParams = new URLSearchParams(window.location.search);
            const code = queryParams.get('code');

            if (code) {
                try {
                    const authUsername = await handleGitHubOAuth(code); // Use the new function
                    setUsername(authUsername); // Set the authenticated username
                    const fetchedRepos = await connectToGitHub(authUsername); // Fetch repos using the username
                    setRepos(fetchedRepos);

                    // Fetch languages for each repository
                    const languagesData: { [key: string]: any } = {};
                    for (const repo of fetchedRepos) {
                        const repoLanguages = await fetchRepoLanguages(repo.url);
                        languagesData[repo.name] = repoLanguages;
                    }
                    setLanguages(languagesData);
                } catch (err) {
                    const error: Error = err as Error;
                    setError(error.message);
                }
            }
        };

        fetchReposAfterOAuth();
    }, []);

    return (
        <div>
            <h1>GitHub Repositories</h1>
            <button onClick={handleOAuthAndFetchRepos}>
                <FaGithub /> Connect to GitHub
            </button>
            
            <br />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
                {repos.map((repo) => (
                    <li key={repo.id}>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                            <FaGithub style={{ marginRight: '5px' }} /> {/* Add GitHub icon */}
                            {repo.name}
                        </a>
                        <ul>
                            {languages[repo.name] &&
                                Object.keys(languages[repo.name]).map((lang) => (
                                    <li key={lang}>{lang}</li>
                                ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GitHubReposUI;