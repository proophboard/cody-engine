import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Paper, Typography, Stack } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';

interface FileDropzoneProps {
  onFileImport: (content: string, fileName: string) => void;
}

export function FileDropzone({ onFileImport }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileImport(content, file.name);
      };

      reader.readAsText(file);
    }
  }, [onFileImport]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.light',
          bgcolor: 'action.hover',
        },
      }}
    >
      <input {...getInputProps()} />

      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isDragActive ? 'primary.light' : 'action.hover',
              transition: 'all 0.2s',
            }}
          >
            {isDragActive ? (
              <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            ) : (
              <DescriptionIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            )}
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop your playshot file here' : 'Import Playshot File'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drag and drop a playshot file here, or click to browse
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              px: 3,
              py: 1,
              bgcolor: 'action.selected',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Supported format: .json
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Paper>
  );
}
