import React, { ChangeEvent, useContext, useState } from 'react';
import { ThemeContext } from '../../../providers/ToggleColorMode';
import ColorPickerQuestion from '@frontend/app/components/core/questionnaire/ColorPickerQuestion';
import OptionsQuestion from '@frontend/app/components/core/questionnaire/OptionsQuestion';
import TextQuestion from '@frontend/app/components/core/questionnaire/TextQuestion';
import { Box, Button, CircularProgress, Container, Typography, useTheme } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';

interface Question {
  id: number;
  text: string;
  options?: string[];
  colorPicker?: boolean;
}

const Questionnaire: React.FC = () => {
  const { applyTheme } = useContext(ThemeContext);
  const theme = useTheme();

  // Edit/Add Questions and options here
  const questions: Question[] = [
    { id: 1, text: 'What vibe should the theme have?', options: ['Modern', 'Classic', 'Professional', 'Casual'] },
    { id: 4, text: 'Pick an accent color for the theme!', colorPicker: true },
  ];

  // Set default response if no value was given by the user
  const defaultResponses = questions.reduce((acc, question) => {
    acc[question.id] = {
      question: question.text,
      answer: question.options ? question.options[0] : question.colorPicker ? "#000000" : "",
    };
    return acc;
  }, {} as Record<any, any>);

  // Handle State (answers)
  const [responses, setResponses] = useState<Record<any, any>>(defaultResponses);
  const [loading, setLoading] = useState(false);

  // Update State when <input> is changed
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, id: number) => {
    setResponses({
      ...responses,
      [id]: {
        question: questions.find(question => question.id === id)?.text,
        answer: e.target.value
      }
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/generate-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: responses }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      } else {
        await fetchThemeConfig();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThemeConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/theme-config');
      const themeConfig = await response.json();
      applyTheme(themeConfig);
    } catch (error) {
      console.error('Failed to fetch theme config:', error);
    }
  };

  // UI
  return (
    <Container maxWidth="sm">
      <Box display="flex" flexDirection="column" gap={3}>
        {questions.map((question) => (
          // Render the correct component based on the question type
          <Box
            key={question.id}
            p={4}
            mb={2}
            bgcolor={theme.palette.background.default}
            borderRadius={2}
            boxShadow={1}
          >
            <Typography variant="h5" fontWeight="light" gutterBottom>
              {question.text}
            </Typography>
            {question.options ? (
              <OptionsQuestion handleInputChange={handleInputChange} question={question} />
            ) : question.colorPicker ? (
              <ColorPickerQuestion handleInputChange={handleInputChange} question={question} />
            ) : (
              <TextQuestion handleInputChange={handleInputChange} question={question} />
            )}
          </Box>
        ))}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark} // Change color on hover
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.main} // Change color back on mouse out
          onMouseDown={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.light} // Change color on click
          onMouseUp={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark} // Change color on click
        >
          Submit
        </Button>
      </Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

export default Questionnaire;
