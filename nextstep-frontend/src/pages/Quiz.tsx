import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Slider,
  Stack,
  Chip,
  Divider,
  Grid,
  Avatar,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LightbulbOutlined as LightbulbOutlinedIcon,
  WorkOutline as WorkOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  ForumOutlined as ForumOutlinedIcon,
  BusinessOutlined as BusinessOutlinedIcon,
  LocalOfferOutlined as LocalOfferOutlinedIcon,
} from '@mui/icons-material';
import SchoolIcon from '@mui/icons-material/School'; // Import graduation hat icon
import api from '../serverApi';
import { config } from '../config';

// Define interfaces for the API response schemas
interface QuizGenerationResponse {
  _id: string;
  title: string;
  tags: string[];
  content: string;
  job_role: string;
  company_name_en: string;
  company_name_he: string;
  process_details: string;
  question_list: string[];
  answer_list: string[];
  keywords: string[];
  interviewer_mindset: string;
  specialty_tags: string[];
}

interface UserAnsweredQuiz {
  _id: string;
  title: string;
  tags: string[];
  content: string;
  job_role: string;
  company_name_en: string;
  company_name_he: string;
  process_details: string;
  question_list: string[];
  answer_list: string[];
  user_answer_list: string[];
  keywords: string[];
  interviewer_mindset: string;
  specialty_tags: string[];
}

interface GradedAnswer {
  question: string;
  user_answer: string;
  grade: number;
  tip: string;
}

interface QuizGradingResponse {
  graded_answers: GradedAnswer[];
  final_quiz_grade: number;
  final_summary_tip: string;
}

// Internal state structure for the quiz, combining generated and graded data
interface QuizStateQuestion {
  originalQuestion: string;
  userAnswer: string;
  correctAnswer?: string;
  grade?: number;
  tip?: string;
}

interface QuizState {
  _id: string;
  subject: string;
  questions: QuizStateQuestion[];
  finalGrade?: number;
  finalTip?: string;
  // --- Additional fields from QuizGenerationResponse for display ---
  title?: string;
  tags?: string[];
  content?: string;
  jobRole?: string;
  companyNameEn?: string;
  processDetails?: string;
  keywords?: string[];
  interviewerMindset?: string;
  answer_list?: string[]; // Store the original answer list for display after grading
  specialty_tags?: string[]; // Add specialty tags to the state
}

