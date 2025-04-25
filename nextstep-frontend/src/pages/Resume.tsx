import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  TextField,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Modal,
  IconButton,
  Zoom
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { config } from '../config';
import api from '../serverApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ScoreGauge from '../components/ScoreGauge';
import Carousel from 'react-material-ui-carousel';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const steps = ['Score your resume', 'Choose a template', 'Generate matching resume'];

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
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  textAlign: 'left',
  '& pre': {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    overflowX: 'auto',
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: theme.palette.grey[100],
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    textAlign: 'left',
  },
  '& p': {
    textAlign: 'left',
  },
}));

const PreviewModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ModalContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
}));

const ZoomButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  bottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.background.paper,
  },
}));

const TemplateCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  '& .MuiCardMedia-root': {
    height: 300,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundColor: theme.palette.grey[100],
  },
}));

const Resume: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<Array<{ name: string; content: string; type: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<{ name: string; content: string; type: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedbackEndRef.current) {
      feedbackEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feedback]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/resume/templates');
        setTemplates(response.data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, []);

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
            setActiveStep(1); // Move to next step after scoring
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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleGenerateResume = () => {
    // TODO: Implement resume generation
    console.log('Generating resume with template:', selectedTemplate);
  };

  const uploadToTmpFiles = async (base64Content: string, fileName: string): Promise<string> => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, fileName);

      // Upload to tmpfiles.org
      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();

      // Manipulate the URL to add '/dl' after the domain
      const downloadUrl = data.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');

      console.log(downloadUrl);

      return downloadUrl;
    } catch (error) {
      console.error('Error uploading to tmpfiles.org:', error);
      throw error;
    }
  };

  const handlePreviewOpen = async (template: { name: string; content: string; type: string }) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
    
    if (template.type.includes('word')) {
      try {
        const fileName = `${template.name}${template.type.includes('docx') ? '.docx' : '.doc'}`;
        const tmpUrl = await uploadToTmpFiles(template.content, fileName);
        const previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(tmpUrl)}`;
        setPreviewUrl(previewUrl);
      } catch (error) {
        console.error('Error preparing preview:', error);
        setError('Failed to prepare document preview');
      }
    }
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewTemplate(null);
    setPreviewUrl(null);
  };

  const renderTemplatePreview = (template: { name: string; content: string; type: string }) => {
    if (template.type === 'application/pdf') {
      const base64Data = `data:${template.type};base64,${template.content}`;
      return (
        <iframe
          src={base64Data}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={template.name}
        />
      );
    } else if (template.type.includes('word')) {
      if (previewUrl) {
        return (
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={template.name}
          />
        );
      } else {
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Loading Preview...</Typography>
            <CircularProgress />
          </Box>
        );
      }
    }
    return null;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
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
                <FeedbackContainer>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {feedback}
                  </ReactMarkdown>
                  <div ref={feedbackEndRef} />
                </FeedbackContainer>
              </Box>
            )}

            {score !== null && (
              <Box sx={{ mb: 3 }}>
                <ScoreGauge score={score} />
              </Box>
            )}
          </Box>
        );
      case 1:
        return (
          <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Choose a template
            </Typography>
            <Carousel
              sx={{ maxWidth: 600, mx: 'auto' }}
              autoPlay={false}
              animation="slide"
              navButtonsAlwaysVisible
              indicators
            >
              {templates.map((template, index) => (
                <TemplateCard key={template.name}>
                  <CardMedia
                    component="div"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={() => handlePreviewOpen(template)}
                  >
                    {template.type === 'application/pdf' ? (
                      <iframe
                        src={`data:${template.type};base64,${template.content}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title={template.name}
                      />
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Word Document</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Click to preview
                        </Typography>
                      </Box>
                    )}
                  </CardMedia>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {template.name}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      variant={selectedTemplate === index ? "contained" : "outlined"}
                      onClick={() => setSelectedTemplate(index)}
                    >
                      {selectedTemplate === index ? "Selected" : "Select"}
                    </Button>
                    <Button
                      size="small"
                      href={`data:${template.type};base64,${template.content}`}
                      download={`${template.name}${template.type.includes('docx') ? '.docx' : '.doc'}`}
                    >
                      Download
                    </Button>
                  </CardActions>
                </TemplateCard>
              ))}
            </Carousel>

            <PreviewModal
              open={previewOpen}
              onClose={handlePreviewClose}
              closeAfterTransition
            >
              <Zoom in={previewOpen}>
                <ModalContent>
                  <CloseButton onClick={handlePreviewClose}>
                    <CloseIcon />
                  </CloseButton>
                  {previewTemplate && renderTemplatePreview(previewTemplate)}
                </ModalContent>
              </Zoom>
            </PreviewModal>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Generate matching resume
            </Typography>
            <Button
              variant="contained"
              onClick={handleGenerateResume}
              disabled={selectedTemplate === null}
            >
              Generate Resume
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={activeStep === steps.length - 1}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default Resume; 