import React, { useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface QuestionnairePopupProps {
  onClose: () => void; // Funktion zum Schließen des Popups
  questions: {
    [index: string]: {
      question: string;
      answer: string;
    };
  };
}

const QuestionnairePopup: React.FC<QuestionnairePopupProps> = ({ onClose, questions }) => {
  useEffect(() => {
    const handleScroll = () => {
      onClose(); // Popup schließen
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [onClose]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff',
        padding: '20px',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        borderRadius: '5px',
        minWidth: '300px',
        maxWidth: '80%',
        maxHeight: '80%',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <Typography variant="h6">Questionnaire</Typography>
        <Button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>×</Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Question</strong></TableCell>
              <TableCell><strong>Answer</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(questions).map((index) => (
              <TableRow key={index}>
                <TableCell>{questions[index].question}</TableCell>
                <TableCell>{questions[index].answer}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default QuestionnairePopup;
