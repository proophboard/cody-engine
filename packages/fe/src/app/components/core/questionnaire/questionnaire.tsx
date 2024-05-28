import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
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

  // Retrieve saved responses from localStorage or set to default
  const savedResponses = JSON.parse(localStorage.getItem('responses') || JSON.stringify(defaultResponses));

  // Handle State (answers)
  const [responses, setResponses] = useState<Record<any, any>>(savedResponses);
  const [loading, setLoading] = useState(false);

  // Save responses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('responses', JSON.stringify(responses));
    console.log('Responses saved to localStorage:', responses);
  }, [responses]);

  // Update State when <input> is changed
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, id: number) => {
    const value = e.target.value;
    setResponses(prevResponses => {
      const updatedResponses = {
        ...prevResponses,
        [id]: {
          question: questions.find(question => question.id === id)?.text!,
          answer: value
        }
      };
      console.log('Updated Responses:', updatedResponses);
      return updatedResponses;
    });
  };

  //Diese Methode wird vom bestätigungs button aufgerufen der direkt beim input feld für die ID ist (input required)
  const handleTrySetId = async (e: { preventDefault: () => void; }) => {
    try {
      const response = await fetch('http://localhost:3000/api/try-set-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: "HIER MUSS DIE ID AUS DEM INPUT FELD DANN REIN BITTI ALS STRING" }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /api/try-set-id');
      } 
      const responseData = await response.json();

      //Hier könnten fehler entstehen falls die json nicht richtig gesendet wird und responseData nicht gesetezt ist ist es ja auch false
      if (!responseData.success) {
        //An dieser stelle muss das pop up oder was auch immer aktiviert werden in dem der button für das "force setten" ist und es muss eine fehler meldung angezeigt
        //werden, dass die ID bereits in use ist
        console.log('ID bereits vergeben. Wollen Sie trotzdem fortfahren?', responseData);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  //Diese Methode wird vom bestätigungs button aufgerufen nachdem man eine ID eingegeben hat die schon in use ist
  const handleForceSetId = async (e: { preventDefault: () => void; }) => {
    try {
      const response = await fetch('http://localhost:3000/api/force-set-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: "HIER MUSS DIE ID AUS DEM INPUT FELD DANN REIN BITTI ALS STRING" }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /api/force-set-id');
      } 
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  //Nachdem der Nutzer bestätigt hat, das er die ID so übernehmen will
  const handleSave = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/save-questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: responses, saveUnder: "name unter dem die Responses und Json gespeichert werden (STRING geht das?)" }),
      });
      if (!response.ok ) {
        throw new Error('Fehler bei: /api/save-questionnaire');
      } 
      const responseData = await response.json();

      //Hier könnten fehler entstehen falls die json nicht richtig gesendet wird und responseData nicht gesetezt ist ist es ja auch false
      if (!responseData.success) {
        //Hier reicht ein einfaches Pop up bei dem gesagt wird das der Name für diese ID schon vergeben ist
        console.log('Name für diese ID bereits vergeben:');
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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
        throw new Error('Fehler bei: /api/generate-with-ai');
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
              <OptionsQuestion handleInputChange={handleInputChange} question={question} response={responses[question.id]} />
            ) : question.colorPicker ? (
              <ColorPickerQuestion handleInputChange={handleInputChange} question={question} response={responses[question.id]} />
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
