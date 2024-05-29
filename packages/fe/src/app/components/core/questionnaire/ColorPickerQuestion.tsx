import Circle from '@uiw/react-color-circle';
import React, { ChangeEvent, useEffect, useState } from 'react';

interface ColorPickerProps {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>, id: number) => void;
  question: { id: number; text: string; };
  response: { question: string; answer: string };
}

const ColorPickerQuestion: React.FC<ColorPickerProps> = ({ handleInputChange, question, response }) => {
  const [hex, setHex] = useState(response.answer);

  useEffect(() => {
    setHex(response.answer);
  }, [response]);

  return (
    <Circle
      colors={[
        '#f44336',
        '#e91e63',
        '#9c27b0',
        '#673ab7',
        '#3f51b5',
        '#2196f3',
        '#03A9F4',
        '#00BCD4',
        '#009688',
        '#4CAF50',
        '#8BC34A',
        '#CDDC39',
        '#FFEB3B',
        '#FFC107',
        '#FF9800',
        '#FF5722',
        '#795548',
        '#607D8B',
        '#000000',
        '#ffffff',
      ]}
      color={hex}
      pointProps={{
        style: {
          marginRight: 10,
          height: 40,
          width: 40,
          borderRadius: 20,
        },
      }}
      onChange={(color) => {
        setHex(color.hex);
        handleInputChange({ target: { value: color.hex } } as ChangeEvent<HTMLInputElement>, question.id);
      }}
    />
  );
};

export default ColorPickerQuestion;
