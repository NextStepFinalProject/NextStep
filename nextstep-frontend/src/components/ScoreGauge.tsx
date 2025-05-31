import React, { useEffect, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const theme = useTheme();
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayScore(score);
    }, 500);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = (score: number) => {
    // Red -> Orange -> Yellow -> Green color progression
    if (score >= 90) return '#4caf50'; // Green
    if (score >= 75) return '#8bc34a'; // Light green
    if (score >= 60) return '#ffeb3b'; // Yellow
    if (score >= 45) return '#ff9800'; // Orange
    if (score >= 30) return '#ff5722'; // Deep orange
    return '#f44336'; // Red
  };

  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Box sx={{ 
      position: 'relative', 
      width: 300, 
      height: 300,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative' }}
      >
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r="90"
            fill="none"
            stroke={theme.palette.grey[200]}
            strokeWidth="20"
          />
          {/* Progress circle */}
          <motion.circle
            cx="150"
            cy="150"
            r="90"
            fill="none"
            stroke={getColor(score)}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
      </motion.div>
      
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Typography
            variant="h2"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: getColor(score),
              fontSize: '3.5rem',
              lineHeight: 1,
              textAlign: 'center',
              margin: 0,
              padding: 0,
            }}
          >
            {displayScore}
          </Typography>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              lineHeight: 1,
              textAlign: 'center',
              margin: 0,
              padding: 0,
            }}
          >
            Resume Score
          </Typography>
        </motion.div>
      </Box>

      {/* Decorative elements */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          boxShadow: `0 0 30px ${getColor(score)}40`,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default ScoreGauge; 