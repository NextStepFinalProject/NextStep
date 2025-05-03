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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { config } from '../config';
import api from '../serverApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ScoreGauge from '../components/ScoreGauge';
import Carousel from 'react-material-ui-carousel';
import './Resume.css';

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

const TemplateCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  '& .MuiCardMedia-root': {
    height: 'calc(100vh - 300px)',
    minHeight: '600px',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundColor: theme.palette.grey[100],
    width: '100%',
  },
}));

const NavigationContainer = styled(Box)(({ theme }) => ({
  top: 0,
  zIndex: 1000,
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
}));

const StepperContainer = styled(Box)(({ theme }) => ({
  top: 64,
  zIndex: 999,
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
}));

const GeneratedWordPreview: React.FC<{ base64Content: string }> = ({ base64Content }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uploadAndPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        // Convert base64 to blob
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const formData = new FormData();
        formData.append('file', blob, 'generated.docx');
        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) throw new Error('Failed to upload file');
        const data = await response.json();
        const downloadUrl = data.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
        const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`;
        setPreviewUrl(officeUrl);
      } catch (err: any) {
        setError('Failed to prepare document preview');
      } finally {
        setLoading(false);
      }
    };
    uploadAndPreview();
  }, [base64Content]);

  if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!previewUrl) return null;
  return (
    <Box sx={{ width: '100%', height: 700, mt: 2 }}>
      <iframe
        src={previewUrl}
        style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
        title="Generated Resume Word Preview"
      />
    </Box>
  );
};

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewUrlCache, setPreviewUrlCache] = useState<Record<string, string>>({});
  const [generatedResume, setGeneratedResume] = useState<{ content: string; type: string } | null>(null);
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
        // Set initial selected template and trigger preview
        if (response.data.length > 0) {
          setSelectedTemplate(0);
        }
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

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTryAnotherTemplate = () => {
    setGeneratedResume(null); // Clear the generated resume
    setActiveStep(1); // Go back to template selection
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleGenerateResume = async () => {
    if (selectedTemplate === null) {
      setError('Please select a template');
      return;
    }
    if (!feedback.trim()) {
      setError('Please analyze your resume and get feedback first.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedTemplateData = templates[selectedTemplate];
      const response = await api.post('/resume/generate', {
        feedback,
        jobDescription,
        templateName: selectedTemplateData.name
      });

      setGeneratedResume(response.data);
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resume');
    } finally {
      setLoading(false);
    }
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
    if (!template.type.includes('word')) return;

    const cacheKey = `${template.name}-${template.type}`;
    if (previewUrlCache[cacheKey]) {
      setPreviewUrl(previewUrlCache[cacheKey]);
      return;
    }

    try {
      setPreviewUrl(null); // Clear current preview while loading
      const fileName = `${template.name}${template.type.includes('docx') ? '.docx' : '.doc'}`;
      const tmpUrl = await uploadToTmpFiles(template.content, fileName);
      const previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(tmpUrl)}`;
      
      setPreviewUrlCache(prev => ({
        ...prev,
        [cacheKey]: previewUrl
      }));
      
      setPreviewUrl(previewUrl);
    } catch (error) {
      console.error('Error preparing preview:', error);
      setError('Failed to prepare document preview');
    }
  };

  useEffect(() => {
    if (templates.length > 0 && selectedTemplate !== null) {
      const currentTemplate = templates[selectedTemplate];
      if (currentTemplate.type.includes('word')) {
        // Check cache first
        const cacheKey = `${currentTemplate.name}-${currentTemplate.type}`;
        if (previewUrlCache[cacheKey]) {
          setPreviewUrl(previewUrlCache[cacheKey]);
        } else {
          // If not in cache, load the preview
          handlePreviewOpen(currentTemplate);
        }
      } else {
        setPreviewUrl(null);
      }
    }
  }, [selectedTemplate, templates]);

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
          <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, pt: 12 }}>
            <Typography variant="h4" gutterBottom>
              Choose a template
            </Typography>
            <Carousel
              sx={{ 
                width: '100%',
                maxWidth: '1200px',
                mx: 'auto',
                '& .MuiCarousel-root': {
                  width: '100%',
                }
              }}
              autoPlay={false}
              animation="slide"
              navButtonsAlwaysVisible
              indicators
              onChange={(index?: number) => {
                if (typeof index === 'number') {
                  setSelectedTemplate(index);
                }
              }}
            >
              {templates.map((template, templateIndex) => (
                <TemplateCard key={template.name}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography gutterBottom variant="h5" component="div">
                        {template.name}
                      </Typography>
                      <Box>
                        <Button
                          size="small"
                          variant={selectedTemplate === templateIndex ? "contained" : "outlined"}
                          onClick={() => setSelectedTemplate(templateIndex)}
                          sx={{ mr: 1 }}
                        >
                          {selectedTemplate === templateIndex ? "Selected" : "Select"}
                        </Button>
                        <Button
                          size="small"
                          href={`data:${template.type};base64,${template.content}`}
                          download={`${template.name}${template.type.includes('docx') ? '.docx' : '.doc'}`}
                        >
                          Download
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardMedia
                    component="div"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      height: '100%',
                    }}
                  >
                    {template.type === 'application/pdf' ? (
                      <Box sx={{ 
                        width: '100%', 
                        height: '100%', 
                        transform: 'scale(0.9)',
                        transformOrigin: 'center center'
                      }}>
                        <iframe
                          src={`data:${template.type};base64,${template.content}`}
                          style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                          title={template.name}
                        />
                      </Box>
                    ) : (
                      previewUrl && selectedTemplate === templateIndex ? (
                        <iframe
                          src={previewUrl}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            border: 'none',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            background: '#fff'
                          }}
                          title={template.name}
                        />
                      ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6">Loading Preview...</Typography>
                          <CircularProgress />
                        </Box>
                      )
                    )}
                  </CardMedia>
                </TemplateCard>
              ))}
            </Carousel>
          </Box>
        );
      case 2:
        const selectedTemplateName = selectedTemplate !== null ? templates[selectedTemplate]?.name : '';
        const hasFeedback = feedback.trim() !== '';
        const canGenerate =
          selectedTemplate !== null &&
          hasFeedback &&
          jobDescription.trim() !== '' &&
          !loading;
        return (
          <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Generate matching resume
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                <strong>Selected Template:</strong> {selectedTemplateName || <span style={{color: 'red'}}>None selected</span>}
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                <strong>Job Description:</strong>
              </Typography>
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1, minHeight: 60, mb: 1 }}>
                {jobDescription ? jobDescription : <span style={{color: 'red'}}>No job description provided</span>}
              </Box>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                <strong>Feedback:</strong> {hasFeedback ? <span style={{color: 'green'}}>Feedback available</span> : <span style={{color: 'red'}}>No feedback. Please get feedback in the "Score your resume" step first.</span>}
              </Typography>
            </Box>
            {!generatedResume && (
              <Button
                variant="contained"
                onClick={handleGenerateResume}
                disabled={!canGenerate}
                sx={{ mt: 2 }}
              >
                {loading ? 'Generating...' : 'Generate Resume'}
              </Button>
            )}
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
            )}
            {generatedResume && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Button
                    variant="contained"
                    href={`data:${generatedResume.type};base64,${generatedResume.content}`}
                    download={`improved_resume${generatedResume.type.includes('docx') ? '.docx' : generatedResume.type.includes('pdf') ? '.pdf' : ''}`}
                  >
                    Download Improved Resume
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleTryAnotherTemplate}
                  >
                    Try Another Template
                  </Button>
                </Box>
                {/* Preview for generated resume */}
                {generatedResume.type.includes('word') ? (
                  <GeneratedWordPreview base64Content={generatedResume.content} />
                ) : generatedResume.type.includes('pdf') ? (
                  <Box sx={{ width: '100%', height: 700, mt: 2 }}>
                    <iframe
                      src={`data:${generatedResume.type};base64,${generatedResume.content}`}
                      style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                      title="Generated Resume PDF Preview"
                    />
                  </Box>
                ) : null}
              </Box>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <NavigationContainer>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={activeStep === steps.length - 1 || (activeStep === 2 && !generatedResume)}
        >
          Next
        </Button>
      </NavigationContainer>

      <StepperContainer>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </StepperContainer>

      {renderStepContent(activeStep)}
    </Box>
  );
};

export default Resume; 