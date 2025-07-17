import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  TextField,
  Alert,
  Card,
  CardContent,
  Divider,
  Snackbar,
  useTheme,
  alpha,
  Stack,
  Tooltip,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { config } from "../config"
import api from "../serverApi"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ScoreGauge from "../components/ScoreGauge"
import { CloudUpload, CheckCircle, Description, Analytics, WorkOutline } from "@mui/icons-material"
import "./Resume.css"

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.background.default, 0.8),
    transform: "translateY(-2px)",
  },
}))

const FeedbackContainer = styled(Box)(({ theme }) => ({
  maxHeight: "60vh",
  overflowY: "auto",
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  textAlign: "left",
  color: theme.palette.text.primary,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
  "& pre": {
    backgroundColor: theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100],
    color: theme.palette.text.primary,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    overflowX: "auto",
    margin: theme.spacing(2, 0),
  },
  "& table": {
    borderCollapse: "collapse",
    width: "100%",
    marginBottom: theme.spacing(2),
  },
  "& th, & td": {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5),
    textAlign: "left",
    color: theme.palette.text.primary,
  },
  "& th": {
    backgroundColor: theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100],
    color: theme.palette.text.primary,
  },
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    textAlign: "left",
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  "& p": {
    textAlign: "left",
    marginBottom: theme.spacing(2),
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  "& ul, & ol": {
    marginLeft: theme.spacing(4),
    marginBottom: theme.spacing(2),
  },
  "& li": {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  "& blockquote": {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    margin: theme.spacing(2, 0),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
  },
  "& code": {
    backgroundColor: theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100],
    color: theme.palette.text.primary,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: "0.875em",
  },
  "& strong, & b": {
    color: theme.palette.text.primary,
  },
  "& em, & i": {
    color: theme.palette.text.primary,
  },
}))

