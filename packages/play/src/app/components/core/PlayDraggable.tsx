import { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box, useTheme } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

type TPlayDraggable = {
  id: string;
  isDragDropEnabled: boolean;
  children: ReactNode;
  data?: Record<string, any>;
};

const PlayDraggable = ({
  id,
  isDragDropEnabled,
  data,
  children,
}: TPlayDraggable) => {
  const theme = useTheme();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data,
  });
  const sx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    borderRadius: '0.25rem',
    backgroundColor: theme.palette.grey['400'],
    padding: '0.25rem',
    cursor: 'move',
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : 'none',
    zIndex: transform ? theme.zIndex.drawer + 1 : 'auto',
    '.children-wrapper button': {
      pointerEvents: 'none',
    },
  };

  return (
    <>
      {!isDragDropEnabled ? (
        children
      ) : (
        <Box ref={setNodeRef} {...listeners} {...attributes} sx={sx}>
          <Box flex={1} className="children-wrapper">
            {children}
          </Box>
          <DragIndicatorIcon />
        </Box>
      )}
    </>
  );
};

export default PlayDraggable;
