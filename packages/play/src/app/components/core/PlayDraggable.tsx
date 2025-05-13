import { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box } from '@mui/material';

type TPlayDraggable = {
  id: string;
  isDragDropEnabled: boolean;
  children: ReactNode;
};

const PlayDraggable = ({ id, isDragDropEnabled, children }: TPlayDraggable) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });

  return (
    <>
      {!isDragDropEnabled ? (
        children
      ) : (
        <Box ref={setNodeRef} {...listeners} {...attributes}>
          {children}
        </Box>
      )}
    </>
  );
};

export default PlayDraggable;
