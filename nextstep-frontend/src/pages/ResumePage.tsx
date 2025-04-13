import React, { useState, useRef } from 'react';
import { Box, Button, CircularProgress, Typography, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import api from '../serverApi';
import TopBar from '../components/TopBar';

const UploadBox = styled(Box)(({ theme }) => ({
  border: '2px dashed #ccc',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const ScoreGauge = styled(Box)<{ score: number }>(({ theme, score }) => ({
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `conic-gradient(
    ${theme.palette.error.main} 0% 33%,
    ${theme.palette.warning.main} 33% 66%,
    ${theme.palette.success.main} 66% 100%
  )`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: theme.palette.background.paper,
  },
}));

const ScoreText = styled(Typography)({
  position: 'absolute',
  fontSize: '2.5rem',
  fontWeight: 'bold',
});

const ResumePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const uploadResume = async (formData: FormData) => {
    // First, upload the resume file to get the filename
    const response = await api.post('/resource/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setError('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setFeedback('');
    setScore(null);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // First upload the file
      const filename = await uploadResume(formData);

      // Then set up the EventSource for streaming with authentication
      const token = localStorage.getItem(config.localStorageKeys.userAuth) 
        ? JSON.parse(localStorage.getItem(config.localStorageKeys.userAuth)!).accessToken 
        : '';
      
      const eventSource = new EventSource(
        `${config.app.backend_url()}/resume/streamScore/${filename}?jobDescription=${encodeURIComponent(jobDescription)}&token=${encodeURIComponent(token)}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.done) {
            // Final score received
            setScore(data.score);
            eventSource.close();
            setLoading(false);
          } else if (data.chunk) {
            // Streamed chunk received
            setFeedback(prev => prev + data.chunk);
          }
        } catch (e) {
          console.error('Error parsing event data:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setError('Failed to analyze resume');
        eventSource.close();
        setLoading(false);
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <TopBar />
      <Typography variant="h4" gutterBottom>
        Resume Score Analyzer
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Job Description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          sx={{ mb: 2 }}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
        />

        <UploadBox onClick={handleUploadClick}>
          {file ? (
            <Typography>{file.name}</Typography>
          ) : (
            <Typography>Click to upload your resume</Typography>
          )}
        </UploadBox>

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading || !file}
        sx={{ mb: 3 }}
      >
        {loading ? 'Analyzing...' : 'Analyze Resume'}
      </Button>

      {loading && <CircularProgress />}

      {feedback && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Feedback:
          </Typography>
          <Typography
            sx={{
              whiteSpace: 'pre-wrap',
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
            }}
          >
            {feedback}
          </Typography>
        </Box>
      )}

      {score !== null && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ScoreGauge score={score}>
            <ScoreText>{score}</ScoreText>
          </ScoreGauge>
        </Box>
      )}
    </Box>
  );
};

export default ResumePage; 