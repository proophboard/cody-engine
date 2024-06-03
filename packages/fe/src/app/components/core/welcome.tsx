import {environment} from "@frontend/environments/environment";
import {Flash} from "mdi-material-ui";
import PrototypeMode from "@frontend/app/components/core/prototype/PrototypeMode";
import {Link} from "@mui/material";
import { useContext, useEffect } from "react";
import { ThemeContext } from '../../providers/ToggleColorMode';

const Welcome = (props: {}) => {
  const { applyTheme } = useContext(ThemeContext);
  
  useEffect(() => {
    fetchCurrentTheme();
  }, []);

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
  return <>
    <h1>Welcome to {environment.appName}</h1>
    <p><Flash sx={{color: '#f5e339'}} />This application is powered by <Link href="https://github.com/proophboard/cody-engine">Cody Engine</Link><Flash sx={{color: '#f5e339'}} /></p>
    {environment.mode === 'prototype' && <PrototypeMode />}
  </>
}

export default Welcome;
