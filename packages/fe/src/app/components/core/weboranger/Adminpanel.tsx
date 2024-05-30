import React, { useContext, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Container, Typography, Backdrop, Snackbar, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ThemeContext } from '../../../providers/ToggleColorMode';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Adminpanel = () => {
  const { applyTheme } = useContext(ThemeContext);

  const [questionnaires, setQuestionnaires] = useState<Record<string, any>>({});
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
        console.error('Error fetching Questionnaires:', error);
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
      console.log("TEST")
      if (!response.ok) {
        throw new Error('Fehler bei: /getDoc');
      } else {
        const responseJson = await response.json()
        applyTheme(responseJson.theme.json)
      }
    } catch (error) {
      console.error('Error in /getDoc', error);
    } finally {
      setLoading(false);
    }
    setSnackbarMessage(`Applying theme for ${category.replace('O4S-ai-', '')} - ${docName}`);
    setOpenSnackbar(true);
  };

  const handleDeleteEverything = async () => {
    await fetch('http://localhost:3000/deleteDatabaseEntries', {method: 'POST'})
   }

  const setDefaultTheme = async () => {
    applyTheme({})
  }

  return (
    <Container maxWidth="md">
      <Box display="flex" flexDirection="column" gap={3} mt={4}>
        <Typography variant="h4" gutterBottom>Admin Panel</Typography>
        {loading ? (
          <Backdrop open={loading}>
            <CircularProgress color="inherit" />
          </Backdrop>
        ) : (
          <List>
            {Object.entries(questionnaires).map(([category, docs]) => (
              <Box key={category} mb={2}>
                <Typography variant="h6" gutterBottom>
                  {category.replace('O4S-ai-', '')}
                </Typography>
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
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </List>
        )}
      </Box>
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
