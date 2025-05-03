import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Chip, Stack,
  Grid, Paper, Autocomplete, MenuItem, Select, FormControl,
  InputLabel, Divider, Avatar, Button
} from '@mui/material';
import { GitHub, LinkedIn } from '@mui/icons-material';
import {
  connectToGitHub,
  initiateGitHubOAuth,
  fetchRepoLanguages,
  handleGitHubOAuth
} from '../handlers/githubAuth';

const roles = [
  'Software Engineer', 'Software Developer', 'Frontend Developer',
  'Backend Developer', 'Full Stack Developer', 'DevOps Engineer',
  'Data Scientist', 'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer'
];

const skillsList = [
  'Leadership', 'React', 'JavaScript', 'TypeScript', 'Python', 'Java',
  'C++', 'Node.js', 'Express', 'MongoDB', 'SQL', 'AWS', 'Docker',
  'Kubernetes', 'Git', 'Agile Methodologies', 'Problem Solving', 'Communication'
];

const MainDashboard: React.FC = () => {
  const [aboutMe, setAboutMe] = useState(() => localStorage.getItem('aboutMe') || '');
  const [skills, setSkills] = useState<string[]>(() => JSON.parse(localStorage.getItem('skills') || '[]'));
  const [newSkill, setNewSkill] = useState('');
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('selectedRole') || '');
  const [repos, setRepos] = useState<{ id: number; name: string; html_url: string }[]>([]);
  const [useOAuth, setUseOAuth] = useState(true);
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  useEffect(() => { localStorage.setItem('aboutMe', aboutMe); }, [aboutMe]);
  useEffect(() => { localStorage.setItem('skills', JSON.stringify(skills)); }, [skills]);
  useEffect(() => { localStorage.setItem('selectedRole', selectedRole); }, [selectedRole]);

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
      setNewSkill('');
    }
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills(skills.filter(skill => skill !== skillToDelete));
  };

  const handleGitHubConnect = async () => {
    if (!showAuthOptions) { setShowAuthOptions(true); return; }
    try {
      if (useOAuth) {
        initiateGitHubOAuth();
      } else {
        const username = prompt('Enter GitHub username:');
        if (!username) { alert('GitHub username is required.'); return; }
        const fetchedRepos = await connectToGitHub(username);
        setRepos(fetchedRepos);
        const languagesSet = new Set(skills);
        for (const repo of fetchedRepos) {
          const repoLanguages = await fetchRepoLanguages(repo.html_url);
          Object.keys(repoLanguages).forEach(lang => languagesSet.add(lang));
        }
        setSkills(Array.from(languagesSet));
      }
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
    } finally {
      setShowAuthOptions(false);
    }
  };

  const handleBackToGitHubOptions = () => {
    setShowAuthOptions(false);
  };

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      const fetchGitHubData = async () => {
        try {
          const username = await handleGitHubOAuth(code);
          const fetchedRepos = await connectToGitHub(username);
          setRepos(fetchedRepos);
          const languagesSet = new Set(skills);
          for (const repo of fetchedRepos) {
            const repoLanguages = await fetchRepoLanguages(repo.html_url);
            Object.keys(repoLanguages).forEach(lang => languagesSet.add(lang));
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
    <Container maxWidth="lg" sx={{ flexGrow: 1, mt: 4, mb: 4, 
      // "&.MuiContainer-root": {
          overflowY: 'hidden',
          marginTop: '-2vh',
          height: '70vh',
          // maxHeight: '90vh',
        // },
      }}>
      <Grid container spacing={4}>
        {/* Left Side */}
        <Grid item xs={12} md={8}>
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3, height: '70vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <Typography variant="h4" gutterBottom>About Me</Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Write about yourself..."
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>Desired Role</Typography>
            <Autocomplete
              freeSolo
              options={roles}
              value={selectedRole}
              onInputChange={(_e, value) => setSelectedRole(value)}
              onChange={(_e, value) => setSelectedRole(value || '')}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" placeholder="Select or write a role..." sx={{ mb: 3 }} />
              )}
            />
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>Skills</Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                mb: 2,
                minHeight: showAllSkills ? '22vh' : '9vh',
                overflowY: showAllSkills ? 'auto' : 'hidden',
              }}
            >
              {skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  onDelete={() => handleDeleteSkill(skill)}
                  color="secondary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
            <Button
              variant="text"
              onClick={() => setShowAllSkills(!showAllSkills)}
              sx={{ textTransform: 'none' }}
            >
              {showAllSkills ? 'Show Less' : 'Show More'}
            </Button>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2}}>
              <Autocomplete
                freeSolo
                fullWidth
                options={skillsList}
                value={newSkill}
                onInputChange={(_e, value) => setNewSkill(value)}
                onChange={(_e, value) => value && handleAddSkill(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Add a skill"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(newSkill);
                      }
                    }}
                  />
                )}
              />
              <Button variant="contained" onClick={() => handleAddSkill(newSkill)}>Add</Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Side */}
        <Grid item xs={12} md={4}>
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3, height: '70vh', textAlign: 'center'}}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />
            <Typography variant="h5" gutterBottom>Connect Accounts</Typography>
            {showAuthOptions ? (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>GitHub Connection Method</InputLabel>
                  <Select
                    value={useOAuth ? 'oauth' : 'no-auth'}
                    onChange={(e) => setUseOAuth(e.target.value === 'oauth')}
                  >
                    <MenuItem value="oauth">OAuth</MenuItem>
                    <MenuItem value="no-auth">No Auth</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" color="secondary" startIcon={<GitHub />} fullWidth onClick={handleGitHubConnect} sx={{ mb: 2 }}>Proceed</Button>
                <Button variant="outlined" color="primary" fullWidth onClick={handleBackToGitHubOptions}>Back</Button>
              </>
            ) : (
              <>
                <Button variant="contained" color="primary" startIcon={<LinkedIn />} fullWidth sx={{ mb: 2 }}>Connect to LinkedIn</Button>
                <Button variant="contained" color="secondary" startIcon={<GitHub />} fullWidth onClick={() => setShowAuthOptions(true)}>Connect to GitHub</Button>
              </>
            )}
            {repos.length > 0 && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="h6">GitHub Repositories</Typography>
                <Box sx={{ maxHeight: '150px', overflowY: 'auto', mt: 1 }}>
                  {repos.map(repo => (
                    <Box key={repo.id} sx={{ mb: 1 }}>
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>{repo.name}</a>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MainDashboard;
