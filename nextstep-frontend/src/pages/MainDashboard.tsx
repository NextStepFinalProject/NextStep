import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Avatar,
  Divider,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  GitHub,
  LinkedIn,
  Person as PersonIcon,
  Work as WorkIcon,
  Build as BuildIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import {
  connectToGitHub,
  initiateGitHubOAuth,
  fetchRepoLanguages,
  handleGitHubOAuth
} from '../handlers/githubAuth';
import api from '../serverApi';
import LinkedInIntegration from '../components/LinkedInIntegration';

const roles = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Product Manager', 'UI/UX Designer'
];

const skillsList = [
  'React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Node.js',
  'Express', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile'
];

const MainDashboard: React.FC = () => {
  const [aboutMe, setAboutMe] = useState(() => localStorage.getItem('aboutMe') || '');
  const [skills, setSkills] = useState<string[]>(() => JSON.parse(localStorage.getItem('skills') || '[]'));
  const [newSkill, setNewSkill] = useState('');
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('selectedRole') || '');
  const [repos, setRepos] = useState<{ id: number; name: string; html_url: string }[]>([]);
  const [useOAuth, setUseOAuth] = useState(true);
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  // AI-resume state
  const [parsing, setParsing] = useState(false);
  const [resumeExperience, setResumeExperience] = useState<string[]>([]);
  const [roleMatch, setRoleMatch] = useState<string>('');
  const [resumeFileName, setResumeFileName] = useState<string>('');

  // Skills toggle
  const [showAllSkills, setShowAllSkills] = useState(false);
  const SKILL_DISPLAY_LIMIT = 6;
  const shouldShowToggle = skills.length > SKILL_DISPLAY_LIMIT;

  // LinkedIn jobs state
  const [jobs, setJobs] = useState<{ position: string; company: string; location: string; url: string, companyLogo?: string }[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false); // New state for loading jobs

  // Job Recommendations toggle
  const [showJobRecommendations, setShowJobRecommendations] = useState(true); // New state for toggle

  const toggleJobRecommendations = () => {
    setShowJobRecommendations(!showJobRecommendations);
  };

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('aboutMe', aboutMe); }, [aboutMe]);
  useEffect(() => { localStorage.setItem('skills', JSON.stringify(skills)); }, [skills]);
  useEffect(() => { localStorage.setItem('selectedRole', selectedRole); }, [selectedRole]);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      (async () => {
        try {
          const username = await handleGitHubOAuth(code);
          const fetched = await connectToGitHub(username);
          setRepos(fetched);
          mergeRepoLanguages(fetched);
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, []);

  const mergeRepoLanguages = async (fetchedRepos: typeof repos) => {
    const langSet = new Set(skills);
    for (const repo of fetchedRepos) {
      const langs = await fetchRepoLanguages(repo.html_url);
      Object.keys(langs).forEach(lang => langSet.add(lang));
    }
    setSkills(Array.from(langSet));
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills(prev => [trimmed, ...prev]);
    setNewSkill('');
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills(prev => prev.filter(s => s !== skillToDelete));
  };

  const handleGitHubConnect = async () => {
    if (!showAuthOptions) return setShowAuthOptions(true);
    try {
      if (useOAuth) initiateGitHubOAuth();
      else {
        const username = prompt('Enter GitHub username:');
        if (!username) return alert('Username required');
        const fetched = await connectToGitHub(username);
        setRepos(fetched);
        mergeRepoLanguages(fetched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShowAuthOptions(false);
    }
  };

  // Upload & parse resume
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFileName(file.name);
    setParsing(true);
    const form = new FormData();
    form.append('resume', file);
    try {
      const res = await api.post('/resume/parseResume', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { aboutMe: aiAbout, skills: aiSkills, roleMatch: aiRole, experience: aiExp } = res.data;
      setAboutMe(aiAbout);
      setSkills(aiSkills);
      setRoleMatch(aiRole);
      setResumeExperience(aiExp);
    } catch (err) {
      console.error(err);
      alert('Failed to parse resume.');
    } finally {
      setParsing(false);
    }
  };

  // Fetch Linkedin Jobs
  const fetchJobs = async (settings: { location: string; dateSincePosted: string; jobType: string; experienceLevel: string; skills?: string[] }) => {
    setLoadingJobs(true);
    try {
      const response = await api.get('/linkedin-jobs/jobs', {
        params: {
          skills: (settings.skills || skills.slice(0, 3)).join(','), // Use updated skills or default to first three
          role: selectedRole,
          location: settings.location,
          dateSincePosted: settings.dateSincePosted,
          jobType: settings.jobType,
          experienceLevel: settings.experienceLevel,
        },
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={7}> {/* Adjusted width */}
          <Stack spacing={4}>
            {/* About Me Section */}
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1 }}>
              {/* Upload icon & filename above the title, right-aligned */}
              <Box display="flex" justifyContent="flex-end" mb={1}>
                <input
                  accept=".pdf,.docx"
                  id="upload-resume"
                  type="file"
                  hidden
                  onChange={handleResumeUpload}
                />
                <Tooltip title="Upload CV" arrow placement="left">
                <label htmlFor="upload-resume">
                  <IconButton component="span" sx={{ p: 0 }}>
                    <UploadFileIcon />
                  </IconButton>
                </label>
                </Tooltip>
                
                {resumeFileName && (
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 1,
                      maxWidth: 200,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {resumeFileName}
                  </Typography>
                )}
                {parsing && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Box>

              {/* Header */}
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }} align="center">
                  About Me
                </Typography>
              </Box>

              {/* Content */}
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Write about yourself..."
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
              />
            </Box>

            {/* Desired Role */}
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <WorkIcon fontSize="large" color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }} align="center">
                  Desired Role
                </Typography>
              </Box>
              <Autocomplete
                freeSolo
                options={roles}
                value={selectedRole}
                onInputChange={(_, val) => setSelectedRole(val)}
                renderInput={params => (
                  <TextField {...params} variant="outlined" placeholder="Select or type a role" />
                )}
              />
            </Box>

            {/* Skills */}
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <BuildIcon fontSize="large" color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }} align="center">
                  Skills
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
                {(showAllSkills ? skills : skills.slice(0, SKILL_DISPLAY_LIMIT)).map(skill => (
                  <Chip key={skill} label={skill} onDelete={() => handleDeleteSkill(skill)} />
                ))}
              </Stack>
              {shouldShowToggle && (
                <Button size="small" onClick={() => setShowAllSkills(prev => !prev)}>
                  {showAllSkills ? 'Show Less' : 'Show More'}
                </Button>
              )}
              <Box mt={2} display="flex" gap={2}>
                <Autocomplete
                  freeSolo
                  options={skillsList}
                  value={newSkill}
                  onInputChange={(_, val) => setNewSkill(val)}
                  onChange={(_, val) => val && handleAddSkill(val)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Add a skill"
                      onKeyDown={e => e.key === 'Enter' && handleAddSkill(newSkill)}
                    />
                  )}
                  sx={{ flexGrow: 1 }}
                />
                <Button variant="contained" onClick={() => handleAddSkill(newSkill)}>
                  Add
                </Button>
              </Box>
            </Box>

            {/* Suggested Role Match */}
            {roleMatch && (
              <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <WorkIcon fontSize="large" color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }} align="center">
                    Suggested Role Match
                  </Typography>
                </Box>
                <Typography>{roleMatch}</Typography>
              </Box>
            )}

            {/* Experience */}
            {resumeExperience.length > 0 && (
              <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <BuildIcon fontSize="large" color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }} align="center">
                    Experience
                  </Typography>
                </Box>
                <Stack component="ul" spacing={1} sx={{ pl: 2 }}>
                  {resumeExperience.map((exp, i) => (
                    <Typography component="li" key={i}>{exp}</Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1, textAlign: 'center' }}>
            <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
              <Avatar sx={{ width: 64, height: 64, mr: 2 }} />
              <Typography variant="h6">Connect Accounts</Typography>
            </Box>

            {showAuthOptions ? (
              <Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Method</InputLabel>
                </FormControl>
                <Select
                  value={useOAuth ? 'oauth' : 'no-auth'}
                  label="Method"
                  onChange={e => setUseOAuth(e.target.value === 'oauth')}
                >
                  <MenuItem value="oauth">OAuth</MenuItem>
                  <MenuItem value="no-auth">Username</MenuItem>
                </Select>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<GitHub />}
                  sx={{ my: 1 }}
                  onClick={handleGitHubConnect}
                >
                  Proceed with GitHub
                </Button>
                <Button fullWidth variant="outlined" onClick={() => setShowAuthOptions(false)}>
                  Cancel
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                <Button variant="contained" startIcon={<LinkedIn />} fullWidth>
                  Connect LinkedIn
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<GitHub />}
                  fullWidth
                  onClick={() => setShowAuthOptions(true)}
                >
                  Connect GitHub
                </Button>
              </Stack>
            )}

            {repos.length > 0 && (
              <Box mt={3} textAlign="left">
                <Typography variant="subtitle1" gutterBottom>
                  Repositories:
                </Typography>
                <Stack spacing={1} sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {repos.map(repo => (
                    <Button
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      variant="text"
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      {repo.name}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {/* Jobs Section */}
          <LinkedInIntegration
            jobs={jobs}
            loadingJobs={loadingJobs}
            fetchJobs={fetchJobs}
            showJobRecommendations={showJobRecommendations}
            toggleJobRecommendations={toggleJobRecommendations}
            skills={skills}
            selectedRole={selectedRole}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default MainDashboard;
