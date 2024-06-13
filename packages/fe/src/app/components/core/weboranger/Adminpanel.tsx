import React, { useContext, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Container, Typography, Backdrop, Snackbar, List, ListItem, ListItemText, ListItemSecondaryAction, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, useTheme, Divider, Select, MenuItem } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ThemeContext } from '@frontend/app/providers/ToggleColorMode';
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
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [openIDSnackbar, setOpenIDSnackbar] = useState(false);
  const [openDeleteAllSnackbar, setOpenDeleteAllSnackbar] = useState(false);
  const [openUndoDeleteIDSnackbar, setOpenUndoDeleteIDSnackbar] = useState(false);
  const [openUndoDeleteThemeSnackbar, setOpenUndoDeleteThemeSnackbar] = useState(false);
  const [openWarningSnackbar, setWarningSnackbar] = useState(false);
  const [aiSourceID, setAiSourceID] = useState('');
  //Die aktuelle ID die in Server gespeichert ist und unter der die Daten in der Datenbank gespeichert werden
  const [currentId, setCurrentId] = useState<string>(() => {
    return localStorage.getItem('currentId') || '';
  });

  useEffect(() => {
    fetchQuestionnaires();
    fetchCurrentTheme();
    fetchAiSource();
  }, []);

  const fetchAiSource = async () => {    try {
    const response = await fetch('http://localhost:3000/getAiSource');
    if (!response.ok) {
      throw new Error('Fehler bei: /getAiSource');
    }
    const data = await response.json();
    setAiSourceID(data.aiSource);
    } catch (error) {
      console.error('Error fetching aiSource:', error);
    }
  }
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

  const fetchCurrentTheme = async () => {
    try {
      const response = await fetch('http://localhost:3000/getLastTheme');
      if (!response.ok) {
        throw new Error('Fehler bei: /getLastTheme');
      }
      const data = await response.json();
      console.log(data.theme)
      applyTheme(data.theme)
    } catch (error) {
        console.error('Error fetching current ID:', error);
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

        try {
          if (!(await fetch('http://localhost:3000/setAppliedTheme', {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme : responseJson.theme.json }),
          })).ok) {
            throw new Error('Fehler bei: /setAppliedTheme');
          }
        
        } catch (error) {
          console.error('Error in /setAppliedTheme', error);
        }

        applyTheme(responseJson.theme.json);
      }
    } catch (error) {
      console.error('Error in /getDoc', error);
    }
    setSnackbarMessage(`Applying theme for ${category.replace('O4S-ai-', '')} - ${docName}`);
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
      setSnackbarMessage("All entries deleted successfully");
      setOpenSuccessSnackbar(true);
    } catch (error) {
      console.error('Error in /deleteDatabaseEntries', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteTheme = async (category: string, docName: string) => {
    try {
      console.log("Übergebene category: ", category)
      console.log("Übergebene docName: ", docName)
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
        return newState;
      });
      setSnackbarMessage(`Deleted Theme: ${category.replace('O4S-ai-', '')} - ${docName}`);
      setOpenUndoDeleteThemeSnackbar(true)
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
      setSnackbarMessage(`Deleted ID: ${category.replace('O4S-ai-', '')}`);
      setOpenUndoDeleteIDSnackbar(true)
    } catch (error) {
      console.error('Error in /deleteID', error);
    }
  };

  const setDefaultTheme = async () => {
    try {
      const response = await fetch('http://localhost:3000/setAppliedTheme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: {} }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /setAppliedTheme auf default');
      }
    } catch (error) {
      console.error('Error in /setAppliedTheme auf default', error);
    }
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
        setSnackbarMessage(responseData.message)
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
        setSnackbarMessage("ID was set successfully")
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

  const switchAiSource = async (event: { target: { value: any; }; }) => {
    const selectedValue = event.target.value;
    setAiSourceID(selectedValue);
    try {
      const response = await fetch('http://localhost:3000/setAiSource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aiSource : selectedValue }),
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /setAiSource');
      }
      

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUndoDeleteTheme = async () => {
    try {
      const response = await fetch('http://localhost:3000/undoDeleteDoc', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /api/undoDeleteDoc');
      }

      fetchQuestionnaires();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUndoDeleteID = async () => {
    try {
      const response = await fetch('http://localhost:3000/undoDeleteID', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Fehler bei: /api/undoDeleteID');
      }

      fetchQuestionnaires();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const questionCounts = aggregateResponses(questionnaires);

  return (
    <Container maxWidth="md">
      <Box display="flex" flexDirection="column" gap={3} mt={4}>
        <Typography variant="h4" gutterBottom>Saved Themes</Typography>
        {loading ? (
          <Backdrop open={loading}>
            <CircularProgress color="inherit" />
          </Backdrop>
        ) : (
          <>
            <List>
              {Object.entries(questionnaires).map(([category, docs]) => (
                <Box key={category} mb={2}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6" gutterBottom>
                      {category.replace('O4S-ai-', '')}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {handleDeleteID(category)}}
                      style={{ marginLeft: '10px', marginBottom: '6px' }}
                    >
                      Delete ID
                    </Button>
                  </Box>
                  <List>
                    {Object.keys(docs).length === 0 ? (
                      <ListItem divider>
                        <ListItemText primary="Keine Themes gespeichert" />
                      </ListItem>
                    ) : (
                      Object.entries(docs).map(([docName]) => (
                        <ListItem key={docName} divider>
                          <ListItemText primary={docName} />
                          <ListItemSecondaryAction>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleApplyTheme(category, docName)}
                              style={{ marginRight: '10px' }}
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
                      ))
                    )}
                  </List>
                </Box>
              ))}

            </List>
            <Box display="flex" justifyContent="flex-start">
              <Button
              variant="contained"
              color="primary"
              onClick={() => {setSnackbarMessage("Sind Sie sicher dass Sie alle Datenbankinhalte löschen wollen?"); setOpenDeleteAllSnackbar(true)}}
              style={{ marginRight: '16px' }}
            >
            Delete all Data
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={setDefaultTheme}
            >
            Apply Default Theme
            </Button>
            </Box>
            <Box>
            <Divider sx={{ borderBottomWidth: 3, borderColor: 'black', my: 3 }} />
            <Typography variant="h4" gutterBottom style={{ marginBottom: '10px' }}>Set ID for Questionnaire:</Typography>
            <TextField
              label="ID"
              variant="outlined"
              value={id}
              onChange={(e) => setId(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleTrySetId}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.main}
              onMouseDown={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.light}
              onMouseUp={(e) => e.currentTarget.style.backgroundColor = theme.palette.primary.dark}
              style={{ marginTop: '16px' }}
            >
              Set ID
            </Button>
            </Box>
            <Divider sx={{ borderBottomWidth: 3, borderColor: 'black', my: 1 }} />
            <Box mt={4}>
              <Typography variant="h4" gutterBottom>Questionnaire Statistics</Typography>
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
      <Divider sx={{ borderBottomWidth: 3, borderColor: 'black', my: 3 }} />
      <Box>
        <Typography variant="h4" gutterBottom>Hosting der KI:</Typography>
        <Select
          value={aiSourceID}
          onChange={switchAiSource}
          variant="outlined"
        >
          <MenuItem value="local">Local-Hosting</MenuItem>
          <MenuItem value="server">Server-Hosting</MenuItem>
        </Select>
      </Box>
      <Snackbar
        open={openSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSuccessSnackbar(false)}
      >
        <Alert onClose={() => setOpenSuccessSnackbar(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Snackbar open={openWarningSnackbar} autoHideDuration={6000} onClose={() => setWarningSnackbar(false)}>
        <Alert onClose={() => setWarningSnackbar(false)} severity="warning">
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Snackbar open={openIDSnackbar} autoHideDuration={6000} onClose={() => setOpenIDSnackbar(false)}>
        <Alert onClose={() => setOpenIDSnackbar(false)} severity="warning">
          ID already in use. Do you want to force set this ID?
          <Button
            variant="contained"
            color="primary"
            onClick={handleForceSetId}
            style={{ marginLeft: '16px' }}
          >
            Force Set ID
          </Button>
        </Alert>
      </Snackbar>
      <Snackbar open={openDeleteAllSnackbar} autoHideDuration={6000} onClose={() => setOpenDeleteAllSnackbar(false)}>
        <Alert onClose={() => setOpenDeleteAllSnackbar(false)} severity="warning">
          {snackbarMessage}
          <Button
            variant="contained"
            color="primary"
            onClick={handleDeleteEverything}
            style={{ marginLeft: '16px' }}
          >
            DELETE
          </Button>
        </Alert>
      </Snackbar>
      <Snackbar open={openUndoDeleteThemeSnackbar} autoHideDuration={6000} onClose={() => setOpenUndoDeleteThemeSnackbar(false)}>
        <Alert onClose={() => setOpenUndoDeleteThemeSnackbar(false)} severity="warning">
          {snackbarMessage}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {handleUndoDeleteTheme(); setOpenUndoDeleteThemeSnackbar(false)}}
            style={{ marginLeft: '16px' }}
          >
            UNDO
          </Button>
        </Alert>
      </Snackbar>
      <Snackbar open={openUndoDeleteIDSnackbar} autoHideDuration={6000} onClose={() => setOpenUndoDeleteIDSnackbar(false)}>
        <Alert onClose={() => setOpenUndoDeleteIDSnackbar(false)} severity="warning">
          {snackbarMessage}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {handleUndoDeleteID(); setOpenUndoDeleteIDSnackbar(false)}}
            style={{ marginLeft: '16px' }}
          >
            UNDO
          </Button>
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Adminpanel;