const Quiz: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [subject, setSubject] = useState<string>(searchParams.get('subject') || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<{
    code: boolean;
    design: boolean;
    technologies: boolean;
  }>({
    code: false,
    design: false,
    technologies: false,
  });
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<{ [key: number]: boolean }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handleGenerateQuiz = async () => {
    if (!subject.trim()) return;
    setLoading(true);
    setQuiz(null);
    setQuizSubmitted(false);
    setShowAnswer({});

    // Build the full subject with specialties
    let fullSubject = subject;
    if (selectedSpecialties.code) fullSubject += ' SPECIALTY_CODE';
    if (selectedSpecialties.design) fullSubject += ' SPECIALTY_DESIGN';
    if (selectedSpecialties.technologies) fullSubject += ' SPECIALTY_TECHNOLOGIES';

    try {
      const response = await api.post<QuizGenerationResponse>(`${config.app.backend_url()}/quiz/generate`, { subject: fullSubject });

      // Validate the response data
      if (!response.data || !response.data.question_list || !response.data.answer_list) {
        throw new Error('Invalid quiz data received from server');
      }

      const generatedQuestions: QuizStateQuestion[] = response.data.question_list.map((q: string, idx: number) => ({
        originalQuestion: q,
        userAnswer: '',
        correctAnswer: response.data.answer_list[idx], // Populate correct answer immediately
      }));

      setQuiz({
        _id: response.data._id,
        subject: subject,
        questions: generatedQuestions,
        title: response.data.title,
        tags: response.data.tags,
        content: response.data.content,
        jobRole: response.data.job_role,
        companyNameEn: response.data.company_name_en,
        processDetails: response.data.process_details,
        keywords: response.data.keywords,
        interviewerMindset: response.data.interviewer_mindset,
        answer_list: response.data.answer_list,
        specialty_tags: response.data.specialty_tags,
      });

    } catch (error: any) {
      console.error('Error generating quiz:', error);
      let errorMessage = 'Failed to generate quiz. ';
      
      if (error.response?.data?.message) {
        // Server returned an error message
        errorMessage += error.response.data.message;
      } else if (error.message) {
        // Other error with message
        errorMessage += error.message;
      } else {
        // Generic error
        errorMessage += 'Please try again.';
      }

      // Show error in a more user-friendly way
      alert(errorMessage);
      
      // Reset loading state
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleUserAnswerChange = (index: number, answer: string) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions];
      updatedQuestions[index].userAnswer = answer;
      setQuiz({ ...quiz, questions: updatedQuestions });
    }
  };

  const handleToggleAnswerVisibility = (index: number) => {
    setShowAnswer(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || quizSubmitted) return;
    setLoading(true);

    const answeredQuizData: UserAnsweredQuiz = {
      _id: quiz._id,
      title: quiz.title || '',
      tags: quiz.tags || [],
      content: quiz.content || '',
      job_role: quiz.jobRole || '',
      company_name_en: quiz.companyNameEn || '',
      company_name_he: '',
      process_details: quiz.processDetails || '',
      question_list: quiz.questions.map(q => q.originalQuestion),
      answer_list: quiz.answer_list || [],
      user_answer_list: quiz.questions.map(q => q.userAnswer),
      keywords: quiz.keywords || [],
      interviewer_mindset: quiz.interviewerMindset || '',
      specialty_tags: quiz.specialty_tags || [],
    };

    try {
      const response = await api.post<QuizGradingResponse>(`${config.app.backend_url()}/quiz/grade`, answeredQuizData);

      const gradedQuizData = response.data;
      const updatedQuestions = quiz.questions.map((q, _) => {
        const gradedAnswer = gradedQuizData.graded_answers.find(ga => ga.question === q.originalQuestion);
        return {
          ...q,
          grade: gradedAnswer?.grade,
          tip: gradedAnswer?.tip,
          // correctAnswer is already present from generation
        };
      });

      setQuiz({
        ...quiz,
        questions: updatedQuestions,
        finalGrade: gradedQuizData.final_quiz_grade,
        finalTip: gradedQuizData.final_summary_tip,
      });
      setQuizSubmitted(true);

      // After submission, automatically show all correct answers and grades
      const initialShowAnswer: { [key: number]: boolean } = {};
      updatedQuestions.forEach((_, index) => {
        initialShowAnswer[index] = true;
      });
      setShowAnswer(initialShowAnswer);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz for grading. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubject = (newSubject: string) => {
    setSubject(newSubject);
    setQuiz(null); // Reset the quiz to allow generating a new one with the updated subject
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ position: 'relative' }}>
        Quiz Generator &{' '}
        <Box sx={{ display: 'inline-block', position: 'relative' }}>
          <SchoolIcon
            sx={{
              position: 'absolute',
              top: '-10px',
              left: '110%',
              size: 'large',
              transform: 'translateX(-50%) rotate(30deg)',
              fontSize: 30,
              color: 'primary.main',
            }}
          />
          Grader
        </Box>
      </Typography>

      {/* Subject Input */}
      {!quiz && (
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom>
          </Typography>
          <TextField
            fullWidth
            label="Quiz Subject"
            placeholder="e.g., Java Spring Boot Microservices, React Hooks, Quantum Physics"
            variant="outlined"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerateQuiz()}
            sx={{ mb: 2 }}
          />
          
          {/* Specialty Selection */}
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Select Specialties (Optional):
          </Typography>
          <FormGroup row sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedSpecialties.code}
                  onChange={(e) => setSelectedSpecialties(prev => ({ ...prev, code: e.target.checked }))}
                />
              }
              label="Code"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedSpecialties.design}
                  onChange={(e) => setSelectedSpecialties(prev => ({ ...prev, design: e.target.checked }))}
                />
              }
              label="Design"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedSpecialties.technologies}
                  onChange={(e) => setSelectedSpecialties(prev => ({ ...prev, technologies: e.target.checked }))}
                />
              }
              label="Technologies"
            />
          </FormGroup>

          <Button
            variant="contained"
            onClick={handleGenerateQuiz}
            disabled={loading || !subject.trim()}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Quiz'}
          </Button>
        </Box>
      )}

      {/* Generated Quiz Display */}
      {quiz && (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
            Quiz on: 
            <TextField
              value={subject}
              onChange={(e) => handleEditSubject(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ ml: 2, width: '50%' }}
            />
          </Typography>

          {/* --- Enhanced Display of Quiz Metadata --- */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Grid container spacing={2}>
              {quiz.title && (
                <Grid item xs={12}>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    <InfoOutlinedIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Quiz Title: {quiz.title}
                  </Typography>
                </Grid>
              )}

              {quiz.jobRole && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" color="text.secondary">
                    <WorkOutlineIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Job Role: <strong>{quiz.jobRole}</strong>
                  </Typography>
                </Grid>
              )}

              {quiz.companyNameEn && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" color="text.secondary">
                    <BusinessOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Company: <strong>{quiz.companyNameEn}</strong>
                  </Typography>
                </Grid>
              )}

              {quiz.tags && quiz.tags.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <LocalOfferOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Tags:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" spacing={1}>
                    {quiz.tags.map((tag, i) => (
                      <Chip key={i} label={tag} size="small" variant="outlined" color="primary" />
                    ))}
                  </Stack>
                </Grid>
              )}

              {quiz.specialty_tags && quiz.specialty_tags.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <LocalOfferOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Specialties:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" spacing={1}>
                    {quiz.specialty_tags.map((specialty, i) => (
                      <Chip 
                        key={i} 
                        label={specialty.replace('SPECIALTY_', '')} 
                        size="small" 
                        variant="outlined" 
                        sx={{
                          borderColor: 'warning.main',
                          color: 'warning.dark',
                          '&:hover': {
                            backgroundColor: 'warning.light',
                            borderColor: 'warning.dark',
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Grid>
              )}

              {quiz.keywords && quiz.keywords.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <LocalOfferOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Keywords:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" spacing={1}>
                    {quiz.keywords.map((keyword, i) => (
                      <Chip key={i} label={keyword} size="small" variant="outlined" color="secondary" />
                    ))}
                  </Stack>
                </Grid>
              )}

              {quiz.processDetails && (
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <InfoOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Process Details:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                    {quiz.processDetails}
                  </Typography>
                </Grid>
              )}

              {quiz.content && (
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <InfoOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Context/Content:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                    {quiz.content}
                  </Typography>
                </Grid>
              )}

              {quiz.interviewerMindset && (
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <ForumOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Interviewer Mindset:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 3 }}>
                    "{quiz.interviewerMindset}"
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
          <Divider sx={{ my: 4 }} />
          {/* --- End Enhanced Display of Quiz Metadata --- */}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your answers may get better grades for broad, in-depth explanations. You can answer in any language you want!
          </Typography>
          {quiz.questions.map((q, index) => (
            <Paper key={index} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                {/* Circled Numbering (Option 2) */}
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 32,
                    height: 32,
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    mr: 1.5,
                    boxShadow: 2,
                    flexShrink: 0, // Prevent shrinking on small screens
                  }}
                >
                  {index + 1}
                </Avatar>
                {/* Question Text */}
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {q.originalQuestion}
                </Typography>
                {/* Blinking Eye Icon (now always visible if answer exists) */}
                {q.correctAnswer && (
                  <Tooltip title={showAnswer[index] ? 'Hide Answer' : 'Show Answer'} arrow>
                    <IconButton onClick={() => handleToggleAnswerVisibility(index)} size="small" sx={{ flexShrink: 0, ml: 1 }}>
                      {showAnswer[index] ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                label="Your Answer"
                value={q.userAnswer}
                onChange={e => handleUserAnswerChange(index, e.target.value)}
                sx={{ mb: 2 }}
                disabled={quizSubmitted}
              />

              {/* Grade and Tip are still shown only after submission */}
              {quizSubmitted && (
                <>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Your Grade:
                    </Typography>
                    <Slider
                      value={q.grade || 0}
                      aria-label="Question grade"
                      valueLabelDisplay="on"
                      min={0}
                      max={100}
                      sx={{ width: '90%', mx: 'auto' }}
                      disabled
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Tip:
                    </Typography>
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <LightbulbOutlinedIcon color="info" sx={{ mt: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {q.tip}
                      </Typography>
                    </Stack>
                  </Box>
                </>
              )}
              {/* Correct answer display is now independent of quizSubmitted for showing */}
              {showAnswer[index] && q.correctAnswer && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Correct Answer:</Typography>
                  <Typography variant="body2">{q.correctAnswer}</Typography>
                </Box>
              )}
            </Paper>
          ))}

          {!quizSubmitted && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitQuiz}
              disabled={loading || !quiz.questions.some(q => q.userAnswer.trim() !== '')}
              fullWidth
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Calculate Grade'}
            </Button>
          )}

          {quizSubmitted && quiz.finalGrade !== undefined && (
            <Box sx={{ mt: 4, p: 3, bgcolor: '#e8f5e9', borderRadius: 2, boxShadow: 2, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Final Quiz Grade:
              </Typography>
              <Slider
                value={quiz.finalGrade || 0}
                aria-label="Final quiz grade"
                valueLabelDisplay="on"
                min={0}
                max={100}
                sx={{ width: '80%', mx: 'auto', mb: 2 }}
                disabled
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Overall Tip:
              </Typography>
              <Stack direction="row" alignItems="flex-start" spacing={1} justifyContent="center">
                <LightbulbOutlinedIcon color="success" sx={{ mt: 0.5 }} />
                <Typography variant="body1" color="text.primary">
                  {quiz.finalTip}
                </Typography>
              </Stack>
              <Button
                variant="outlined"
                onClick={() => {
                  setSubject('');
                  setQuiz(null);
                  setQuizSubmitted(false);
                }}
                sx={{ mt: 3 }}
              >
                Generate New Quiz
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default Quiz;