import { useDroppable } from '@dnd-kit/core';
import { Box, useTheme } from '@mui/material';
import { ReactNode } from 'react';

export type TPlayDroppable = {
  id: string;
  children?: ReactNode;
};

const PlayDroppable = ({ id, children = undefined }: TPlayDroppable) => {
  const theme = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  const sx = {
    width: '100%',
    height: '3rem',
    borderWidth: '2px',
    borderStyle: 'dotted',
    borderColor: theme.palette.grey['500'],
    borderRadius: '0.25rem',
    backgroundColor: isOver
      ? theme.palette.grey['300']
      : theme.palette.grey['200'],
  };

  return (
    <Box ref={setNodeRef} sx={sx}>
      {children}
    </Box>
  );
};

export default PlayDroppable;
