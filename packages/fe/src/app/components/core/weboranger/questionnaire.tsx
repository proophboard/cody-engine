import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../../providers/ToggleColorMode';
import ColorPickerQuestion from '@frontend/app/components/core/weboranger/ColorPickerQuestion';
import OptionsQuestion from '@frontend/app/components/core/weboranger/OptionsQuestion';
import TextQuestion from '@frontend/app/components/core/weboranger/TextQuestion';
import { Box, Button, CircularProgress, Container, TextField, Typography, useTheme } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

interface Question {
  id: number;
  text: string;
  options?: string[];
  colorPicker?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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
  //Die ID aus dem Input feld
  const [id, setId] = useState<string>('');
  const [saveUnder, setSaveUnder] = useState<string>('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openNameSnackbar, setOpenNameSnackbar] = useState(false);
  const [nameSnackbarMessage, setNameSnackbarMessage] = useState<string>('');
  //Die aktuelle ID die in Server gespeichert ist und unter der die Daten in der Datenbank gespeichert werden
  const [currentId, setCurrentId] = useState<string>(() => {
    return localStorage.getItem('currentId') || '';
  });

  //Holt sich die aktuelle ID vom server wenn die Komponente geladen wird (sie ist in dem fall immer 0)
  useEffect(() => {
    const fetchCurrentId = async () => {
      try {
        const response = await fetch('http://localhost:3000/getID');
        if (!response.ok) {
          throw new Error('Fehler bei: /getID');
        }
        const data = await response.json();
        setCurrentId(data.id);
      } catch (error) {
        console.error('Error fetching current ID:', error);
      }
    };

    fetchCurrentId();
  }, []);

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

  const handleTrySetId = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/try-set-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /api/try-set-id');
      } 
      const responseData = await response.json();

      if (!responseData.success && !responseData.idInUse) {
        console.log('Die ID darf nicht leer sein!');
        setNameSnackbarMessage(responseData.message)
        setOpenNameSnackbar(true)
      } else if (!responseData.success && responseData.idInUse) {
        console.log('Die ID ist bereits in verwendung. Trotzdem fortfahren?');
        setOpenSnackbar(true);
      } else {
        setCurrentId(id);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testMethod= async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/getDocs')
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleForceSetId = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/force-set-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /api/force-set-id');
      }
      //auf die response muss hier gewartet werden da sonst setCurrentId durch asynchronität nicht korrekt aufgerufen wird
      const responseData = await response.json();
      console.log('Force set ID response:', responseData);
      setCurrentId(id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setOpenSnackbar(false);
    }
  };

  const handleSave = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/save-questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: responses, saveUnder }),
      });
      if (!response.ok ) {
        throw new Error('Fehler bei: /api/save-questionnaire');
      } 
      const responseData = await response.json();

      console.log(responseData.message);
      setNameSnackbarMessage(responseData.message);
      setOpenNameSnackbar(true);


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
        const responseJson = await response.json()
        applyTheme(responseJson.theme)
      }
    } catch (error) {
      console.error('Error in /api/generate-with-ai', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box display="flex" flexDirection="column" gap={3}>
        {questions.map((question) => (
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
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.main}
          onMouseDown={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.light}
          onMouseUp={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark}
        >
          Submit
        </Button>
        <TextField
          label="Save Under"
          variant="outlined"
          value={saveUnder}
          onChange={(e) => setSaveUnder(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSave}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.palette.secondary.dark}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.palette.secondary.main}
          onMouseDown={(e) => e.currentTarget.style.backgroundColor = theme.palette.secondary.light}
          onMouseUp={(e) => e.currentTarget.style.backgroundColor = theme.palette.secondary.dark}
        >
          Save
        </Button>
        <TextField
          label="ID"
          variant="outlined"
          value={id}
          onChange={(e) => setId(e.target.value)}
          fullWidth
        />
        <Typography variant="h6" gutterBottom>
        Derzeitige ID: {currentId}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleTrySetId}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.main}
          onMouseDown={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.light}
          onMouseUp={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark}
        >
          Set ID
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={testMethod}
        >
          TestButton
        </Button>
      </Box>
      <Backdrop open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="warning">
          ID already in use. Do you want to force set this ID?
          <Button
            variant="contained"
            color="secondary"
            onClick={handleForceSetId}
          >
            Force Set ID
          </Button>
        </Alert>
      </Snackbar>
      <Snackbar open={openNameSnackbar} autoHideDuration={6000} onClose={() => setOpenNameSnackbar(false)}>
        <Alert onClose={() => setOpenNameSnackbar(false)} severity="warning">
        {nameSnackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Questionnaire;
