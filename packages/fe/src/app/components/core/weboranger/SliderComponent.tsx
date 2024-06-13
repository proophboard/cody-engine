import React from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface SliderComponentProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  scale?: boolean;
  percentage?: boolean; // Add a prop to differentiate percentage
}

const SliderComponent: React.FC<SliderComponentProps> = ({
  value = 50,
  onChange,
  min,
  max,
  step = 1,
  scale,
  percentage,
}) => {
  const handleChange = (event: Event, newValue: number | number[]) => {
    if (scale && percentage) {
      onChange((newValue as number) / 100 * (max - min) + min);
    } else {
      onChange(newValue as number);
    }
  };

  const scaledValue = scale && percentage ? ((value - min) / (max - min)) * 100 : value;

  const marks = percentage
    ? [
        { value: 0, label: '0%' },
        { value: 50, label: '50%' },
        { value: 100, label: '100%' },
      ]
    : [
        { value: min, label: `${min}` },
        { value: max, label: `${max}` },
      ];

  return (
    <Box sx={{ width: 300 }}>
      <Typography id="input-slider" gutterBottom>
        {percentage ? 'Gewichtung' : 'Temperature'}
      </Typography>
      <Slider
        aria-labelledby="input-slider"
        value={scaledValue}
        onChange={handleChange}
        min={percentage ? 0 : min}
        max={percentage ? 100 : max}
        marks={marks}
        step={step}
      />
    </Box>
  );
};

export default SliderComponent;
