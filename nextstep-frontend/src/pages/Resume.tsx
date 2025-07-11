import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { config } from '../config';
import api from '../serverApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ScoreGauge from '../components/ScoreGauge';
import './Resume.css';

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

const FeedbackContainer = styled(Box)(({ theme }) => ({
  maxHeight: '60vh',
  overflowY: 'auto',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  textAlign: 'left',
  color: theme.palette.text.primary,
  '& pre': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
    color: theme.palette.text.primary,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    overflowX: 'auto',
    margin: theme.spacing(2, 0),
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5),
    textAlign: 'left',
    color: theme.palette.text.primary,
  },
  '& th': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
    color: theme.palette.text.primary,
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    textAlign: 'left',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  '& p': {
    textAlign: 'left',
    marginBottom: theme.spacing(2),
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  '& ul, & ol': {
    marginLeft: theme.spacing(4),
    marginBottom: theme.spacing(2),
  },
  '& li': {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    margin: theme.spacing(2, 0),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
  },
  '& code': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
    color: theme.palette.text.primary,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.875em',
  },
  '& strong, & b': {
    color: theme.palette.text.primary,
  },
  '& em, & i': {
    color: theme.palette.text.primary,
  },
}));

const Resume: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedbackEndRef.current) {
      feedbackEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [feedback]);

  const uploadResume = async (formData: FormData) => {
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

      const filename = await uploadResume(formData);

      const token = localStorage.getItem(config.localStorageKeys.userAuth) 
        ? JSON.parse(localStorage.getItem(config.localStorageKeys.userAuth)!).accessToken 
        : '';
      
      const eventSource = new EventSource(
        `${config.app.backend_url()}/resume/streamScore/${filename}?jobDescription=${encodeURIComponent(jobDescription)}&accessToken=${encodeURIComponent(token)}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.done) {
            setScore(data.score);
            eventSource.close();
            setLoading(false);
          } else if (data.chunk) {
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

    } catch (err: any) {
      if (err.response && err.response.status === 400 &&
          err.response.data && err.response.data &&
          err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          textAlign: 'center',
        }}
      >
        Score your resume
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Job Description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper'
            }
          }}
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

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !file}
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </Button>
      </Box>

      {loading && <CircularProgress />}

      {feedback && (
        <Box sx={{ mb: 3, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Analysis Feedback:
          </Typography>
          <FeedbackContainer>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {feedback}
            </ReactMarkdown>
            <div ref={feedbackEndRef} />
          </FeedbackContainer>
        </Box>
      )}

      {score !== null && (
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          width: '100%'
        }}>
          <ScoreGauge score={score} />
        </Box>
      )}
    </Box>
  );
};

export default Resume; 