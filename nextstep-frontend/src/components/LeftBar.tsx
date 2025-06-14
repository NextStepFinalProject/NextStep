import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  ListItemButton,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Person,
  Message,
  Logout,
  DocumentScannerTwoTone,
  Feed,
  Quiz,
  LightMode,
  DarkMode,
  Menu as MenuIcon,
} from "@mui/icons-material"
import { getUserAuth, removeUserAuth } from "../handlers/userAuth.ts"
import api from "../serverApi.ts"
import fullLogo from "../../assets/NextStep.png"
import partialLogo from "../../assets/NextStepLogo.png"
import { useTheme as useCustomTheme } from "../contexts/ThemeContext"
import { motion } from "framer-motion"

const LeftBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setCollapsed(true);
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = async () => {
    try {
      const userAuth = getUserAuth()
      if (userAuth) {
        await api.post(
          "/auth/logout",
          {},
          {
            headers: { Authorization: `Bearer ${userAuth.accessToken}` },
          },
        )
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      removeUserAuth()
      navigate("/login")
    }
  }

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/main-dashboard" },
    { text: "Resume", icon: <DocumentScannerTwoTone />, path: "/resume" },
    { text: "Quiz", icon: <Quiz />, path: "/quiz" },
    { text: "Feed", icon: <Feed />, path: "/feed" },
    { text: "Chat", icon: <Message />, path: "/chat" },
    { text: "Profile", icon: <Person />, path: "/profile" },
  ]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const drawer = (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Prevent scrolling
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100px", // Fixed height for logo section
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            component="img"
            src={collapsed ? partialLogo : fullLogo}
            alt="NextStep"
            className="logo-text"
            sx={{
              height: collapsed ? 40 : 60, // Reduced logo size
              cursor: "pointer",
              opacity: 1,
              transform: collapsed ? "scale(0.8)" : "scale(1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: isDarkMode ? "drop-shadow(0 0 8px rgba(96, 165, 250, 0.3))" : "none",
            }}
            onClick={() => navigate("/main-dashboard")}
          />
        </motion.div>
      </Box>

      <Divider
        sx={{
          borderColor: alpha(theme.palette.divider, 0.5),
          width: "80%",
          mx: "auto",
        }}
      />

      {/* Main Menu Items - Takes up available space */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // Center the menu items vertically
          px: 1.5,
          py: 1,
        }}
      >
        <List sx={{ p: 0 }}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <motion.div
                key={item.text}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.text : ""} placement="right" arrow>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => {
                        navigate(item.path)
                        if (mobileOpen) setMobileOpen(false)
                      }}
                      sx={{
                        minHeight: 44, // Reduced height
                        justifyContent: collapsed ? "center" : "initial",
                        px: 2,
                        py: 1,
                        borderRadius: "12px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&.Mui-selected": {
                          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                          color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.25),
                          },
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 4,
                            height: "60%",
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: "0 4px 4px 0",
                          },
                          "& .MuiListItemIcon-root": {
                            color: theme.palette.primary.main,
                          },
                        },
                        "&:hover": {
                          bgcolor: alpha(theme.palette.action.hover, 0.8),
                          transform: "translateX(4px)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? "auto" : 36, // Reduced icon spacing
                          mr: collapsed ? 0 : 1.5,
                          color: isActive ? "inherit" : theme.palette.text.secondary,
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "& svg": {
                            fontSize: "1.2rem", // Slightly smaller icons
                          },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        className="menu-text"
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                          fontSize: "0.875rem", // Smaller text
                        }}
                        sx={{
                          opacity: collapsed ? 0 : 1,
                          transform: collapsed ? "translateX(-20px)" : "translateX(0)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          ml: 0.5,
                        }}
                      />
                      {isActive && !collapsed && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: theme.palette.primary.main,
                            ml: 1,
                            boxShadow: `0 0 8px ${theme.palette.primary.main}`,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </motion.div>
            )
          })}
        </List>
      </Box>

      <Divider
        sx={{
          borderColor: alpha(theme.palette.divider, 0.5),
          width: "80%",
          mx: "auto",
        }}
      />

      {/* Bottom Actions - Fixed at bottom */}
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <List sx={{ p: 0 }}>
          <Tooltip title={collapsed ? "Theme" : ""} placement="right" arrow>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={toggleTheme}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  minHeight: 40, // Reduced height
                  justifyContent: collapsed ? "center" : "initial",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.action.hover, 0.8),
                    transform: "translateX(4px)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? "auto" : 36,
                    mr: collapsed ? 0 : 1.5,
                    color: theme.palette.text.secondary,
                    "& svg": {
                      fontSize: "1.1rem",
                    },
                  }}
                >
                  {isDarkMode ? <LightMode /> : <DarkMode />}
                </ListItemIcon>
                <ListItemText
                  primary={isDarkMode ? "Light Mode" : "Dark Mode"}
                  className="menu-text"
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                  }}
                  sx={{
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? "translateX(-20px)" : "translateX(0)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    ml: 0.5,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </Tooltip>
          <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  minHeight: 40, // Reduced height
                  justifyContent: collapsed ? "center" : "initial",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    transform: "translateX(4px)",
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.error.main,
                    },
                    "& .MuiListItemText-primary": {
                      color: theme.palette.error.main,
                    },
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? "auto" : 36,
                    mr: collapsed ? 0 : 1.5,
                    color: theme.palette.text.secondary,
                    "& svg": {
                      fontSize: "1.1rem",
                    },
                  }}
                >
                  <Logout />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  className="menu-text"
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                  }}
                  sx={{
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? "translateX(-20px)" : "translateX(0)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    ml: 0.5,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </Tooltip>
        </List>
      </Box>
    </Box>
  )

  return (
    <>
      {/* Mobile menu toggle button */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1200,
        }}
      >
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 240,
            borderRight: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.5),
            boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
            backgroundImage: isDarkMode
              ? "linear-gradient(to bottom, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95))"
              : "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95))",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: collapsed ? 72 : 240,
          flexShrink: 0,
          position: "fixed",
          "& .MuiDrawer-paper": {
            width: collapsed ? 72 : 240,
            boxSizing: "border-box",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.5),
            overflowX: "hidden",
            overflowY: "hidden", // Prevent vertical scrolling
            backgroundImage: isDarkMode
              ? "linear-gradient(to bottom, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95))"
              : "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95))",
            backdropFilter: "blur(10px)",
            boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
            "&:hover": {
              width: 240,
              "& .logo-text": {
                opacity: 1,
                transform: "translateX(0)",
              },
              "& .menu-text": {
                opacity: 1,
                transform: "translateX(0)",
              },
            },
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}

export default LeftBar;
