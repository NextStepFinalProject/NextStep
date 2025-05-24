import React, { useState } from 'react';
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
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LightbulbOutlined as LightbulbOutlinedIcon,
} from '@mui/icons-material';
import api from '../serverApi'; // Assuming you have a configured axios instance

// Define interfaces for the API response schemas
interface GeneratedQuestion {
  question: string;
}

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
  user_answer_list: string[]; // New field for user answers
  keywords: string[];
  interviewer_mindset: string;
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
  correctAnswer?: string; // Will be populated after grading
  grade?: number; // Will be populated after grading
  tip?: string; // Will be populated after grading
}

interface QuizState {
  _id: string;
  subject: string;
  questions: QuizStateQuestion[];
  finalGrade?: number;
  finalTip?: string;
  // Potentially store other fields from the initial generation response if needed for display
  title?: string;
  tags?: string[];
  content?: string;
  jobRole?: string;
}

const Quiz: React.FC = () => {
  const [subject, setSubject] = useState<string>('');
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<{ [key: number]: boolean }>({}); // To toggle answer visibility
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false); // To control UI after submission

  const handleGenerateQuiz = async () => {
    if (!subject) return;
    setLoading(true);
    setQuiz(null); // Clear previous quiz
    setQuizSubmitted(false); // Reset submission status
    setShowAnswer({}); // Reset answer visibility
    try {
      const response = await api.post<QuizGenerationResponse>('http://localhost:3000/quiz/generate', { subject });

      const generatedQuestions: QuizStateQuestion[] = response.data.question_list.map((q: string) => ({
        originalQuestion: q,
        userAnswer: '', // Initialize empty user answer
      }));

      setQuiz({
        _id: response.data._id,
        subject: subject, // Use the input subject for consistency
        questions: generatedQuestions,
        title: response.data.title,
        tags: response.data.tags,
        content: response.data.content,
        jobRole: response.data.job_role,
        // ... include other fields from response.data if you want to display them
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
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
    if (!quiz || quizSubmitted) return; // Prevent multiple submissions
    setLoading(true);

    const answeredQuizData: UserAnsweredQuiz = {
      _id: quiz._id,
      title: quiz.title || '',
      tags: quiz.tags || [],
      content: quiz.content || '',
      job_role: quiz.jobRole || '',
      company_name_en: '', // These are not directly from the quiz state, you might need to fetch/store them
      company_name_he: '', // Or adjust your backend to not require them for grading
      process_details: '', // Or adjust your backend to not require them for grading
      question_list: quiz.questions.map(q => q.originalQuestion),
      answer_list: quiz.questions.map(q => q.correctAnswer || ''), // Send known correct answers if available, otherwise empty
      user_answer_list: quiz.questions.map(q => q.userAnswer),
      keywords: [], // These are not directly from the quiz state, you might need to fetch/store them
      interviewer_mindset: '', // These are not directly from the quiz state, you might need to fetch/store them
    };

    try {
      // Send the entire schema with user_answer_list
      const response = await api.post<QuizGradingResponse>('http://localhost:3000/quiz/grade', answeredQuizData);

      const gradedQuizData = response.data;
      const updatedQuestions = quiz.questions.map((q, index) => {
        const gradedAnswer = gradedQuizData.graded_answers.find(ga => ga.question === q.originalQuestion);
        return {
          ...q,
          grade: gradedAnswer?.grade,
          tip: gradedAnswer?.tip,
          // The correct answer from the initial generation might not be sent back
          // with 'graded_answers'. If your backend sends it, update this line.
          // For now, we'll assume the original 'answer_list' from generation is the correct answer
          correctAnswer: quiz.answer_list?.[index], // Assuming answer_list was stored from generation
        };
      });

      setQuiz({
        ...quiz,
        questions: updatedQuestions,
        finalGrade: gradedQuizData.final_quiz_grade,
        finalTip: gradedQuizData.final_summary_tip,
      });
      setQuizSubmitted(true); // Mark quiz as submitted

      // Automatically show all answers after grading
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Quiz Generator & Grader
      </Typography>

      {/* Subject Input */}
      {!quiz && (
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom>
            Enter a Quiz Subject
          </Typography>
          <TextField
            fullWidth
            label="e.g., Java Spring Boot Microservices, React Hooks, Quantum Physics"
            variant="outlined"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerateQuiz()}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleGenerateQuiz}
            disabled={loading || !subject.trim()} // Disable if subject is empty or only whitespace
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
            Quiz on: {quiz.subject}
          </Typography>
          {quiz.title && (
            <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 2 }}>
              Topic: {quiz.title}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your answers may get better grades for broad, in-depth explanations. You can answer in any language you want!
          </Typography>
          {quiz.questions.map((q, index) => (
            <Paper key={index} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Question {index + 1}: {q.originalQuestion}
                </Typography>
                {quizSubmitted && ( // Only show the eye icon after submission
                  <Tooltip title={showAnswer[index] ? 'Hide Answer' : 'Show Answer'} arrow>
                    <IconButton onClick={() => handleToggleAnswerVisibility(index)} size="small">
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
                disabled={quizSubmitted} // Disable input after submission
              />

              {quizSubmitted && (
                <>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Your Grade:
                    </Typography>
                    {/* Optional: Gauge for grade */}
                    <Slider
                      value={q.grade || 0}
                      aria-label="Question grade"
                      valueLabelDisplay="on"
                      min={0}
                      max={100}
                      sx={{ width: '90%', mx: 'auto' }}
                      disabled // Make it non-interactive
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
                  {showAnswer[index] && q.correctAnswer && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                      <Typography variant="subtitle2">Correct Answer:</Typography>
                      <Typography variant="body2">{q.correctAnswer}</Typography>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          ))}

          {!quizSubmitted && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitQuiz}
              // Disable if no answers are provided (or only whitespace)
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
              {/* Optional: Gauge for final grade */}
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