import { createTheme, type ThemeOptions } from "@mui/material"

// Common theme settings
const commonSettings: ThemeOptions = {
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "50px",
          padding: "10px 24px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        },
        contained: {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "scale(1.1)",
          },
        },
      },
    },
  },
}

// Update the dark theme with more sophisticated colors and better contrast
export const darkTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: {
      main: "#60a5fa", // Brighter blue that stands out better on dark backgrounds
      light: "#93c5fd",
      dark: "#3b82f6",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#10b981", // Vibrant teal/green
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    background: {
      default: "#111827", // Deeper, richer dark background
      paper: "#1f2937", // Slightly lighter than default for cards/surfaces
    },
    text: {
      primary: "#f3f4f6", // Light gray instead of pure white for better readability
      secondary: "#d1d5db", // Medium gray for secondary text
    },
    divider: "rgba(255, 255, 255, 0.08)", // Subtle dividers
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
  },
  components: {
    ...commonSettings.components,
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "8px",
          padding: "10px 24px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
          },
        },
        contained: {
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
          "&:hover": {
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)",
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.23)",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.5)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(31, 41, 55, 0.95)", // Slightly transparent
          backgroundImage: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(17, 24, 39, 0.8)", // Semi-transparent
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a2234", // Slightly different than main background
          backgroundImage: "linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#d1d5db",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            transform: "scale(1.1)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(96, 165, 250, 0.15)",
            color: "#60a5fa",
            "&:hover": {
              backgroundColor: "rgba(96, 165, 250, 0.25)",
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(31, 41, 55, 0.8)",
          borderRadius: 8,
          transition: "all 0.2s ease",
          "&.Mui-focused": {
            boxShadow: "0 0 0 2px rgba(96, 165, 250, 0.3)",
          },
        },
        input: {
          "&::placeholder": {
            color: "rgba(209, 213, 219, 0.5)",
            opacity: 1,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.1)",
            transition: "all 0.2s ease",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#60a5fa",
            borderWidth: 2,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "4px 0",
          "&.Mui-selected": {
            backgroundColor: "rgba(96, 165, 250, 0.15)",
            "&:hover": {
              backgroundColor: "rgba(96, 165, 250, 0.25)",
            },
            "& .MuiListItemIcon-root": {
              color: "#60a5fa",
            },
            "& .MuiListItemText-primary": {
              color: "#f3f4f6",
              fontWeight: 600,
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        },
        deleteIcon: {
          color: "rgba(255, 255, 255, 0.5)",
          "&:hover": {
            color: "rgba(255, 255, 255, 0.8)",
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: "0.75rem",
        },
      },
    },
  },
})

// Also update the light theme for consistency
export const lightTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6", // Vibrant blue
      light: "#60a5fa",
      dark: "#2563eb",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#10b981", // Vibrant teal/green
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f9fafb",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#4b5563",
    },
    divider: "rgba(0, 0, 0, 0.08)",
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
  },
  components: {
    ...commonSettings.components,
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "8px",
          padding: "10px 24px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
          },
        },
        contained: {
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(0, 0, 0, 0.03)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: "all 0.2s ease",
          "&.Mui-focused": {
            boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.2)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3b82f6",
            borderWidth: 2,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "4px 0",
          "&.Mui-selected": {
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            "&:hover": {
              backgroundColor: "rgba(59, 130, 246, 0.12)",
            },
            "& .MuiListItemIcon-root": {
              color: "#3b82f6",
            },
            "& .MuiListItemText-primary": {
              color: "#111827",
              fontWeight: 600,
            },
          },
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.03)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid rgba(0, 0, 0, 0.05)",
        },
      },
    },
  },
})
