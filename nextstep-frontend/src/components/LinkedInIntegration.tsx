import React, { useState } from 'react';
import { Box, Typography, Button, Grid, CircularProgress, IconButton, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { ExpandLess, ExpandMore, LinkedIn, Settings } from '@mui/icons-material';

interface Job {
  position: string;
  company: string;
  location: string;
  url: string;
  companyLogo?: string;
}

interface LinkedInIntegrationProps {
  jobs: Job[];
  loadingJobs: boolean;
  fetchJobs: (settings: LinkedInSettings) => Promise<void>;
  showJobRecommendations: boolean;
  toggleJobRecommendations: () => void;
  skills: string[];
  selectedRole: string;
}

interface LinkedInSettings {
  location: string;
  dateSincePosted: string;
  jobType: string;
  experienceLevel: string;
  skills: string[];
}

const LinkedInIntegration: React.FC<LinkedInIntegrationProps> = ({
  jobs,
  loadingJobs,
  fetchJobs,
  showJobRecommendations,
  toggleJobRecommendations,
  skills,
  selectedRole,
}) => {
  const [settings, setSettings] = useState<LinkedInSettings>({
    location: 'Israel',
    dateSincePosted: 'past week',
    jobType: 'full time',
    experienceLevel: 'entry level',
    skills: skills.slice(0, 3), // Limit to first 3 skills
  });

  const handleSettingChange = (key: keyof LinkedInSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSkillChange = (index: number, value: string) => {
    const updatedSkills = [...settings.skills];
    updatedSkills[index] = value;
    setSettings((prev) => ({ ...prev, skills: updatedSkills }));
  };

  const handleFetchJobs = () => {
    fetchJobs(settings);
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1, mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <LinkedIn sx={{ color: '#0077b5' }} />
          <Typography variant="h6" textAlign="center" flex={1}>
            Job Recommendations
          </Typography>
        </Box>
        <IconButton size="small" onClick={toggleJobRecommendations} sx={{ p: 0 }}>
          {showJobRecommendations ? <ExpandLess /> : <Settings />}
        </IconButton>
      </Box>
      {showJobRecommendations && (
        <>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Selected Role:</strong> {selectedRole || 'None'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  value={settings.location}
                  onChange={(e) => handleSettingChange('location', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Since Posted</InputLabel>
                  <Select
                    value={settings.dateSincePosted}
                    onChange={(e) => handleSettingChange('dateSincePosted', e.target.value)}
                  >
                    <MenuItem value="past day">Past Day</MenuItem>
                    <MenuItem value="past week">Past Week</MenuItem>
                    <MenuItem value="past month">Past Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={settings.jobType}
                    onChange={(e) => handleSettingChange('jobType', e.target.value)}
                  >
                    <MenuItem value="full time">Full Time</MenuItem>
                    <MenuItem value="part time">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={settings.experienceLevel}
                    onChange={(e) => handleSettingChange('experienceLevel', e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="entry level">Entry Level</MenuItem>
                    <MenuItem value="mid level">Mid Level</MenuItem>
                    <MenuItem value="senior level">Senior Level</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Skills Sent:</strong>
                </Typography>
                {settings.skills.map((skill, index) => (
                  <TextField
                    key={index}
                    label={`Skill ${index + 1}`}
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    fullWidth
                    sx={{ mt: 1 }}
                  />
                ))}
              </Grid>
              <br/>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              onClick={handleFetchJobs}
              disabled={loadingJobs || settings.skills.length === 0 || !selectedRole}
              sx={{
                width: '100%',
                maxWidth: '200px',
                padding: '8px 0',
                fontSize: '0.85rem',
                borderRadius: '6px',
              }}
            >
              {loadingJobs ? <CircularProgress size={16} color="inherit" /> : 'Find Jobs'}
            </Button>
          </Box>
          {jobs.length > 0 ? (
            <Grid container spacing={2}>
              {jobs.map((job, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid #ddd',
                      borderRadius: 2,
                      height: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflowY: 'auto',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {job.companyLogo && (
                          <img
                            src={job.companyLogo}
                            alt={`${job.company} logo`}
                            style={{ width: '20px', height: '20px', marginRight: '8px' }}
                          />
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {job.company}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{job.position.toLowerCase()}</Typography>
                      <br />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {job.location}
                      </Typography>
                    </Box>
                    <Button
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      View Job
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              No job recommendations found. Try adjusting your search settings.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default LinkedInIntegration;
