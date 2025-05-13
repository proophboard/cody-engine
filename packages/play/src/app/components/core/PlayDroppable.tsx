import { useDroppable } from '@dnd-kit/core';
import { Box, useTheme } from '@mui/material';

export type TPlayDroppable = {
  id: string;
};

const PlayDroppable = ({ id }: TPlayDroppable) => {
  const theme = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  // TODO update styling
  const sx = {
    height: '2.25rem',
    borderWidth: '3px',
    borderStyle: 'dotted',
    borderColor: theme.palette.grey['500'],
    backgroundColor: isOver
      ? theme.palette.grey['400']
      : theme.palette.grey['200'],
  };

  return <Box ref={setNodeRef} sx={sx} />;
};

export default PlayDroppable;
