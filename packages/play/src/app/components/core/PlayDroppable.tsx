import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, useTheme } from '@mui/material';

export type TPlayDroppable = {
  id: string;
  children: ReactNode;
};

const PlayDroppable = ({ id, children }: TPlayDroppable) => {
  const theme = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  // TODO update styling
  const sx = {
    borderWidth: '2px',
    borderStyle: 'dotted',
    borderColor: theme.palette.grey['500'],
    backgroundColor: isOver ? 'green' : 'red',
  };

  return (
    <Box ref={setNodeRef} sx={sx}>
      {children}
    </Box>
  );
};

export default PlayDroppable;
