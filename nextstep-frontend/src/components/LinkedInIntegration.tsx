import React, { useState } from 'react';
import { Box, Typography, Button, Grid, CircularProgress, IconButton } from '@mui/material';
import { ExpandLess, ExpandMore, LinkedIn } from '@mui/icons-material'; // Import LinkedIn icon

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
  fetchJobs: () => Promise<void>;
  showJobRecommendations: boolean;
  toggleJobRecommendations: () => void;
  skills: string[];
  selectedRole: string;
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
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1, mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <LinkedIn sx={{ color: '#0077b5'}} /> 
          <Typography variant="h6" textAlign="center" flex={1}>
            Job Recommendations
          </Typography>
        </Box>
        <IconButton size="small" onClick={toggleJobRecommendations} sx={{ p: 0 }}>
          {showJobRecommendations ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      {showJobRecommendations && (
        <>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              onClick={fetchJobs}
              disabled={loadingJobs || skills.length === 0 || !selectedRole}
              sx={{
                width: '100%',
                maxWidth: '200px',
                padding: '8px 0',
                fontSize: '0.85rem',
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: '#lighten(#1976d2, 0.1)',
                },
              }}
            >
              {loadingJobs ? <CircularProgress size={16} color="inherit" /> : 'Find Jobs'}
            </Button>
          </Box>
          {jobs.length > 0 && (
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
          )}
        </>
      )}
    </Box>
  );
};

export default LinkedInIntegration;
