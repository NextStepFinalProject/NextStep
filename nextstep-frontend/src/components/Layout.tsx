"use client"

import { Container, Box, useTheme } from "@mui/material"
import type React from "react"
import { motion } from "framer-motion"
import "./Layout.css"

interface LayoutProps {
  className?: string
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ className = "", children }) => {
  const theme = useTheme()

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: theme.palette.background.default,
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === "dark"
              ? `
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.9) 100%)
              `
              : `
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)
              `,
          zIndex: -2,
        },
        "&::after": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === "dark"
              ? `
                conic-gradient(from 0deg at 50% 50%, 
                  rgba(59, 130, 246, 0.03) 0deg, 
                  rgba(16, 185, 129, 0.03) 120deg, 
                  rgba(139, 92, 246, 0.03) 240deg, 
                  rgba(59, 130, 246, 0.03) 360deg),
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 100px,
                  rgba(255, 255, 255, 0.005) 100px,
                  rgba(255, 255, 255, 0.005) 101px
                )
              `
              : `
                conic-gradient(from 0deg at 50% 50%, 
                  rgba(59, 130, 246, 0.02) 0deg, 
                  rgba(16, 185, 129, 0.02) 120deg, 
                  rgba(139, 92, 246, 0.02) 240deg, 
                  rgba(59, 130, 246, 0.02) 360deg),
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 100px,
                  rgba(0, 0, 0, 0.005) 100px,
                  rgba(0, 0, 0, 0.005) 101px
                )
              `,
          zIndex: -1,
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Container
          maxWidth={false}
          className={className}
          sx={{
            flex: 1,
            py: 4,
            px: { xs: 2, sm: 3, md: 4 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
            position: "relative",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "transparent",
            ml: { xs: 0, md: "72px" },
            width: { xs: "100%", md: "calc(100% - 72px)" },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&.login, &.register": {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100vh - 64px)",
              ml: 0,
              width: "100%",
            },
            "&.feed, &.profile, &.chat, &.resume, &.main-dashboard, &.quiz": {
              maxWidth: { xs: "100%", lg: "calc(1200px + 72px)" },
            },
          }}
        >
          {children}
        </Container>
      </motion.div>
    </Box>
  )
}

export default Layout
