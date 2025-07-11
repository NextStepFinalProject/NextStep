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
  ForumOutlined as ForumOutlinedIcon,
  BusinessOutlined as BusinessOutlinedIcon,
  LocalOfferOutlined as LocalOfferOutlinedIcon,
  Quiz as QuizIcon,
  Psychology,
  EmojiEvents,
  AutoAwesome,
  Refresh,
} from "@mui/icons-material"
import api from "../serverApi"
import { config } from "../config"

/* ------------------------------------------------------------------ */
/* ---------------- Interfaces that drive API / state ---------------- */
/* ------------------------------------------------------------------ */

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

/* ---------------- Combined local state ---------------- */

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

/* ================================================================== */
/* =============================== UI =============================== */
/* ================================================================== */

const Quiz: React.FC = () => {
  const theme = useTheme()
  const [searchParams] = useSearchParams()

  /* ------------------------ Local state ------------------------ */
  const [subject, setSubject] = useState<string>(searchParams.get("subject") || "")
  const [selectedSpecialties, setSelectedSpecialties] = useState({
    code: false,
    design: false,
    technologies: false,
  })
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAnswer, setShowAnswer] = useState<{ [idx: number]: boolean }>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  /* --------------------- Helpers for colors / emojis --------------------- */
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

  /* ------------------------------------------------------------------ */
  /* -------------------------- Generate quiz ------------------------- */
  /* ------------------------------------------------------------------ */
  const handleGenerateQuiz = async () => {
    if (!subject.trim()) return
    setLoading(true)
    setQuiz(null)
    setQuizSubmitted(false)
    setShowAnswer({})

    let fullSubject = subject
    if (selectedSpecialties.code) fullSubject += " SPECIALTY_CODE"
    if (selectedSpecialties.design) fullSubject += " SPECIALTY_DESIGN"
    if (selectedSpecialties.technologies) fullSubject += " SPECIALTY_TECHNOLOGIES"

    try {
      const { data } = await api.post<QuizGenerationResponse>(
        `${config.app.backend_url()}/quiz/generate`,
        { subject: fullSubject }
      )

      if (!data?.question_list || !data?.answer_list)
        throw new Error("Invalid quiz data received from server")

      const generatedQuestions = data.question_list.map((q, idx) => ({
        originalQuestion: q,
        userAnswer: "",
        correctAnswer: data.answer_list[idx],
      }))

      setQuiz({
        _id: data._id,
        subject,
        questions: generatedQuestions,
        title: data.title,
        tags: data.tags,
        content: data.content,
        jobRole: data.job_role,
        companyNameEn: data.company_name_en,
        processDetails: data.process_details,
        keywords: data.keywords,
        interviewerMindset: data.interviewer_mindset,
        answer_list: data.answer_list,
        specialty_tags: data.specialty_tags,
      })
    } catch (err: any) {
      console.error("Error generating quiz:", err)
      let msg = "Failed to generate quiz. "
      msg += err.response?.data?.message || err.message || "Please try again."
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  /* -------------------------- Answer editing ------------------------- */
  const handleUserAnswerChange = (idx: number, val: string) => {
    if (!quiz) return
    const updated = [...quiz.questions]
    updated[idx].userAnswer = val
    setQuiz({ ...quiz, questions: updated })
  }

  const handleToggleAnswerVisibility = (idx: number) =>
    setShowAnswer((prev) => ({ ...prev, [idx]: !prev[idx] }))

  /* ------------------------------------------------------------------ */
  /* ---------------------------- Submit ----------------------------- */
  /* ------------------------------------------------------------------ */
  const handleSubmitQuiz = async () => {
    if (!quiz || quizSubmitted) return
    setLoading(true)

    const payload: UserAnsweredQuiz = {
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
      const { data } = await api.post<QuizGradingResponse>(
        `${config.app.backend_url()}/quiz/grade`,
        payload
      )

      const updatedQuestions = quiz.questions.map((q) => {
        const graded = data.graded_answers.find((ga) => ga.question === q.originalQuestion)
        return { ...q, grade: graded?.grade, tip: graded?.tip }
      })

      setQuiz({
        ...quiz,
        questions: updatedQuestions,
        finalGrade: data.final_quiz_grade,
        finalTip: data.final_summary_tip,
      })
      setQuizSubmitted(true)
      const autoShow: { [idx: number]: boolean } = {}
      updatedQuestions.forEach((_, i) => (autoShow[i] = true))
      setShowAnswer(autoShow)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      alert("Failed to submit quiz for grading. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  /* -------------------------- Misc helpers -------------------------- */
  const handleEditSubject = (txt: string) => {
    setSubject(txt)
    setQuiz(null)
  }

  /* ================================================================== */
  /* ============================ RENDER ============================== */
  /* ================================================================== */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg,rgb(127, 127, 147) 0%,rgb(30, 67, 62) 50%,rgb(50, 164, 190) 100%)"
            : "linear-gradient(135deg,rgb(241, 242, 248) 0%,rgb(244, 242, 245) 50%,rgb(242, 251, 253) 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* --------------------------- Header --------------------------- */}
        <Fade in timeout={800}>
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
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Psychology sx={{ fontSize: 48, color: theme.palette.primary.main, mr: 2 }} />
              <Typography variant="h4" component="h1">
                Quiz Generator
              </Typography>
              <AutoAwesome sx={{ fontSize: 48, color: theme.palette.secondary.main, ml: 2 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
              Generate personalized quizzes with AI-powered grading and detailed feedback
            </Typography>
          </Paper>
        </Fade>

        {/* --------------------- Subject input (no quiz) -------------------- */}
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

                {/* ------------------ Subject field ------------------ */}
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
                    "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "1.1rem" },
                  }}
                />

                {/* -------------- Specialization checkboxes -------------- */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Specialization Focus (Optional):
                  </Typography>
                  <FormGroup row>
                    {([
                      ["code", "💻 Code"],
                      ["design", "🎨 Design"],
                      ["technologies", "⚡ Technologies"],
                    ] as const).map(([key, label]) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Checkbox
                            checked={(selectedSpecialties as any)[key]}
                            onChange={(e) =>
                              setSelectedSpecialties((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                            sx={{ "& .MuiSvgIcon-root": { fontSize: 24 } }}
                          />
                        }
                        label={<Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>{label}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </Box>

                {/* ------------------- Generate button ------------------- */}
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

        {/* ----------------------- Quiz display ----------------------- */}
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
                {/* --------------- Editable title ---------------- */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                    Quiz: {subject}
                  </Typography>
                  <TextField
                    value={subject}
                    onChange={(e) => handleEditSubject(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Box>

                {/* ----------------- Metadata block ---------------- */}
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
                    {/* ----- title ----- */}
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

                    {/* ----- role / company ----- */}
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

                    {/* ----- tags ----- */}
                    {quiz.tags?.length && (
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
                                "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                              }}
                            />
                          ))}
                        </Stack>
                      </Grid>
                    )}
                  
                    {/* ----- specialties ----- */}
                    {1 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                          ⚡ Specialties:
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" spacing={1}>
                          {quiz.specialty_tags?.map((s, i) => (
                            <Chip
                              key={i}
                              label={s.replace("SPECIALTY_", "")}
                              size="small"
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

                    {/* ----- keywords ----- */}
                    {quiz.keywords?.length && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                          <LocalOfferOutlinedIcon sx={{ verticalAlign: "middle", mr: 0.5 }} />
                          Keywords:
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" spacing={1}>
                          {quiz.keywords.map((kw, i) => (
                            <Chip
                              key={i}
                              label={kw}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          ))}
                        </Stack>
                      </Grid>
                    )}

                    {/* ----- process details ----- */}
                    {quiz.processDetails && (
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                          <InfoOutlinedIcon sx={{ color: theme.palette.info.main, mr: 1, mt: 0.2 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Process Details:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {quiz.processDetails}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}

                    {/* ----- content / context ----- */}
                    {quiz.content && (
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                          <InfoOutlinedIcon sx={{ color: theme.palette.info.main, mr: 1, mt: 0.2 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Context / Content:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {quiz.content}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}

                    {/* ----- interviewer mindset ----- */}
                    {quiz.interviewerMindset && (
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                          <ForumOutlinedIcon sx={{ color: theme.palette.secondary.main, mr: 1, mt: 0.2 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Interviewer Mindset:
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                              "{quiz.interviewerMindset}"
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>

                <Divider sx={{ my: 4 }} />

                {/* ---------------------- Instructions --------------------- */}
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

                {/* ------------------ Question list ------------------ */}
                {quiz.questions.map((q, idx) => (
                  <Zoom key={idx} in timeout={400 + idx * 100}>
                    <Paper
                      sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                        background: alpha(theme.palette.background.paper, 0.8),
                        "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.3) },
                      }}
                    >
                      {/* ----------- Question header with eye icon ---------- */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
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
                            {idx + 1}
                          </Avatar>
                          <Typography variant="h6" sx={{ lineHeight: 1.4, fontWeight: 600 }}>
                            {q.originalQuestion}
                          </Typography>
                        </Box>
                        {q.correctAnswer && (
                          <Tooltip title={showAnswer[idx] ? "Hide Answer" : "Show Answer"} arrow>
                            <IconButton
                              onClick={() => handleToggleAnswerVisibility(idx)}
                              size="small"
                              sx={{
                                ml: 2,
                                color: theme.palette.primary.main,
                                "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                              }}
                            >
                              {showAnswer[idx] ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {/* ---------------- Answer textarea ---------------- */}
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Your Answer"
                        value={q.userAnswer}
                        onChange={(e) => handleUserAnswerChange(idx, e.target.value)}
                        disabled={quizSubmitted}
                        sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />

                      {/* ---------------- Grade bar ---------------- */}
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
                            value={q.grade}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(theme.palette.grey[300], 0.3),
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: getGradeColor(q.grade),
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      )}

                      {/* ---------------- Improvement tip ---------------- */}
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

                      {/* ---------------- Correct answer ---------------- */}
                      {showAnswer[idx] && q.correctAnswer && (
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

                {/* ---------------- Submit button ---------------- */}
                {!quizSubmitted && (
                  <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmitQuiz}
                      disabled={loading || !quiz.questions.some((q) => q.userAnswer.trim())}
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

                {/* ---------------- Final grade ---------------- */}
                {quizSubmitted && quiz.finalGrade !== undefined && (
                  <Zoom in timeout={800}>
                    <Paper
                      sx={{
                        mt: 4,
                        p: 4,
                        borderRadius: 3,
                        textAlign: "center",
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.success.main,
                          0.1
                        )}, ${alpha(theme.palette.primary.main, 0.1)})`,
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
