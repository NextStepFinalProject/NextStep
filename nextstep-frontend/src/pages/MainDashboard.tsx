import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, TextField, Chip, Stack, Grid, Paper, Autocomplete, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { GitHub, LinkedIn } from '@mui/icons-material';
import { connectToGitHub, initiateGitHubOAuth, fetchRepoLanguages, handleGitHubOAuth } from '../handlers/githubAuth';

const roles = [
  'Software Engineer',
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UI/UX Designer',
];

const skillsList = [
  'Leadership',
  'React',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'Node.js',
  'Express',
  'MongoDB',
  'SQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Git',
  'Agile Methodologies',
  'Problem Solving',
  'Communication',
];

const MainDashboard: React.FC = () => {
  const [aboutMe, setAboutMe] = useState(() => localStorage.getItem('aboutMe') || '');
  const [skills, setSkills] = useState<string[]>(() => JSON.parse(localStorage.getItem('skills') || '[]'));
  const [newSkill, setNewSkill] = useState('');
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('selectedRole') || '');
  const [repos, setRepos] = useState<{ id: number; name: string; html_url: string }[]>([]);

  useEffect(() => {
    localStorage.setItem('aboutMe', aboutMe);
  }, [aboutMe]);

  useEffect(() => {
    localStorage.setItem('skills', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem('selectedRole', selectedRole);
  }, [selectedRole]);

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills(skills.filter(skill => skill !== skillToDelete));
  };

  const handleGitHubConnect = async () => {
    try {
      initiateGitHubOAuth();
    } catch (error) {
      console.error('Error initiating GitHub OAuth:', error);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');
    if (code) {
      const fetchGitHubData = async () => {
        try {
          const username = await handleGitHubOAuth(code);
          const fetchedRepos = await connectToGitHub(username);
          setRepos(fetchedRepos);

          // Fetch languages and add them as skills
          const languagesSet = new Set(skills);
          for (const repo of fetchedRepos) {
            const repoLanguages = await fetchRepoLanguages(repo.html_url);
            Object.keys(repoLanguages).forEach((lang) => languagesSet.add(lang));
          }
          setSkills(Array.from(languagesSet));
        } catch (error) {
          console.error('Error fetching GitHub data:', error);
        }
      };

      fetchGitHubData();
    }
  }, []);

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 5,
        height: '100vh',
        overflow: 'hidden', // Prevent scrolling on the entire page
      }}
    >
      <Grid container spacing={4} sx={{ height: '100%' }}>
        {/* Main Content */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            height: '100%',
            overflowY: 'auto', // Make only the left side scrollable
          }}
        >
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              About Me
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2} // Reduce the height of the "About Me" section
              variant="outlined"
              placeholder="Write about yourself..."
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Typography variant="h5" gutterBottom>
              Desired Role
            </Typography>
            <Autocomplete
              freeSolo
              options={roles}
              value={selectedRole}
              onInputChange={(e, value) => setSelectedRole(value)}
              onChange={(e, value) => setSelectedRole(value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Select or write a role..."
                  sx={{ mb: 3 }}
                />
              )}
            />
            <Typography variant="h5" gutterBottom>
              Skills
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
              {skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  onDelete={() => handleDeleteSkill(skill)}
                  color="primary"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
            <Autocomplete
              freeSolo
              options={skillsList}
              onInputChange={(e, value) => setNewSkill(value)}
              onChange={(e, value) => handleAddSkill(value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
              )}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" color="primary" onClick={() => handleAddSkill(newSkill)}>
              Add Skill
            </Button>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Connect Accounts
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LinkedIn />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Connect to LinkedIn
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<GitHub />}
              fullWidth
              onClick={handleGitHubConnect}
            >
              Connect to GitHub
            </Button>
            {
            repos.length > 0 && <Typography variant="h6" sx={{ mt: 3 }}>
              GitHub Repositories
            </Typography>
            }
            <ul>
              {repos.map((repo) => (
                <li key={repo.id}>
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    {repo.name}
                  </a>
                </li>
              ))}
            </ul>
        </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MainDashboard;
