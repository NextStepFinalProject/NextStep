import type React from "react"
import { useState } from "react"
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  useTheme,
  Grid,
  Chip,
  DialogActions,
  Stack,
  Avatar,
  alpha,
  Divider,
} from "@mui/material"
import {
  ExpandMore,
  ExpandLess,
  LinkedIn,
  Fullscreen,
  Close,
  Work,
  LocationOn,
  Business,
  Add as AddIcon,
} from "@mui/icons-material"

interface Job {
  position: string
  company: string
  location: string
  jobUrl?: string
  companyLogo?: string
  date?: string
  salary?: string
}

interface LinkedinJobsProps {
  jobs: Job[]
  loadingJobs: boolean
  fetchJobs: (settings: LinkedInSettings) => Promise<void>
  showJobRecommendations: boolean
  toggleJobRecommendations: () => void
  skills: string[]
  selectedRole: string
}

interface LinkedInSettings {
  location: string
  dateSincePosted: string
  jobType: string
  experienceLevel: string
  skills: string[]
}

const LinkedinJobs: React.FC<LinkedinJobsProps> = ({
  jobs,
  loadingJobs,
  fetchJobs,
  showJobRecommendations,
  toggleJobRecommendations,
  skills,
  selectedRole,
}) => {
  const [settings, setSettings] = useState<LinkedInSettings>({
    location: "Israel",
    dateSincePosted: "past month",
    jobType: "full time",
    experienceLevel: "all",
    skills: skills.slice(0, 3), // Limit to first 3 skills
  })
  const theme = useTheme()

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobDetails, setJobDetails] = useState<any>(null)
  const [fullScreen, setFullScreen] = useState(false)
  const [fullScreenSettings, setFullScreenSettings] = useState<LinkedInSettings>({ ...settings })
  const [newSkill, setNewSkill] = useState("")

  const handleSettingChange = (key: keyof LinkedInSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleFullScreenSettingChange = (key: keyof LinkedInSettings, value: string) => {
    setFullScreenSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleFetchJobs = () => {
    fetchJobs(settings)
  }

  const handleFullScreenFetchJobs = () => {
    fetchJobs(fullScreenSettings)
  }

  const handleViewJob = (job: Job) => {
    setSelectedJob(job)
    setJobDetails(job)
  }

  const handleCloseDialog = () => {
    setSelectedJob(null)
    setJobDetails(null)
  }

  const handleGenerateQuiz = (job: Job) => {
    const subject = `${job.position} at ${job.company}`
    const quizUrl = `/quiz?subject=${encodeURIComponent(subject)}`
    window.open(quizUrl, "_blank")
  }

  const handleFullScreenOpen = () => {
    setFullScreenSettings({ ...settings })
    setFullScreen(true)
  }

  const handleFullScreenClose = () => {
    setFullScreen(false)
  }

  const handleAddSkillFullScreen = (skill: string) => {
    const trimmed = skill.trim()
    if (!trimmed || fullScreenSettings.skills.includes(trimmed) || fullScreenSettings.skills.length >= 3) return
    setFullScreenSettings((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }))
    setNewSkill("")
  }

  const handleDeleteSkillFullScreen = (skillToDelete: string) => {
    setFullScreenSettings((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToDelete),
    }))
  }

  return (
    <>
      <Card
        sx={{
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
          position: "relative",
          backdropFilter: "blur(20px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.15)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Avatar
                sx={{
                  bgcolor: alpha("#0077b5", 0.1),
                  color: "#0077b5",
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <LinkedIn />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Job Recommendations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Find your next opportunity
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, position: "absolute", top: 8, right: 8 }}>
              <IconButton
                onClick={handleFullScreenOpen}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                }}
                aria-label="open advanced search"
              >
                <Fullscreen />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Button
              onClick={toggleJobRecommendations}
              variant="outlined"
              size="small"
              startIcon={showJobRecommendations ? <ExpandLess /> : <ExpandMore />}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
                mb: 2,
                background: showJobRecommendations
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`
                  : "transparent",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                color: theme.palette.primary.main,
                "&:hover": {
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.secondary.main, 0.15)})`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                transition: "all 0.3s ease",
              }}
            >
              {showJobRecommendations ? "Hide Search Settings" : "Show Search Settings"}
            </Button>
          </Box>
          {showJobRecommendations && (
            <>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Selected Role:</strong>{" "}
                      {selectedRole ? (
                        <Chip
                          label={selectedRole}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Chip label="Choose a role" size="small" color="error" variant="outlined" />
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Location"
                      value={settings.location}
                      onChange={(e) => handleSettingChange("location", e.target.value)}
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Date Since Posted</InputLabel>
                      <Select
                        value={settings.dateSincePosted}
                        onChange={(e) => handleSettingChange("dateSincePosted", e.target.value)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        }}
                      >
                        <MenuItem value="past day">Past Day</MenuItem>
                        <MenuItem value="past week">Past Week</MenuItem>
                        <MenuItem value="past month">Past Month</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Job Type</InputLabel>
                      <Select
                        value={settings.jobType}
                        onChange={(e) => handleSettingChange("jobType", e.target.value)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        }}
                      >
                        <MenuItem value="full time">Full Time</MenuItem>
                        <MenuItem value="part time">Part Time</MenuItem>
                        <MenuItem value="contract">Contract</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Experience Level</InputLabel>
                      <Select
                        value={settings.experienceLevel}
                        onChange={(e) => handleSettingChange("experienceLevel", e.target.value)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="entry level">Entry Level</MenuItem>
                        <MenuItem value="mid level">Mid Level</MenuItem>
                        <MenuItem value="senior level">Senior Level</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  Skills Filter:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2, gap: 1 }}>
                  {settings.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      onDelete={() => {
                        const updatedSkills = [...settings.skills]
                        updatedSkills.splice(index, 1)
                        setSettings((prev) => ({ ...prev, skills: updatedSkills }))
                      }}
                      sx={{
                        backgroundColor: alpha("#0077b5", 0.1),
                        color: "#0077b5",
                        "&:hover": {
                          backgroundColor: alpha("#0077b5", 0.2),
                        },
                      }}
                    />
                  ))}
                </Stack>
                {settings.skills.length < 3 && (
                  <TextField
                    variant="outlined"
                    fullWidth
                    onKeyDown={(e) => {
                      const input = e.target as HTMLInputElement
                      if (e.key === "Enter" && input.value.trim()) {
                        const newSkill = input.value.trim()
                        if (!settings.skills.includes(newSkill) && settings.skills.length < 3) {
                          setSettings((prev) => ({
                            ...prev,
                            skills: [...prev.skills, newSkill],
                          }))
                        }
                        input.value = ""
                      }
                    }}
                    error={settings.skills.length === 0}
                    placeholder="Type a skill and press Enter"
                    sx={{
                      mt: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                      },
                    }}
                  />
                )}
              </Grid>

              <Box sx={{ textAlign: "center", my: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleFetchJobs}
                  disabled={loadingJobs || settings.skills.length === 0 || !selectedRole}
                  sx={{
                    background: `linear-gradient(135deg, #0077b5, #005582)`,
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: `0 4px 16px ${alpha("#0077b5", 0.3)}`,
                    "&:hover": {
                      background: `linear-gradient(135deg, #005582, #003d5c)`,
                      transform: "translateY(-2px)",
                      boxShadow: `0 6px 20px ${alpha("#0077b5", 0.4)}`,
                    },
                    "&:disabled": {
                      background: alpha(theme.palette.action.disabled, 0.1),
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {loadingJobs ? <CircularProgress size={20} color="inherit" /> : "Find Jobs"}
                </Button>
              </Box>

              {jobs.length > 0 ? (
                <Grid container spacing={2}>
                  {jobs.map((job, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card
                        sx={{
                          height: "180px",
                          overflow: 'auto',
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, flexGrow: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            {job.companyLogo && (
                              <img
                                src={job.companyLogo || "/placeholder.svg"}
                                alt={`${job.company} logo`}
                                style={{ width: "24px", height: "24px", marginRight: "8px", borderRadius: "4px" }}
                              />
                            )}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {job.company}
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                            {job.position}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                            {job.location}
                          </Typography>
                        </CardContent>
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Button
                            onClick={() => handleViewJob(job)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            sx={{
                              // borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 600,
                              height: "30px",
                            }}
                          >
                            View
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Work sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {!selectedRole || skills.length === 0
                      ? "Select a role and add skills to start searching"
                      : "No job recommendations found. Try adjusting your search settings."}
                  </Typography>
                </Box>
              )}

              {/* Job Details Dialog */}
              <Dialog open={!!selectedJob} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedJob?.position}
                  </Typography>
                </DialogTitle>
                <DialogContent>
                  {jobDetails ? (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        {jobDetails.companyLogo && (
                          <img
                            src={jobDetails.companyLogo || "/placeholder.svg"}
                            alt={`${jobDetails.company} logo`}
                            style={{ width: "40px", height: "40px", marginRight: "12px", borderRadius: "6px" }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {jobDetails.company}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                            {jobDetails.location}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Typography color="error">Failed to load job details.</Typography>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                  <Button onClick={handleCloseDialog} variant="outlined">
                    Close
                  </Button>
                  {selectedJob?.jobUrl && (
                    <>
                      <Button onClick={() => handleGenerateQuiz(selectedJob)} variant="outlined" color="secondary">
                        Generate Quiz
                      </Button>
                      <Button
                        href={selectedJob.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        sx={{
                          background: `linear-gradient(135deg, #0077b5, #005582)`,
                          "&:hover": {
                            background: `linear-gradient(135deg, #005582, #003d5c)`,
                          },
                        }}
                      >
                        Open in LinkedIn
                      </Button>
                    </>
                  )}
                </DialogActions>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Dialog */}
      <Dialog
        open={fullScreen}
        onClose={handleFullScreenClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "80vh",
            background: `linear-gradient(135deg, ${theme.palette.background.default}, ${alpha(theme.palette.background.paper, 0.9)})`,
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, #0077b5, #005582)`,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LinkedIn sx={{ mr: 1.5, fontSize: 24 }} />
            <Typography variant="h6" fontWeight={700}>
              LinkedIn Job Search
            </Typography>
          </Box>
          <IconButton
            onClick={handleFullScreenClose}
            size="small"
            sx={{
              color: "white",
              "&:hover": {
                bgcolor: alpha('#00000', 0.1),
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Search Settings */}
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  height: "fit-content",
                  position: "sticky",
                  top: 0,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                    <Business sx={{ mr: 1 }} />
                    Search Settings
                  </Typography>

                  <Stack spacing={3}>
                    <TextField
                      label="Location"
                      value={fullScreenSettings.location}
                      onChange={(e) => handleFullScreenSettingChange("location", e.target.value)}
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        },
                      }}
                    />

                    <FormControl fullWidth>
                      <InputLabel>Date Since Posted</InputLabel>
                      <Select
                        value={fullScreenSettings.dateSincePosted}
                        onChange={(e) => handleFullScreenSettingChange("dateSincePosted", e.target.value)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        }}
                      >
                        <MenuItem value="past day">Past Day</MenuItem>
                        <MenuItem value="past week">Past Week</MenuItem>
                        <MenuItem value="past month">Past Month</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Job Type</InputLabel>
                      <Select
                        value={fullScreenSettings.jobType}
                        onChange={(e) => handleFullScreenSettingChange("jobType", e.target.value)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        }}
                      >
                        <MenuItem value="full time">Full Time</MenuItem>
                        <MenuItem value="part time">Part Time</MenuItem>
                        <MenuItem value="contract">Contract</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Experience Level</InputLabel>
                      <Select
                        value={fullScreenSettings.experienceLevel}
                        onChange={(e) => handleFullScreenSettingChange("experienceLevel", e.target.value)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="entry level">Entry Level</MenuItem>
                        <MenuItem value="mid level">Mid Level</MenuItem>
                        <MenuItem value="senior level">Senior Level</MenuItem>
                      </Select>
                    </FormControl>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                        Skills Filter (Max 3)
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2, gap: 1 }}>
                        {fullScreenSettings.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            onDelete={() => handleDeleteSkillFullScreen(skill)}
                            sx={{
                              backgroundColor: alpha("#0077b5", 0.1),
                              color: "#0077b5",
                              "&:hover": {
                                backgroundColor: alpha("#0077b5", 0.2),
                              },
                            }}
                          />
                        ))}
                      </Stack>
                      {fullScreenSettings.skills.length < 3 && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            size="small"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newSkill.trim()) {
                                handleAddSkillFullScreen(newSkill)
                              }
                            }}
                            placeholder="Add skill..."
                            sx={{
                              flexGrow: 1,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                              },
                            }}
                          />
                          <IconButton
                            onClick={() => handleAddSkillFullScreen(newSkill)}
                            disabled={!newSkill.trim()}
                            sx={{
                              bgcolor: alpha("#0077b5", 0.1),
                              color: "#0077b5",
                              "&:hover": {
                                bgcolor: alpha("#0077b5", 0.2),
                              },
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      onClick={handleFullScreenFetchJobs}
                      disabled={loadingJobs || fullScreenSettings.skills.length === 0 || !selectedRole}
                      fullWidth
                      sx={{
                        background: `linear-gradient(135deg, #0077b5, #005582)`,
                        borderRadius: 3,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        boxShadow: `0 4px 16px ${alpha("#0077b5", 0.3)}`,
                        "&:hover": {
                          background: `linear-gradient(135deg, #005582, #003d5c)`,
                          transform: "translateY(-2px)",
                          boxShadow: `0 6px 20px ${alpha("#0077b5", 0.4)}`,
                        },
                        "&:disabled": {
                          background: alpha(theme.palette.action.disabled, 0.1),
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {loadingJobs ? <CircularProgress size={20} color="inherit" /> : "Search Jobs"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Job Results */}
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  Job Results ({jobs.length})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRole && (
                    <>
                      Showing results for <strong>{selectedRole}</strong> in{" "}
                      <strong>{fullScreenSettings.location}</strong>
                    </>
                  )}
                </Typography>
              </Box>

              {jobs.length > 0 ? (
                <Grid container spacing={2} sx={{ height: "50vh", maxHeight: "55vh", overflow: "auto", pr: 1, pt: 2 }}>
                  {jobs.map((job, index) => (
                    <Grid item xs={12} key={index}>
                      <Card
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                          backdropFilter: "blur(20px)",
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            {job.companyLogo && (
                              <img
                                src={job.companyLogo || "/placeholder.svg"}
                                alt={`${job.company} logo`}
                                style={{ width: "32px", height: "32px", marginRight: "12px", borderRadius: "6px" }}
                              />
                            )}
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {job.company}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {job.position}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: "flex", alignItems: "center", mb: 2 }}
                          >
                            <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                            {job.location}
                          </Typography>

                          <Box sx={{ mt: "auto", display: "flex", gap: 1 }}>
                            <Button
                              onClick={() => handleViewJob(job)}
                              variant="outlined"
                              size="small"
                              sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                flex: 1,
                              }}
                            >
                              View Details
                            </Button>
                            {job.jobUrl && (
                              <Button
                                href={job.jobUrl}
                                target="_blank"
                                variant="contained"
                                size="small"
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 600,
                                  background: `linear-gradient(135deg, #0077b5, #005582)`,
                                  "&:hover": {
                                    background: `linear-gradient(135deg, #005582, #003d5c)`,
                                  },
                                }}
                              >
                                Apply
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Card
                  sx={{
                    background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    textAlign: "center",
                    py: 8,
                  }}
                >
                  <Work sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No Jobs Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {!selectedRole || fullScreenSettings.skills.length === 0
                      ? "Configure your search settings to find relevant opportunities"
                      : "Try adjusting your search criteria or expanding your location"}
                  </Typography>
                </Card>
              )}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default LinkedinJobs
