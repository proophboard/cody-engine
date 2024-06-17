import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

const Examplefeature = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: any, newValue: any) => {
    setValue(newValue);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Grid container spacing={3} style={{ padding: 24 }}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Item One" />
            <Tab label="Item Two" />
            <Tab label="Item Three" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            {value === 0 && <Typography>Item One</Typography>}
            {value === 1 && <Typography>Item Two</Typography>}
            {value === 2 && <Typography>Item Three</Typography>}
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Statistics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Some statistics about the application.
              </Typography>
              <Button variant="contained" color="primary" style={{ marginTop: 16 }}>
                Learn More
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                User Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Actions performed by users.
              </Typography>
              <Button variant="contained" color="secondary" style={{ marginTop: 16 }}>
                See Details
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { id: 1, name: 'John Doe', role: 'Admin' },
                  { id: 2, name: 'Jane Smith', role: 'User' },
                  { id: 3, name: 'Sara Wilson', role: 'Manager' },
                ].map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
          />
          <FormControlLabel
            control={<Checkbox name="checkedA" />}
            label="Check me"
          />
          <FormControlLabel
            control={<Switch name="checkedB" />}
            label="Toggle me"
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default Examplefeature;
