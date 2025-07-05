"use client"

import type React from "react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
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
  Stack,
  Chip,
  Divider,
  Grid,
  Avatar,
  FormGroup,
  FormControlLabel,
  Checkbox,
  useTheme,
  alpha,
  Card,
  CardContent,
  LinearProgress,
  Fade,
  Zoom,
} from "@mui/material"
import {
  Visibility,
  VisibilityOff,
  LightbulbOutlined as LightbulbOutlinedIcon,
  WorkOutline as WorkOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  BusinessOutlined as BusinessOutlinedIcon,
  Quiz as QuizIcon,
  Psychology,
  EmojiEvents,
  AutoAwesome,
  Refresh,
} from "@mui/icons-material"
import api from "../serverApi"
import { config } from "../config"

// Define interfaces for the API response schemas
interface QuizGenerationResponse {
  _id: string
  title: string
  tags: string[]
  content: string
  job_role: string
  company_name_en: string
  company_name_he: string
  process_details: string
  question_list: string[]
  answer_list: string[]
  keywords: string[]
  interviewer_mindset: string
  specialty_tags: string[]
}

interface UserAnsweredQuiz {
  _id: string
  title: string
  tags: string[]
  content: string
  job_role: string
  company_name_en: string
  company_name_he: string
  process_details: string
  question_list: string[]
  answer_list: string[]
  user_answer_list: string[]
  keywords: string[]
  interviewer_mindset: string
  specialty_tags: string[]
}

interface GradedAnswer {
  question: string
  user_answer: string
  grade: number
  tip: string
}

interface QuizGradingResponse {
  graded_answers: GradedAnswer[]
  final_quiz_grade: number
  final_summary_tip: string
}

// Internal state structure for the quiz, combining generated and graded data
interface QuizStateQuestion {
  originalQuestion: string
  userAnswer: string
  correctAnswer?: string
  grade?: number
  tip?: string
}

interface QuizState {
  _id: string
  subject: string
  questions: QuizStateQuestion[]
  finalGrade?: number
  finalTip?: string
  // --- Additional fields from QuizGenerationResponse for display ---
  title?: string
  tags?: string[]
  content?: string
  jobRole?: string
  companyNameEn?: string
  processDetails?: string
  keywords?: string[]
  interviewerMindset?: string
  answer_list?: string[]
  specialty_tags?: string[]
}

