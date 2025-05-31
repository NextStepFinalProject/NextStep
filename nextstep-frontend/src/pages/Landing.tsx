import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
  Paper,
  IconButton,
} from '@mui/material';
import {
  School,
  Work,
  Psychology,
  Chat,
  ArrowForward,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <School sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Career Guidance',
      description: 'Get personalized career recommendations based on your skills and interests.',
    },
    {
      icon: <Work sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Job Matching',
      description: 'Find the perfect job opportunities that match your profile and aspirations.',
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Skill Assessment',
      description: 'Take quizzes to evaluate your skills and identify areas for improvement.',
    },
    {
      icon: <Chat sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Community Support',
      description: 'Connect with peers and mentors to share experiences and get advice.',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          background: 'linear-gradient(45deg, #0984E3 0%, #00B894 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            animation: 'pulse 8s ease-in-out infinite',
          },
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              opacity: 0.5,
            },
            '50%': {
              transform: 'scale(1.5)',
              opacity: 0.2,
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 0.5,
            },
          },
        }}
      >
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.1)',
            },
          }}
        >
          {isDarkMode ? <LightMode /> : <DarkMode />}
        </IconButton>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  mb: 2,
                  animation: 'fadeInUp 0.8s ease-out',
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                Take Your Next Step Towards Success
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  animation: 'fadeInUp 0.8s ease-out 0.2s both',
                }}
              >
                Your personalized career development platform that helps you navigate your professional journey with confidence.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  animation: 'fadeInUp 0.8s ease-out 0.4s both',
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/assets/landing-hero.svg"
                alt="Career Development"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  display: { xs: 'none', md: 'block' },
                  animation: 'float 6s ease-in-out infinite',
                  '@keyframes float': {
                    '0%': {
                      transform: 'translateY(0px)',
                    },
                    '50%': {
                      transform: 'translateY(-20px)',
                    },
                    '100%': {
                      transform: 'translateY(0px)',
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h2"
          align="center"
          sx={{
            mb: 6,
            fontWeight: 800,
            color: 'text.primary',
            animation: 'fadeInUp 0.8s ease-out',
          }}
        >
          Why Choose Next Step?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  animation: `fadeInUp 0.8s ease-out ${index * 0.2}s both`,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                    '& .feature-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                }}
              >
                <Box
                  className="feature-icon"
                  sx={{
                    mb: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 12, md: 16 },
          position: 'relative',
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(116, 185, 255, 0.15) 0%, rgba(85, 239, 196, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(9, 132, 227, 0.1) 0%, rgba(0, 184, 148, 0.1) 100%)',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 4,
              animation: 'fadeInUp 0.8s ease-out',
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 2,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #74B9FF 0%, #55EFC4 100%)'
                  : 'linear-gradient(135deg, #0984E3 0%, #00B894 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientText 8s ease infinite',
                '@keyframes gradientText': {
                  '0%': {
                    backgroundPosition: '0% 50%',
                  },
                  '50%': {
                    backgroundPosition: '100% 50%',
                  },
                  '100%': {
                    backgroundPosition: '0% 50%',
                  },
                },
              }}
            >
              Ready to Start Your Journey?
            </Typography>
            <Typography
              variant="h5"
              sx={{
                maxWidth: '600px',
                mb: 4,
                fontWeight: 400,
                animation: 'fadeInUp 0.8s ease-out 0.2s both',
                color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3436',
                opacity: 0.9,
              }}
            >
              Join thousands of professionals who have already taken their next step towards success.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: '50px',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(116, 185, 255, 0.3)'
                  : '0 4px 20px rgba(9, 132, 227, 0.3)',
                animation: 'fadeInUp 0.8s ease-out 0.4s both',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 25px rgba(116, 185, 255, 0.4)'
                    : '0 6px 25px rgba(9, 132, 227, 0.4)',
                  '& .MuiButton-endIcon': {
                    transform: 'translateX(4px)',
                  },
                },
                '& .MuiButton-endIcon': {
                  transition: 'transform 0.3s ease',
                },
              }}
            >
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Landing; 