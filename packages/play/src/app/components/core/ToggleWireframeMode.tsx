import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { useThemeMode } from '@cody-play/hooks/useThemeMode';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';

/**
 * Toggle button to switch between default MUI theme and wireframe (lo-fi) theme.
 *
 * Shows a palette icon for default theme and a draw/pencil icon for wireframe theme.
 */
export function ToggleWireframeMode() {
  const { themeMode, toggleThemeMode } = useThemeMode();
  const theme = useTheme();

  const isWireframe = themeMode === 'wireframe';

  return (
    <Tooltip title={isWireframe ? 'Switch to Default Theme' : 'Switch to Wireframe Theme'}>
      <IconButton
        onClick={toggleThemeMode}
        aria-label={isWireframe ? 'Switch to default theme' : 'Switch to wireframe theme'}
        sx={{ color: theme.palette.primary.contrastText }}
      >
        {isWireframe ? <DrawOutlinedIcon /> : <PaletteOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}

export default ToggleWireframeMode;
