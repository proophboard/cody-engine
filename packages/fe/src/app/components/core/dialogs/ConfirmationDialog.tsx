import React, { ChangeEvent, ReactNode } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export type TConfirmationDialog = {
  open: boolean;
  onClose: () => void;
  title: string;
  onConfirmClick: (event?: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
  confirmButtonText?: string;
  abortButtonText?: string;
  confirmButtonDisabled?: boolean;
  confirmOnly?: boolean; // Optional prop to indicate if the dialog is confirm-only
};

const ConfirmationDialog = ({
  open,
  onClose,
  title,
  onConfirmClick,
  children,
  confirmButtonText,
  abortButtonText,
  confirmButtonDisabled = false,
  confirmOnly = false,
}: TConfirmationDialog) => {
  const { t } = useTranslation();

  const handleConfirmClick = () => {
    onConfirmClick();
    onClose();
  };

  return (
    <Box>
      <Dialog
        open={open}
        onClose={() => {
          if (confirmOnly) {
            onConfirmClick();
          }
          onClose();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 4,
            }}
          >
            {title && (
              <Typography variant="h1" color="primary" sx={{ flex: 1 }}>
                {title}
              </Typography>
            )}
            <IconButton
              aria-label="close"
              size="small"
              onClick={onClose}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: 1,
            }}
          >
            {children}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            padding: 4,
            justifyContent: confirmOnly ? 'flex-end' : 'space-between',
            gap: 1,
          }}
        >
          {!confirmOnly && (
            <Button variant="outlined" color="secondary" onClick={onClose}>
              {abortButtonText || t('common.cancel', 'Cancel')}
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleConfirmClick}
            disabled={confirmButtonDisabled}
          >
            {confirmButtonText || t('common.yes', 'Yes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfirmationDialog;