const Resume: React.FC = () => {
  const theme = useTheme()
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [feedback, setFeedback] = useState("")
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedbackEndRef = useRef<HTMLDivElement>(null)
  const [fileName, setFileName] = useState<string>("")
  const [resumeId, setResumeId] = useState<string>("")
  const [updatingResume, setUpdatingResume] = useState(false)

  useEffect(() => {
    if (feedbackEndRef.current) {
      feedbackEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [feedback])

  // Fetch resume data on mount
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const response = await api.get("/resume")
        if (response.data && response.data.parsedData) {
          const parsedData = response.data.parsedData
          setJobDescription(parsedData.jobDescription || parsedData.aboutMe || "")
          setFileName(parsedData.fileName || "")
          parsedData.feedback && setFeedback(parsedData.feedback)
          parsedData.score && setScore(parsedData.score)

          // Store the resume ID for later use
          if (response.data.rawContentLink) {
            const id = response.data.rawContentLink.split("/").pop() || ""
            setResumeId(id)
          }
        }
      } catch (err) {
        console.error("Failed to fetch resume data:", err)
      }
    }
    fetchResumeData()
  }, [])

  const uploadResume = async (formData: FormData) => {
    const response = await api.post("/resource/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setFileName(event.target.files[0].name)
      setError("")
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async () => {
    if (!file) {
      // Check if we can use existing resume data
      try {
        const resume = await api.get("/resume")
        if (!resume.data || !resume.data.rawContentLink) {
          setError("Please select a file")
          return
        }
      } catch (err) {
        setError("Please select a file")
        return
      }
    }

    setLoading(true)
    setFeedback("")
    setScore(null)
    setError("")

    try {
      let filename = ""
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        filename = await uploadResume(formData)
        setResumeId(filename)
      } else {
        const resume = await api.get("/resume")
        filename = resume.data.rawContentLink.split("/").pop() || ""
        setResumeId(filename)
      }

      const token = localStorage.getItem(config.localStorageKeys.userAuth)
        ? JSON.parse(localStorage.getItem(config.localStorageKeys.userAuth)!).accessToken
        : ""

      const eventSource = new EventSource(
        `${config.app.backend_url()}/resume/streamScore/${filename}?jobDescription=${encodeURIComponent(jobDescription)}&accessToken=${encodeURIComponent(token)}`,
      )

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.done) {
            setScore(data.score)
            eventSource.close()
            setLoading(false)
            data.fullText && setFeedback(data.fullText)
          } else if (data.chunk) {
            setFeedback((prev) => prev + data.chunk)
          }
        } catch (e) {
          console.error("Error parsing event data:", e)
        }
      }

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error)
        setError("Failed to analyze resume")
        eventSource.close()
        setLoading(false)
      }
    } catch (err: any) {
      if (
        err.response &&
        err.response.status === 400 &&
        err.response.data &&
        err.response.data &&
        err.response.data.message
      ) {
        setError(err.response.data.message)
      } else {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
      setLoading(false)
    }
  }

  const handleUseResumeFile = async () => {
    if (!file && !resumeId) {
      setError("No resume file available to use")
      return
    }

    setUpdatingResume(true)
    setError("")

    try {
      let filename = resumeId

      // If there's a new file, upload it first
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        filename = await uploadResume(formData)
        setResumeId(filename)
      }

      // Update the resume in the system
      await api.post("/resume/parseResume", {
        resumefileName: filename,
        originfilename: fileName,
      })

      setSuccess("Resume updated successfully!")
      setTimeout(() => setSuccess(""), 1000)
    } catch (err) {
      console.error("Failed to update resume:", err)
      setError("Failed to update resume. Please try again.")
    } finally {
      setUpdatingResume(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: "1000px", mx: "auto" }}>
      <Card
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Description
            sx={{
              fontSize: 36,
              color: theme.palette.primary.main,
              mr: 2,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Resume Analyzer
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" sx={{ mb: 3 }}>
          Upload your resume and a job description to get personalized feedback and a match score.
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            <WorkOutline sx={{ mr: 1, verticalAlign: "middle" }} />
            Job Description
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Paste the job description here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              },
            }}
          />

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            <CloudUpload sx={{ mr: 1, verticalAlign: "middle" }} />
            Resume
          </Typography>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
          />

          <UploadBox onClick={handleUploadClick}>
            {fileName ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography>{fileName}</Typography>
              </Box>
            ) : (
              <Box>
                <CloudUpload sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.7), mb: 1 }} />
                <Typography>Click to upload your resume</Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: PDF, DOC, DOCX
                </Typography>
              </Box>
            )}
          </UploadBox>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || (!file && !resumeId)}
            startIcon={<Analytics />}
            sx={{
              py: 1.2,
              fontWeight: 600,
              flex: 1,
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Analyze Resume"}
          </Button>

          <Tooltip title="Update your profile with this resume">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleUseResumeFile}
              disabled={updatingResume || (!file && !resumeId)}
              startIcon={updatingResume ? <CircularProgress size={20} /> : <CheckCircle />}
              sx={{
                py: 1.2,
                fontWeight: 600,
                flex: 1,
              }}
            >
              Use This Resume File
            </Button>
          </Tooltip>
        </Stack>
      </Card>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {feedback && (
        <Card
          elevation={2}
          sx={{
            mb: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Analysis Feedback
            </Typography>

            <FeedbackContainer>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
              <div ref={feedbackEndRef} />
            </FeedbackContainer>
          </CardContent>
        </Card>
      )}

      {score !== null && (
        <Card
          elevation={2}
          sx={{
            mb: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            textAlign: "center",
            p: 3,
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Resume Match Score
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "200px",
              width: "100%",
            }}
          >
            <ScoreGauge score={score} />
          </Box>

          <Typography variant="body1" sx={{ mt: 2 }}>
            {score >= 80
              ? "Excellent match! Your resume is well-aligned with this job description."
              : score >= 60
                ? "Good match. Consider the feedback above to improve your resume further."
                : "Your resume needs some improvements to better match this job description."}
          </Typography>
        </Card>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}
        message={success}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  )
}

export default Resume
