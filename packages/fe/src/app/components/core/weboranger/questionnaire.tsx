import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../../providers/ToggleColorMode';
import ColorPicker from '@frontend/app/components/core/weboranger/ColorPicker';
import SliderComponent from '@frontend/app/components/core/weboranger/SliderComponent';
import OptionsQuestion from '@frontend/app/components/core/weboranger/OptionsQuestion';
import TextQuestion from '@frontend/app/components/core/weboranger/TextQuestion';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

interface Question {
  id: number;
  text: string;
  options?: string[];
  colorPicker?: boolean;
  slider?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Questionnaire: React.FC = () => {
  const { applyTheme } = useContext(ThemeContext);
  const theme = useTheme();
  const [temperature, setTemperature] = useState<number>(0.9);

  const questions: Question[] = [
    {
      id: 1,
      text: 'Welches Thema soll die Anwendung haben?',
      options: ['Seriös', 'Energiegeladen', 'Fröhlich', 'Naturverbunden', 'Technisch', 'Minimalistisch', 'Premium'],
    },
    { id: 2, text: 'Gibt es eine bestimmte Farbe, die die Anwendung haben soll?', colorPicker: true },
    { id: 3, text: 'Wie stark soll die Gewichtung der Farbe sein?', slider: true },
    {
      id: 4,
      text: 'Welches Thema soll die Schriftart haben?',
      options: ['Verspielt', 'Schlicht', 'Maschinell', 'Gerundet', 'Elegant', 'Dramatisch', 'Sachlich'],
    },
  ];

  const defaultResponses = questions.reduce((acc, question) => {
    acc[question.id] = {
      question: question.text,
      answer: question.options
        ? question.options[0]
        : question.colorPicker
        ? null
        : '',
    };
    return acc;
  }, {} as Record<any, any>);

  const savedResponses = JSON.parse(localStorage.getItem('responses') || JSON.stringify(defaultResponses));

  const mergedResponses = Object.keys(savedResponses).reduce((acc, key) => {
    const id = Number(key);
    if (questions.find((question) => question.id === id)) {
      acc[id] = savedResponses[key];
    }
    return acc;
  }, {} as Record<any, any>);

  const [responses, setResponses] = useState<Record<any, any>>(mergedResponses);
  const [loading, setLoading] = useState(false);
  const [saveUnder, setSaveUnder] = useState<string>('');
  const [openWarningSnackbar, setWarningSnackbar] = useState(false);
  const [warningSnackbarMessage, setWarningSnackbarMessage] = useState<string>('');
  const [openSuccessSnackbar, setSuccessSnackbar] = useState(false);
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState<string>('');
  const [currentId, setCurrentId] = useState<string>(() => {
    return localStorage.getItem('currentId') || '';
  });

  useEffect(() => {
    fetchCurrentTheme();
    fetchCurrentId();
  }, []);

  const fetchCurrentTheme = async () => {
    try {
      const response = await fetch('http://localhost:3000/getLastTheme');
      if (!response.ok) {
        throw new Error('Fehler bei: /getLastTheme');
      }
      const data = await response.json();
      applyTheme(data.theme);
    } catch (error) {
      console.error('Error fetching current ID:', error);
    }
  };

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

  useEffect(() => {
    localStorage.setItem('responses', JSON.stringify(responses));
  }, [responses]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    id: number,
  ) => {
    const value = e.target.value;
    setResponses((prevResponses) => {
      const updatedResponses = {
        ...prevResponses,
        [id]: {
          question: questions.find((question) => question.id === id)?.text!,
          answer: value,
        },
      };
      return updatedResponses;
    });
  };

  const handleColorChange = (color: string, id: number) => {
    setResponses((prevResponses) => {
      const updatedResponses = {
        ...prevResponses,
        [id]: {
          question: questions.find((question) => question.id === id)?.text!,
          answer: color,
        },
      };
      return updatedResponses;
    });
  };

  const handleSliderChange = (value: number, id: number) => {
    setResponses((prevResponses) => {
      const updatedResponses = {
        ...prevResponses,
        [id]: {
          question: questions.find((question) => question.id === id)?.text!,
          answer: value,
        },
      };
      return updatedResponses;
    });
  };

  const handleSave = async (e: { preventDefault: () => void }) => {
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
      if (!response.ok) {
        throw new Error('Fehler bei: /api/save-questionnaire');
      }
      const responseData = await response.json();

      if (!responseData.success) {
        setWarningSnackbarMessage(responseData.message);
        setWarningSnackbar(true);
      } else {
        setSuccessSnackbarMessage(responseData.message);
        setSuccessSnackbar(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/generate-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: responses, temperature }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /api/generate-with-ai');
      } else {
        const responseJson = await response.json();
        applyTheme(responseJson.theme);
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
        <Typography variant="h6" gutterBottom>
          Derzeitige ID: {currentId}
        </Typography>

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
              <ColorPicker
                initialColor={responses[question.id]?.answer ?? ''}
                onChange={(color) => handleColorChange(color, question.id)}
              />
            ) : question.slider ? (
              <SliderComponent
                value={responses[question.id]?.answer ?? 50}
                onChange={(value) => handleSliderChange(value, question.id)}
                min={0}
                max={100}
                step={1}
                percentage
              />
            ) : (
              <TextQuestion handleInputChange={handleInputChange} question={question} />
            )}
          </Box>
        ))}

        <Box
          p={4}
          mb={2}
          bgcolor={theme.palette.background.default}
          borderRadius={2}
          boxShadow={1}
        >
          <Typography variant="h5" fontWeight="light" gutterBottom>
            Bestimmen Sie die Kreativität der KI
          </Typography>
          <SliderComponent
            value={temperature}
            onChange={(value) => setTemperature(value)}
            min={0.1}
            max={0.9}
            step={0.1}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.dark)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.main)}
          onMouseDown={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.light)}
          onMouseUp={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.dark)}
        >
          Submit
        </Button>

        <Divider sx={{ borderBottomWidth: 3, borderColor: 'black', my: 1 }} />

        <TextField
          label="Save Under"
          variant="outlined"
          value={saveUnder}
          onChange={(e) => setSaveUnder(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.dark)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.main)}
          onMouseDown={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.light)}
          onMouseUp={(e) => (e.currentTarget.style.backgroundColor = theme.palette.primary.dark)}
        >
          Save
        </Button>
      </Box>

      <Backdrop open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Snackbar open={openWarningSnackbar} autoHideDuration={6000} onClose={() => setWarningSnackbar(false)}>
        <Alert onClose={() => setWarningSnackbar(false)} severity="warning">
          {warningSnackbarMessage}
        </Alert>
      </Snackbar>
      <Snackbar open={openSuccessSnackbar} autoHideDuration={6000} onClose={() => setSuccessSnackbar(false)}>
        <Alert onClose={() => setSuccessSnackbar(false)} severity="success">
          {successSnackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Questionnaire;
