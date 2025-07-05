import type React from "react"
import { useState, useEffect } from "react"
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Avatar,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material"
import {
  GitHub,
  LinkedIn,
  Person as PersonIcon,
  Work as WorkIcon,
  Build as BuildIcon,
  LightbulbSharp,
  Grading,
  Add as AddIcon,
  TrendingUp,
  Star,
  Code,
  Business,
  CheckCircle,
  InsertDriveFile,
  Delete,
} from "@mui/icons-material"
import { connectToGitHub, initiateGitHubOAuth, fetchRepoLanguages, handleGitHubOAuth } from "../handlers/githubAuth"
import api from "../serverApi"
import LinkedinJobs from "../components/LinkedinJobs"
import { motion } from "framer-motion"
import { getUserAuth } from "../handlers/userAuth"

const roles = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Product Manager",
  "UI/UX Designer",
]

const skillsList = [
  "React",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Node.js",
  "Express",
  "MongoDB",
  "AWS",
  "Docker",
  "Kubernetes",
  "Git",
  "Agile",
]

const MainDashboard: React.FC = () => {
  const theme = useTheme();
  const [aboutMe, setAboutMe] = useState(() => localStorage.getItem("aboutMe") || "")
  const [skills, setSkills] = useState<string[]>(() => JSON.parse(localStorage.getItem("skills") || "[]"))
  const [newSkill, setNewSkill] = useState("")
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem("selectedRole") || "")
  const [repos, setRepos] = useState<{ id: number; name: string; html_url: string }[]>([])
  const [useOAuth, setUseOAuth] = useState(true)
  const [showAuthOptions, setShowAuthOptions] = useState(false)

  // AI-resume state
  const [parsing, setParsing] = useState(false)
  const [resumeExperience, setResumeExperience] = useState<string[]>([])
  const [roleMatch, setRoleMatch] = useState<string>("")
  const [resumeFileName, setResumeFileName] = useState<string>("")

  // Profile image state
  const [image, setImage] = useState<string | null>(null)
  
  // Skills toggle
  const [showAllSkills, setShowAllSkills] = useState(false)
  const SKILL_DISPLAY_LIMIT = 4
  const shouldShowToggle = skills.length > SKILL_DISPLAY_LIMIT

  // LinkedIn jobs state
  const [jobs, setJobs] = useState<
    { position: string; company: string; location: string; url: string; companyLogo?: string; jobUrl?: string }[]
  >([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  // Job Recommendations toggle
  const [showJobRecommendations, setShowJobRecommendations] = useState(false)

  const toggleJobRecommendations = () => {
    setShowJobRecommendations(!showJobRecommendations)
  }

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("aboutMe", aboutMe)
  }, [aboutMe])
  useEffect(() => {
    localStorage.setItem("skills", JSON.stringify(skills))
  }, [skills])
  useEffect(() => {
    localStorage.setItem("selectedRole", selectedRole)
  }, [selectedRole])

  // Handle GitHub OAuth callback
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")
    if (code) {
      (async () => {
        try {
          const username = await handleGitHubOAuth(code);
          const fetched = await connectToGitHub(username);
          setRepos(fetched);
          mergeRepoLanguages(fetched);
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, []);

  // Fetch resume data on mount
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const response = await api.get('/resume');
        setResumeFileName(response.data.parsedData.fileName || '');
        setResumeExperience(response.data.parsedData.experience || []);
        setRoleMatch(response.data.parsedData.roleMatch || '');
      } catch (err) {
        console.error('Failed to fetch resume data:', err);
      }
    };
    fetchResumeData();
  }, []);

  const mergeRepoLanguages = async (fetchedRepos: typeof repos) => {
    const langSet = new Set(skills)
    for (const repo of fetchedRepos) {
      const langs = await fetchRepoLanguages(repo.html_url)
      Object.keys(langs).forEach((lang) => langSet.add(lang))
    }
    setSkills(Array.from(langSet))
  }

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (!trimmed || skills.includes(trimmed)) return
    setSkills((prev) => [trimmed, ...prev])
    setNewSkill("")
  }

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToDelete))
  }

  const handleGitHubConnect = async () => {
    if (!showAuthOptions) return setShowAuthOptions(true)
    try {
      if (useOAuth) initiateGitHubOAuth()
      else {
        const username = prompt("Enter GitHub username:")
        if (!username) return alert("Username required")
        const fetched = await connectToGitHub(username)
        setRepos(fetched)
        mergeRepoLanguages(fetched)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setShowAuthOptions(false)
    }
  }

   useEffect(() => {
      const fetchProfileImage = async () => {
        try {
          const response = await api.get(`/resource/image/${getUserAuth().imageFilename}`, {
            responseType: 'blob',
          });
          const imageUrl = URL.createObjectURL(response.data as Blob);
          setImage(imageUrl);
        } catch (error) {
          console.log('Error fetching profile image.');
          setImage(null);
        }
      };
     getUserAuth().imageFilename && fetchProfileImage();
    }, []);

  // Upload & parse resume
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const uploadResume = async (formData: FormData) => {
      const response = await api.post('/resource/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    };

    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFileName(file.name);
    setParsing(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const uploadedResume = await uploadResume(form);

      const res = await api.post('/resume/parseResume',
          {
            resumefileName: uploadedResume, originfilename: file.name,
            }, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { aboutMe: aiAbout, skills: aiSkills, roleMatch: aiRole, experience: aiExp } = res.data;
      setAboutMe(aiAbout);
      setSkills(aiSkills);
      setRoleMatch(aiRole);
      setResumeExperience(aiExp);
    } catch (err) {
      console.error(err);
      alert('Failed to parse resume.');
    } finally {
      setParsing(false);
    }
  };

  // Fetch Linkedin Jobs
  const fetchJobs = async (settings: {
    location: string
    dateSincePosted: string
    jobType: string
    experienceLevel: string
    skills?: string[]
  }) => {
    setLoadingJobs(true)
    try {
      const response = await api.get("/linkedin-jobs/jobs", {
        params: {
          skills: (settings.skills || skills.slice(0, 3)).join(","),
          role: selectedRole,
          location: settings.location,
          dateSincePosted: settings.dateSincePosted,
          jobType: settings.jobType,
          experienceLevel: settings.experienceLevel,
        },
      })
      setJobs(response.data)
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoadingJobs(false)
    }
  }

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    let completed = 0
    const total = 4
    if (aboutMe.trim()) completed++
    if (selectedRole.trim()) completed++
    if (skills.length > 0) completed++
    if (repos.length > 0) completed++
    return Math.round((completed / total) * 100)
  }

  const profileCompletion = calculateProfileCompletion()

  const handleRemoveAllSkills = () => {
    setSkills([]);
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                display: "inline",
                background: theme.palette.mode === "dark"
                  ? "linear-gradient(45deg, #60a5fa 30%, #34d399 90%)"
                  : "linear-gradient(45deg, #3b82f6 30%, #10b981 90%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                mb: 1,
              }}
            >
              NextStep
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Your personalized career development dashboard
            </Typography>

            {/* Profile Completion Card */}
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Profile Completion
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={700}>
                    {profileCompletion}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={profileCompletion}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Box>
        </motion.div>

        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={4}>
              {/* About Me Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card
                  sx={{
                    background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.15)}`,
                    },
                    // flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    {/* Upload Section */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        { !image ? <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            mr: 2,
                            width: 56,
                            height: 56,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 28 }} />
                        </Avatar> : 
                        <Avatar src={image} alt="Profile" style={{ width: 56, height: 56, marginTop: '16px', objectFit: 'cover', margin:7 }} />

                        }
                        <Box>
                          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                            About Me
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tell us about yourself and your career goals
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {parsing && <CircularProgress size={20} />}
                        <input
                          accept=".pdf,.docx"
                          id="upload-resume"
                          type="file"
                          hidden
                          onChange={handleResumeUpload}
                        />
                        <Tooltip title={resumeFileName ? resumeFileName : "Upload CV to auto-fill"} arrow>
                          <label htmlFor="upload-resume">
                            <IconButton
                              component="span"
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                              }}
                            >
                              {resumeFileName ? <Box>
                                <InsertDriveFile  />
                                <CheckCircle fontSize="small"
                                  sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    color: 'green',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                  }}/>
                                </Box> : <InsertDriveFile />}
                            </IconButton>
                          </label>
                        </Tooltip>
                      </Box>
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      placeholder="Describe your background, experience, and career aspirations..."
                      value={aboutMe}
                      onChange={(e) => setAboutMe(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 3,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.background.default, 0.7),
                          },
                          "&.Mui-focused": {
                            backgroundColor: alpha(theme.palette.background.default, 0.8),
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Role and Skills Row */}
              <Grid container >
                {/* Skills */}
                <Grid item xs={12} md={6} paddingRight={2}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                        backdropFilter: "blur(20px)",
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: "all 0.3s ease",
                        position: 'relative', // Add position relative
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.15)}`,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              mr: 2,
                              width: 48,
                              height: 48,
                            }}
                          >
                            <BuildIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                              Skills ({skills.length})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Your technical expertise
                            </Typography>
                          </Box>
                        </Box>
                        <Tooltip title="Remove all skills" arrow>
                          <Button size="small" onClick={handleRemoveAllSkills} sx={{ mb: 2, position: 'absolute', top: 8, right: 8 }}>
                            <Delete/>
                          </Button>
                        </Tooltip>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2, gap: 1 }}>
                          {(showAllSkills ? skills : skills.slice(0, SKILL_DISPLAY_LIMIT)).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              onDelete={() => handleDeleteSkill(skill)}
                              size="small"
                              sx={{
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                  boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.3)}`,
                                },
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                "& .MuiChip-deleteIcon": {
                                  color: alpha(theme.palette.info.main, 0.7),
                                  "&:hover": {
                                    color: theme.palette.error.main,
                                  },
                                },
                              }}
                            />
                          ))}
                        </Stack>

                        {shouldShowToggle && (
                          <Button size="small" onClick={() => setShowAllSkills((prev) => !prev)} sx={{ mb: 2 }}>
                            {showAllSkills ? "Show Less" : `Show ${skills.length - SKILL_DISPLAY_LIMIT} More`}
                          </Button>
                        )}

                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={skillsList}
                            value={newSkill}
                            onInputChange={(_, val) => setNewSkill(val)}
                            onChange={(_, val) => val && handleAddSkill(val)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Add skill..."
                                onKeyDown={(e) => e.key === "Enter" && handleAddSkill(newSkill)}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                                  },
                                }}
                              />
                            )}
                            sx={{ flexGrow: 1 }}
                          />
                          <IconButton
                            onClick={() => handleAddSkill(newSkill)}
                            disabled={!newSkill.trim()}
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              "&:hover": {
                                bgcolor: alpha(theme.palette.info.main, 0.2),
                              },
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Desired Role */}
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
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
                      <CardContent sx={{ p: 3  }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.secondary.main, 0.1),
                              color: theme.palette.secondary.main,
                              mr: 2,
                              width: 48,
                              height: 48,
                            }}
                          >
                            <WorkIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              Target Role
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              What's your dream job?
                            </Typography>
                          </Box>
                        </Box>
                        <Autocomplete
                          freeSolo
                          options={roles}
                          value={selectedRole}
                          onInputChange={(_, val) => setSelectedRole(val)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="outlined"
                              placeholder="Select or type a role"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                                  "&:hover": {
                                    backgroundColor: alpha(theme.palette.background.default, 0.7),
                                  },
                                  "&.Mui-focused": {
                                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                  },
                                },
                              }}
                            />
                          )}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>

              {/* AI Insights Row */}
              {(roleMatch || resumeExperience.length > 0) && (
                <Grid container>
                  {/* Suggested Role Match */}
                  {roleMatch && (
                    <Grid item xs={12} md={6} paddingRight={2}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        <Card
                          sx={{
                            height: "100%",
                            background: `linear-gradient(145deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                            backdropFilter: "blur(20px)",
                            boxShadow: `0 8px 32px ${alpha(theme.palette.warning.main, 0.1)}`,
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                  color: theme.palette.warning.main,
                                  mr: 2,
                                  width: 48,
                                  height: 48,
                                }}
                              >
                                <LightbulbSharp />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight={600}>
                                  AI Suggestion
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Based on your profile
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                              "{roleMatch}"
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  )}

                  {/* Experience */}
                  {resumeExperience.length > 0 && (
                    <Grid item xs={12} md={roleMatch ? 6 : 12}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <Card
                          sx={{
                            height: "100%",
                            background: `linear-gradient(145deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            backdropFilter: "blur(20px)",
                            boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.1)}`,
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main,
                                  mr: 2,
                                  width: 48,
                                  height: 48,
                                }}
                              >
                                <Grading />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight={600}>
                                  Experience Highlights
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  From your resume
                                </Typography>
                              </Box>
                            </Box>
                            <Stack spacing={1}>
                              {resumeExperience.slice(0, 3).map((exp, i) => (
                                <Typography key={i} variant="body2" sx={{ display: "flex", alignItems: "flex-start" }}>
                                  <Star sx={{ fontSize: 16, mr: 1, mt: 0.2, color: theme.palette.success.main }} />
                                  {exp}
                                </Typography>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  )}
                </Grid>
              )}
            </Stack>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={4}>
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        textAlign: "center",
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <TrendingUp sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                        <Typography variant="h6" fontWeight={700}>
                          {skills.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Skills
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                        textAlign: "center",
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Code sx={{ fontSize: 32, color: theme.palette.secondary.main, mb: 1 }} />
                        <Typography variant="h6" fontWeight={700}>
                          {repos.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Repos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </motion.div>

              {/* Connect Accounts */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card
                  sx={{
                    background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          mr: 2,
                          width: 48,
                          height: 48,
                        }}
                      >
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Connect Accounts
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Link your professional profiles
                        </Typography>
                      </Box>
                    </Box>

                    {showAuthOptions ? (
                      <Box>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Connection Method</InputLabel>
                          <Select
                            value={useOAuth ? "oauth" : "no-auth"}
                            label="Connection Method"
                            onChange={(e) => setUseOAuth(e.target.value === "oauth")}
                          >
                            <MenuItem value="oauth">OAuth (Recommended)</MenuItem>
                            <MenuItem value="no-auth">Username Only</MenuItem>
                          </Select>
                        </FormControl>
                        <Stack spacing={2}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<GitHub />}
                            onClick={handleGitHubConnect}
                            sx={{
                              bgcolor: "#24292e",
                              "&:hover": { bgcolor: "#1a1e22" },
                            }}
                          >
                            Connect GitHub
                          </Button>
                          <Button fullWidth variant="outlined" onClick={() => setShowAuthOptions(false)}>
                            Cancel
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={<LinkedIn />}
                          fullWidth
                          sx={{
                            bgcolor: "#0077B5",
                            "&:hover": { bgcolor: "#005582" },
                            transition: "all 0.3s ease",
                            "&:active": { transform: "scale(0.98)" },
                          }}
                        >
                          Connect LinkedIn
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<GitHub />}
                          fullWidth
                          onClick={() => setShowAuthOptions(true)}
                          sx={{
                            borderColor: "#24292e",
                            color: "#24292e",
                            "&:hover": {
                              borderColor: "#1a1e22",
                              bgcolor: alpha("#24292e", 0.04),
                            },
                          }}
                        >
                          Connect GitHub
                        </Button>
                      </Stack>
                    )}

                    {repos.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                          Connected Repositories ({repos.length})
                        </Typography>
                        <Stack spacing={1} sx={{ maxHeight: 150, overflow: "auto" }}>
                          {repos.slice(0, 5).map((repo) => (
                            <Button
                              key={repo.id}
                              href={repo.html_url}
                              target="_blank"
                              variant="text"
                              size="small"
                              sx={{
                                justifyContent: "flex-start",
                                textTransform: "none",
                                color: theme.palette.text.secondary,
                                "&:hover": {
                                  color: theme.palette.primary.main,
                                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                                },
                              }}
                            >
                              <Code sx={{ fontSize: 16, mr: 1 }} />
                              {repo.name}
                            </Button>
                          ))}
                          {repos.length > 5 && (
                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", pt: 1 }}>
                              +{repos.length - 5} more repositories
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Jobs Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <LinkedinJobs
                  jobs={jobs}
                  loadingJobs={loadingJobs}
                  fetchJobs={fetchJobs}
                  showJobRecommendations={showJobRecommendations}
                  toggleJobRecommendations={toggleJobRecommendations}
                  skills={skills}
                  selectedRole={selectedRole}
                />
              </motion.div>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default MainDashboard
