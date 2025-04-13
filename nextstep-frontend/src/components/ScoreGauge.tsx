import * as React from 'react';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { Box } from '@mui/material';

interface ScoreGaugeProps {
  score: number;
  width?: number;
  height?: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, width = 200, height = 200 }) => {
  const getGradientColor = (value: number) => {
    // Clamp value between 0 and 100
    value = Math.max(0, Math.min(100, value));
  
    let r, g, b;
  
    if (value <= 50) {
      // Red (255, 0, 0) to Yellow (255, 215, 0)
      const ratio = value / 50;
      r = 255;
      g = Math.round(215 * ratio);
      b = 0;
    } else {
      // Yellow (255, 215, 0) to Green (82, 178, 2)
      const ratio = (value - 50) / 50;
      r = Math.round(255 + (82 - 255) * ratio);  // Decrease red
      g = Math.round(215 + (178 - 215) * ratio); // Shift green
      b = Math.round(0 + (2 - 0) * ratio);       // Increase blue a little
    }
  
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Gauge
        width={width}
        height={height}
        value={score}
        cornerRadius="50%"
        sx={(theme) => ({
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: 30,
            fontWeight: 'bold',
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: getGradientColor(score),
            transition: 'fill 1s ease-in-out',
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: theme.palette.text.disabled,
          },
        })}
      />
    </Box>
  );
};

export default ScoreGauge; 