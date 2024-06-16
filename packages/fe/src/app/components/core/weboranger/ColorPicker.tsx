import React, { useState } from 'react';
import { TwitterPicker } from 'react-color';

interface ColorPickerProps {
  initialColor?: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ initialColor = '', onChange }) => {
  const [color, setColor] = useState(initialColor);

  const handleColorChange = (color: { hex: string }) => {
    setColor(color.hex);
    onChange(color.hex);
  };

  return (
    <div>
      <TwitterPicker color={color} onChange={handleColorChange} />
    </div>
  );
};

export default ColorPicker;