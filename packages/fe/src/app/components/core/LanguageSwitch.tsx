import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardArrowDownOutlined, KeyboardArrowUpOutlined, PublicOutlined } from '@mui/icons-material';
import Check from '@mui/icons-material/Check';
import { CURRENT_LANGUAGE } from '@frontend/i18n/config';

const LanguageSwitch = (props: {color?: string}) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const [allAvailableLanguages, setAllAvailableLanguages] = useState<string[]>(
    []
  );

  useEffect(() => {
    const availableLanguages = [...i18n.languages];
    setAllAvailableLanguages(availableLanguages);
  }, []);

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (language: string) => {
    i18n.changeLanguage(language).then(() => {
      localStorage.setItem(CURRENT_LANGUAGE, language);
      handleClose();
    });
  };

  const createLanguageMenuItems = () =>
    allAvailableLanguages.map((language) => (
      <MenuItem key={language} onClick={() => handleMenuItemClick(language)}>
        {i18n.resolvedLanguage === language && (
          <ListItemIcon>
            <Check color="primary" />
          </ListItemIcon>
        )}
        <ListItemText
          inset={i18n.resolvedLanguage !== language}
          sx={{
            color:
              i18n.resolvedLanguage === language ? 'primary.main' : 'inherit',
            '& .MuiTypography-root': {
              fontWeight: i18n.resolvedLanguage === language ? 600 : 400,
            },
          }}
        >
          {language.toUpperCase()}
        </ListItemText>
      </MenuItem>
    ));

  return (
    <Box>
      <Button
        id="language-switch-button"
        aria-controls={open ? 'language-switch-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{color: props.color}}
        startIcon={<PublicOutlined />}
        endIcon={open ? <KeyboardArrowUpOutlined /> : <KeyboardArrowDownOutlined />}
        onClick={handleButtonClick}
      >
        {(i18n.resolvedLanguage || '').toUpperCase()}
      </Button>
      <Menu
        id="language-switch-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-switch-button',
        }}
      >
        {createLanguageMenuItems()}
      </Menu>
    </Box>
  );
};

export default LanguageSwitch;