const Quiz: React.FC = () => {
  const theme = useTheme()
  const [searchParams] = useSearchParams()
  const [subject, setSubject] = useState<string>(searchParams.get("subject") || "")
  const [selectedSpecialties, setSelectedSpecialties] = useState<{
    code: boolean
    design: boolean
    technologies: boolean
  }>({
    code: false,
    design: false,
    technologies: false,
  })
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showAnswer, setShowAnswer] = useState<{ [key: number]: boolean }>({})
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false)

  const handleGenerateQuiz = async () => {
    if (!subject.trim()) return
    setLoading(true)
    setQuiz(null)
    setQuizSubmitted(false)
    setShowAnswer({})

    // Build the full subject with specialties
    let fullSubject = subject
    if (selectedSpecialties.code) fullSubject += " SPECIALTY_CODE"
    if (selectedSpecialties.design) fullSubject += " SPECIALTY_DESIGN"
    if (selectedSpecialties.technologies) fullSubject += " SPECIALTY_TECHNOLOGIES"

    try {
      const response = await api.post<QuizGenerationResponse>(`${config.app.backend_url()}/quiz/generate`, {
        subject: fullSubject,
      })

      // Validate the response data
      if (!response.data || !response.data.question_list || !response.data.answer_list) {
        throw new Error("Invalid quiz data received from server")
      }

      const generatedQuestions: QuizStateQuestion[] = response.data.question_list.map((q: string, idx: number) => ({
        originalQuestion: q,
        userAnswer: "",
        correctAnswer: response.data.answer_list[idx],
      }))

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
      })
    } catch (error: any) {
      console.error("Error generating quiz:", error)
      let errorMessage = "Failed to generate quiz. "

      if (error.response?.data?.message) {
        errorMessage += error.response.data.message
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += "Please try again."
      }

      alert(errorMessage)
      setLoading(false)
      return
    } finally {
      setLoading(false)
    }
  }

  const handleUserAnswerChange = (index: number, answer: string) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions]
      updatedQuestions[index].userAnswer = answer
      setQuiz({ ...quiz, questions: updatedQuestions })
    }
  }

  const handleToggleAnswerVisibility = (index: number) => {
    setShowAnswer((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleSubmitQuiz = async () => {
    if (!quiz || quizSubmitted) return
    setLoading(true)

    const answeredQuizData: UserAnsweredQuiz = {
      _id: quiz._id,
      title: quiz.title || "",
      tags: quiz.tags || [],
      content: quiz.content || "",
      job_role: quiz.jobRole || "",
      company_name_en: quiz.companyNameEn || "",
      company_name_he: "",
      process_details: quiz.processDetails || "",
      question_list: quiz.questions.map((q) => q.originalQuestion),
      answer_list: quiz.answer_list || [],
      user_answer_list: quiz.questions.map((q) => q.userAnswer),
      keywords: quiz.keywords || [],
      interviewer_mindset: quiz.interviewerMindset || "",
      specialty_tags: quiz.specialty_tags || [],
    }

    try {
      const response = await api.post<QuizGradingResponse>(`${config.app.backend_url()}/quiz/grade`, answeredQuizData)

      const gradedQuizData = response.data
      const updatedQuestions = quiz.questions.map((q, _) => {
        const gradedAnswer = gradedQuizData.graded_answers.find((ga) => ga.question === q.originalQuestion)
        return {
          ...q,
          grade: gradedAnswer?.grade,
          tip: gradedAnswer?.tip,
        }
      })

      setQuiz({
        ...quiz,
        questions: updatedQuestions,
        finalGrade: gradedQuizData.final_quiz_grade,
        finalTip: gradedQuizData.final_summary_tip,
      })
      setQuizSubmitted(true)

      // After submission, automatically show all correct answers and grades
      const initialShowAnswer: { [key: number]: boolean } = {}
      updatedQuestions.forEach((_, index) => {
        initialShowAnswer[index] = true
      })
      setShowAnswer(initialShowAnswer)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      alert("Failed to submit quiz for grading. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubject = (newSubject: string) => {
    setSubject(newSubject)
    setQuiz(null)
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return theme.palette.success.main
    if (grade >= 70) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const getGradeEmoji = (grade: number) => {
    if (grade >= 90) return "🏆"
    if (grade >= 80) return "🎉"
    if (grade >= 70) return "👍"
    if (grade >= 60) return "📚"
    return "💪"
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg,rgb(127, 127, 147) 0%,rgb(30, 67, 62) 50%,rgb(50, 164, 190) 100%)"
            : "linear-gradient(135deg,rgb(241, 242, 248) 0%,rgb(244, 242, 245) 50%,rgb(242, 251, 253) 100%)",
        position: "relative",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4, position: "relative", zIndex: 1 }}>
        <Fade in timeout={800}>
          <Box>
            {/* Header Section */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: 4,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: "blur(20px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                textAlign: "center",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 2 }}>
                <Psychology sx={{ fontSize: 48, color: theme.palette.primary.main, mr: 2 }} />
                <Typography
                  variant="h4"
                  component="h1"
                >
                  Quiz Generator
                </Typography>
                <AutoAwesome sx={{ fontSize: 48, color: theme.palette.secondary.main, ml: 2 }} />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
                Generate personalized quizzes with AI-powered grading and detailed feedback
              </Typography>
            </Paper>
          </Box>
        </Fade>

        {/* Subject Input Section */}
        {!quiz && (
          <Zoom in timeout={600}>
            <Card
              sx={{
                mb: 4,
                borderRadius: 3,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: "blur(20px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <QuizIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Create Your Quiz
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Quiz Subject"
                  placeholder="e.g., Java Spring Boot Microservices, React Hooks, Machine Learning"
                  variant="outlined"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateQuiz()}
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      fontSize: "1.1rem",
                    },
                  }}
                />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                    Specialization Focus (Optional):
                  </Typography>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSpecialties.code}
                          onChange={(e) => setSelectedSpecialties((prev) => ({ ...prev, code: e.target.checked }))}
                          sx={{ "& .MuiSvgIcon-root": { fontSize: 24 } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>💻 Code</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSpecialties.design}
                          onChange={(e) => setSelectedSpecialties((prev) => ({ ...prev, design: e.target.checked }))}
                          sx={{ "& .MuiSvgIcon-root": { fontSize: 24 } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>🎨 Design</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSpecialties.technologies}
                          onChange={(e) =>
                            setSelectedSpecialties((prev) => ({ ...prev, technologies: e.target.checked }))
                          }
                          sx={{ "& .MuiSvgIcon-root": { fontSize: 24 } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>⚡ Technologies</Typography>}
                    />
                  </FormGroup>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleGenerateQuiz}
                  disabled={loading || !subject.trim()}
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    "&:hover": {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CircularProgress size={24} sx={{ mr: 2, color: "white" }} />
                      Generating Quiz...
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <AutoAwesome sx={{ mr: 1 }} />
                      Generate Quiz
                    </Box>
                  )}
                </Button>
              </CardContent>
            </Card>
          </Zoom>
        )}

        {/* Generated Quiz Display */}
        {quiz && (
          <Fade in timeout={800}>
            <Card
              sx={{
                borderRadius: 3,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: "blur(20px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* Quiz Header */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                    Quiz: {subject}
                  </Typography>
                  <TextField
                    value={subject}
                    onChange={(e) => handleEditSubject(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                {/* Quiz Metadata */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.default, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Grid container spacing={3}>
                    {quiz.title && (
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          <InfoOutlinedIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {quiz.title}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {(quiz.jobRole || quiz.companyNameEn) && (
                      <Grid item xs={12}>
                        <Grid container spacing={2}>
                          {quiz.jobRole && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <WorkOutlineIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
                                <Typography variant="body1">
                                  <strong>Role:</strong> {quiz.jobRole}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {quiz.companyNameEn && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <BusinessOutlinedIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                                <Typography variant="body1">
                                  <strong>Company:</strong> {quiz.companyNameEn}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    )}

                    {quiz.tags && quiz.tags.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                          📌 Tags:
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" spacing={1}>
                          {quiz.tags.map((tag, i) => (
                            <Chip
                              key={i}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                "&:hover": {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      </Grid>
                    )}

                    {quiz.specialty_tags && quiz.specialty_tags.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                          ⚡ Specialties:
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" spacing={1}>
                          {quiz.specialty_tags.map((specialty, i) => (
                            <Chip
                              key={i}
                              label={specialty.replace("SPECIALTY_", "")}
                              size="small"
                              variant="filled"
                              sx={{
                                backgroundColor: theme.palette.warning.main,
                                color: theme.palette.warning.contrastText,
                                fontWeight: 600,
                              }}
                            />
                          ))}
                        </Stack>
                      </Grid>
                    )}
                  </Grid>
                </Paper>

                <Divider sx={{ my: 4 }} />

                {/* Instructions */}
                <Paper
                  sx={{
                    p: 2,
                    mb: 4,
                    borderRadius: 2,
                    background: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "center" }}>
                    💡 Tip: Provide detailed, comprehensive answers for better grades. You can answer in any language!
                  </Typography>
                </Paper>

                {/* Questions */}
                {quiz.questions.map((q, index) => (
                  <Zoom in timeout={400 + index * 100} key={index}>
                    <Paper
                      sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                        background: alpha(theme.palette.background.paper, 0.8),
                        "&:hover": {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", flexGrow: 1 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 40,
                              height: 40,
                              fontSize: "1rem",
                              fontWeight: "bold",
                              mr: 2,
                              boxShadow: 3,
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, lineHeight: 1.4 }}>
                            {q.originalQuestion}
                          </Typography>
                        </Box>

                        {q.correctAnswer && (
                          <Tooltip title={showAnswer[index] ? "Hide Answer" : "Show Answer"} arrow>
                            <IconButton
                              onClick={() => handleToggleAnswerVisibility(index)}
                              size="small"
                              sx={{
                                ml: 2,
                                color: theme.palette.primary.main,
                                "&:hover": {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                },
                              }}
                            >
                              {showAnswer[index] ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Your Answer"
                        value={q.userAnswer}
                        onChange={(e) => handleUserAnswerChange(index, e.target.value)}
                        disabled={quizSubmitted}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />

                      {/* Grade Display */}
                      {quizSubmitted && q.grade !== undefined && (
                        <Box sx={{ mt: 3 }}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 2 }}>
                              Your Grade: {getGradeEmoji(q.grade)}
                            </Typography>
                            <Chip
                              label={`${q.grade}%`}
                              sx={{
                                backgroundColor: getGradeColor(q.grade),
                                color: "white",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={q.grade || 0}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(theme.palette.grey[300], 0.3),
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: getGradeColor(q.grade || 0),
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      )}

                      {/* Tip Display */}
                      {quizSubmitted && q.tip && (
                        <Paper
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            background: alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                            <LightbulbOutlinedIcon sx={{ color: theme.palette.info.main, mr: 1, mt: 0.5 }} />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                💡 Improvement Tip:
                              </Typography>
                              <Typography variant="body2">{q.tip}</Typography>
                            </Box>
                          </Box>
                        </Paper>
                      )}

                      {/* Correct Answer Display */}
                      {showAnswer[index] && q.correctAnswer && (
                        <Paper
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            background: alpha(theme.palette.success.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 1, color: theme.palette.success.main }}
                          >
                            ✅ Correct Answer:
                          </Typography>
                          <Typography variant="body2">{q.correctAnswer}</Typography>
                        </Paper>
                      )}
                    </Paper>
                  </Zoom>
                ))}

                {/* Submit Button */}
                {!quizSubmitted && (
                  <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmitQuiz}
                      disabled={loading || !quiz.questions.some((q) => q.userAnswer.trim() !== "")}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                        "&:hover": {
                          background: `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                        },
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <CircularProgress size={24} sx={{ mr: 2, color: "white" }} />
                          Calculating Grade...
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <EmojiEvents sx={{ mr: 1 }} />
                          Calculate My Grade
                        </Box>
                      )}
                    </Button>
                  </Box>
                )}

                {/* Final Grade Display */}
                {quizSubmitted && quiz.finalGrade !== undefined && (
                  <Zoom in timeout={800}>
                    <Paper
                      sx={{
                        mt: 4,
                        p: 4,
                        borderRadius: 3,
                        textAlign: "center",
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                        border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                          🎉 Final Grade: {quiz.finalGrade}% {getGradeEmoji(quiz.finalGrade)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={quiz.finalGrade}
                          sx={{
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: alpha(theme.palette.grey[300], 0.3),
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: getGradeColor(quiz.finalGrade),
                              borderRadius: 6,
                            },
                          }}
                        />
                      </Box>

                      {quiz.finalTip && (
                        <Paper
                          sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 2,
                            background: alpha(theme.palette.background.paper, 0.8),
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            🎯 Overall Feedback:
                          </Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {quiz.finalTip}
                          </Typography>
                        </Paper>
                      )}

                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => {
                          setSubject("")
                          setQuiz(null)
                          setQuizSubmitted(false)
                          setSelectedSpecialties({ code: false, design: false, technologies: false })
                        }}
                        sx={{
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          fontSize: "1rem",
                          fontWeight: 600,
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            borderColor: theme.palette.primary.dark,
                          },
                        }}
                      >
                        <Refresh sx={{ mr: 1 }} />
                        Generate New Quiz
                      </Button>
                    </Paper>
                  </Zoom>
                )}
              </CardContent>
            </Card>
          </Fade>
        )}
      </Container>
    </Box>
  )
}

export default Quiz
