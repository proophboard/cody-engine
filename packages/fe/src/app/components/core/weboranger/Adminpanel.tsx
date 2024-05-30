import React, { useContext, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Container, Typography, Backdrop, Snackbar, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ThemeContext } from '../../../providers/ToggleColorMode';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Adminpanel = () => {
  const { applyTheme } = useContext(ThemeContext);

  const [questionnaires, setQuestionnaires] = useState<docFormat>({});
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/getDocs');
        if (!response.ok) {
          throw new Error('Fehler bei: /getDocs');
        }
        const data = await response.json();
        setQuestionnaires(data);
      } catch (error) {
        console.error('Error fetching docFormat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaires();
  }, []);

  const handleApplyTheme = async (category: string, docName: string) => {
    try {
      const response = await fetch('http://localhost:3000/getDoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: category, docName : docName }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /getDoc');
      } else {
        const responseJson = await response.json();
        applyTheme(responseJson.theme.json);
      }
    } catch (error) {
      console.error('Error in /getDoc', error);
    }
    setSnackbarMessage(`Applying theme for ${category.replace('O4S-ai-', '')} - ${docName}`);
    setOpenSnackbar(true);
  };

  //dev methode alle einträge zu löschen
  const handleDeleteEverything = async () => {
    await fetch('http://localhost:3000/deleteDatabaseEntries', { method: 'POST' });
  };

  const handleDeleteTheme = async (category: string, docName: string) => {
    try {
      const response = await fetch('http://localhost:3000/deleteDoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: category, docName: docName }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /deleteDoc');
      }
    } catch (error) {
      console.error('Error in /deleteDoc', error);
    }
    setSnackbarMessage(`Deleted Theme: ${category.replace('O4S-ai-', '')} - ${docName}`);
    setOpenSnackbar(true);
  };

  const handleDeleteID = async (category: string) => {
    try {
      const response = await fetch('http://localhost:3000/deleteID', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: category }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /deleteID');
      }
    } catch (error) {
      console.error('Error in /deleteID', error);
    }
    setSnackbarMessage(`Deleted ID: ${category.replace('O4S-ai-', '')}`);
    setOpenSnackbar(true);
  };

  const setDefaultTheme = async () => {
    applyTheme({});
  };

  interface docFormat {
    [category: string]: {
      [docName: string]: {
        doc: {
          questionaire: {
            [questionId: string]: {
              question: string;
              answer: string;
            };
          };
        };
      };
    };
  }
  
  interface QuestionCounts {
    [question: string]: {
      [answer: string]: number;
    };
  }

  const aggregateResponses = (questionnaires: docFormat): QuestionCounts => {
    const questionCounts: QuestionCounts = {};

    Object.keys(questionnaires).forEach(category => {
      Object.keys(questionnaires[category]).forEach(doc => {
        const questionnaire = questionnaires[category][doc].doc.questionaire;
        Object.keys(questionnaire).forEach(questionId => {
          const question = questionnaire[questionId].question;
          const answer = questionnaire[questionId].answer;

          if (!questionCounts[question]) {
            questionCounts[question] = {};
          }
          if (!questionCounts[question][answer]) {
            questionCounts[question][answer] = 0;
          }
          questionCounts[question][answer]++;
        });
      });
    });

    return questionCounts;
  };

  const questionCounts = aggregateResponses(questionnaires);

  return (
    <Container maxWidth="md">
        <Box display="flex" flexDirection="column" gap={3} mt={4}>
        <Typography variant="h4" gutterBottom>Admin Panel</Typography>
        {loading ? (
          <Backdrop open={loading}>
            <CircularProgress color="inherit" />
          </Backdrop>
        ) : (
          <>
            <List>
              {Object.entries(questionnaires).map(([category, docs]) => (
                <Box key={category} mb={2}>
                  <Typography variant="h6" gutterBottom>
                    {category.replace('O4S-ai-', '')}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleDeleteID(category)}
                  >
                    Delete
                  </Button>
                  <List>
                    {Object.entries(docs).map(([docName]) => (
                      <ListItem key={docName} divider>
                        <ListItemText primary={docName} />
                        <ListItemSecondaryAction>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleApplyTheme(category, docName)}
                          >
                            Apply
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleDeleteTheme(category, docName)}
                          >
                            Delete
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </List>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDeleteEverything}
            >
              Delete Everything
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={setDefaultTheme}
            >
              Apply Default
            </Button>
            <Box mt={4}>
              <Typography variant="h5" gutterBottom>Questionnaire Statistics</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ borderBottom: '5px solid rgba(224, 224, 224, 1)' }}>Question</TableCell>
                      <TableCell style={{ borderBottom: '5px solid rgba(224, 224, 224, 1)' }}>Answer</TableCell>
                      <TableCell style={{ borderBottom: '5px solid rgba(224, 224, 224, 1)' }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(questionCounts).map(question => {
                      const answers = Object.entries(questionCounts[question]).sort((a, b) => b[1] - a[1]);
                      return (
                        <React.Fragment key={question}>
                          <TableRow style={{ borderTop: '3px solid rgba(224, 224, 224, 1)' }}>
                            <TableCell rowSpan={answers.length} style={{ fontWeight: 'bold' }}>
                              {question}
                            </TableCell>
                            <TableCell>{answers[0][0]}</TableCell>
                            <TableCell>{answers[0][1]}</TableCell>
                          </TableRow>
                          {answers.slice(1).map(([answer, count]) => (
                            <TableRow style={{ borderBottom: '3px solid rgba(224, 224, 224, 1)' }} key={answer}>
                              <TableCell>{answer}</TableCell>
                              <TableCell>{count}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="info">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Adminpanel;
