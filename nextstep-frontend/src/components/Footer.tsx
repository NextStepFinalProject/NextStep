"use client"

import type React from "react"
import { Box, Container, Typography, Link, useTheme, useMediaQuery, Stack, IconButton } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import { GitHub, LinkedIn, Twitter } from "@mui/icons-material"
import { motion } from "framer-motion"

const Footer: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: "auto",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(17, 24, 39, 0.8)" : "rgba(249, 250, 251, 0.8)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid",
        borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        width: "100%",
        boxShadow: theme.palette.mode === "dark" ? "0 -4px 20px rgba(0, 0, 0, 0.2)" : "0 -4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "center" : "flex-start",
            gap: 4,
          }}
        >
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMobile ? "center" : "flex-start",
                gap: 1,
              }}
            >
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
                NextStep
              </Typography>
              <Typography variant="body2" color="text.secondary" align={isMobile ? "center" : "left"}>
                Empowering your career journey
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      color: theme.palette.primary.main,
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <GitHub />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      color: "#0077B5",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <LinkedIn />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      color: "#1DA1F2",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <Twitter />
                </IconButton>
              </Stack>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 3 : 6,
                alignItems: isMobile ? "center" : "flex-start",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>
                  Quick Links
                </Typography>
                <Link
                  component={RouterLink}
                  to="/feed"
                  color="text.secondary"
                  underline="none"
                  sx={{
                    "&:hover": {
                      color: theme.palette.primary.main,
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.2s ease",
                    display: "block",
                  }}
                >
                  Feed
                </Link>
                <Link
                  component={RouterLink}
                  to="/profile"
                  color="text.secondary"
                  underline="none"
                  sx={{
                    "&:hover": {
                      color: theme.palette.primary.main,
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.2s ease",
                    display: "block",
                  }}
                >
                  Profile
                </Link>
                <Link
                  component={RouterLink}
                  to="/chat"
                  color="text.secondary"
                  underline="none"
                  sx={{
                    "&:hover": {
                      color: theme.palette.primary.main,
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.2s ease",
                    display: "block",
                  }}
                >
                  Chat
                </Link>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>
                  Resources
                </Typography>
                <Link
                  component={RouterLink}
                  to="/resume"
                  color="text.secondary"
                  underline="none"
                  sx={{
                    "&:hover": {
                      color: theme.palette.primary.main,
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.2s ease",
                    display: "block",
                  }}
                >
                  Resume Builder
                </Link>
                <Link
                  component={RouterLink}
                  to="/quiz"
                  color="text.secondary"
                  underline="none"
                  sx={{
                    "&:hover": {
                      color: theme.palette.primary.main,
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.2s ease",
                    display: "block",
                  }}
                >
                  Career Quiz
                </Link>
                <Link
                  component={RouterLink}
                  to="/main-dashboard"
                  color="text.secondary"
                  underline="none"
                  sx={{
                    "&:hover": {
                      color: theme.palette.primary.main,
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.2s ease",
                    display: "block",
                  }}
                >
                  Dashboard
                </Link>
              </Box>
            </Box>
          </motion.div>
        </Box>

        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "1px solid",
            borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" align={isMobile ? "center" : "left"}>
            © {new Date().getFullYear()} NextStep. All rights reserved.
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 3,
              justifyContent: isMobile ? "center" : "flex-end",
            }}
          >
            <Link
              href="/terms"
              color="text.secondary"
              underline="none"
              sx={{
                "&:hover": {
                  color: theme.palette.primary.main,
                },
                transition: "all 0.2s ease",
              }}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              color="text.secondary"
              underline="none"
              sx={{
                "&:hover": {
                  color: theme.palette.primary.main,
                },
                transition: "all 0.2s ease",
              }}
            >
              Privacy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
