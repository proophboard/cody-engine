import React, { useState } from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface SliderComponentProps {
    value: number;
    onChange: (value: number) => void;
  }
  
  const SliderComponent: React.FC<SliderComponentProps> = ({ value, onChange }) => {
    const handleChange = (event: Event, newValue: number | number[]) => {
      onChange(newValue as number);
    };
  
    const marks = [
      {
        value: 0,
        label: '0%',
      },
      {
        value: 50,
        label: '50%',
      },
      {
        value: 100,
        label: '100%',
      },
    ];
  
    return (
      <Box sx={{ width: 300 }}>
        <Typography id="input-slider" gutterBottom>
        </Typography>
        <Slider
          aria-labelledby="input-slider"
          value={value}
          onChange={handleChange}
          min={0}
          max={100}
          marks={marks}
        />
      </Box>
    );
  };
  
  export default SliderComponent;