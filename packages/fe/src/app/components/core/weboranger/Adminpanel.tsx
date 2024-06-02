import React, { useContext, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Container, Typography, Backdrop, Snackbar, List, ListItem, ListItemText, ListItemSecondaryAction, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, useTheme } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ThemeContext } from '../../../providers/ToggleColorMode';
import theme from "@frontend/extensions/app/layout/theme";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Adminpanel = () => {
  const { applyTheme } = useContext(ThemeContext);
  const theme = useTheme();

  const [questionnaires, setQuestionnaires] = useState<docFormat>({});
  const [id, setId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState('');
  const [openIDSnackbar, setOpenIDSnackbar] = useState(false);
  const [openWarningSnackbar, setWarningSnackbar] = useState(false);
  const [warningSnackbarMessage, setWarningSnackbarMessage] = useState<string>('');
  //Die aktuelle ID die in Server gespeichert ist und unter der die Daten in der Datenbank gespeichert werden
  const [currentId, setCurrentId] = useState<string>(() => {
    return localStorage.getItem('currentId') || '';
  });

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

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

  const handleApplyTheme = async (category: string, docName: string) => {
    try {
      const response = await fetch('http://localhost:3000/getDoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: category, docName: docName }),
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
    setSuccessSnackbarMessage(`Applying theme for ${category.replace('O4S-ai-', '')} - ${docName}`);
    setOpenSuccessSnackbar(true);
  };

  //dev methode alle einträge zu löschen
  const handleDeleteEverything = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/deleteDatabaseEntries', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Fehler bei: /deleteDatabaseEntries');
      }
      await response.json();
      setQuestionnaires({});
      setSuccessSnackbarMessage("All entries deleted successfully");
      setOpenSuccessSnackbar(true);
    } catch (error) {
      console.error('Error in /deleteDatabaseEntries', error);
    } finally {
      setLoading(false);
    }
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
      setQuestionnaires(prevState => {
        const newState = { ...prevState };
        delete newState[category][docName];
        if (Object.keys(newState[category]).length === 0) {
          delete newState[category];
        }
        return newState;
      });
      setSuccessSnackbarMessage(`Deleted Theme: ${category.replace('O4S-ai-', '')} - ${docName}`);
      setOpenSuccessSnackbar(true);
    } catch (error) {
      console.error('Error in /deleteDoc', error);
    }
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
      setQuestionnaires(prevState => {
        const newState = { ...prevState };
        delete newState[category];
        return newState;
      });
      setSuccessSnackbarMessage(`Deleted ID: ${category.replace('O4S-ai-', '')}`);
      setOpenSuccessSnackbar(true);
    } catch (error) {
      console.error('Error in /deleteID', error);
    }
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
        setWarningSnackbarMessage(responseData.message)
        setWarningSnackbar(true)
      } else if (!responseData.success && responseData.idInUse) {
        console.log('Die ID ist bereits in verwendung. Trotzdem fortfahren?');
        setOpenIDSnackbar(true);
      } else {
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
        setCurrentId(id);
        setSuccessSnackbarMessage("ID was set successfully")
        setOpenSuccessSnackbar(true)
      }

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
      setOpenIDSnackbar(false);
    }
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
      <TextField
        label="ID"
        variant="outlined"
        value={id}
        onChange={(e) => setId(e.target.value)}
        fullWidth
      />
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
      <Snackbar
        open={openSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSuccessSnackbar(false)}
      >
        <Alert onClose={() => setOpenSuccessSnackbar(false)} severity="success">
          {successSnackbarMessage}
        </Alert>
      </Snackbar>
      <Snackbar open={openWarningSnackbar} autoHideDuration={6000} onClose={() => setWarningSnackbar(false)}>
        <Alert onClose={() => setWarningSnackbar(false)} severity="warning">
          {warningSnackbarMessage}
        </Alert>
      </Snackbar>
      <Snackbar open={openIDSnackbar} autoHideDuration={6000} onClose={() => setOpenIDSnackbar(false)}>
        <Alert onClose={() => setOpenIDSnackbar(false)} severity="warning">
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
    </Container>
  );
};

export default Adminpanel;
