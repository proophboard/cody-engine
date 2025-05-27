import { useDroppable } from '@dnd-kit/core';
import { Box, useTheme } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { EDropzoneId } from '@cody-play/app/types/enums/EDropzoneId';

type TContentPosition = 'left' | 'center' | 'right';
type TJustifyContent = 'flex-start' | 'center' | 'flex-end';

export type TPlayDroppable = {
  id: EDropzoneId;
  isDragDropEnabled: boolean;
  children: ReactNode;
  contentPosition?: TContentPosition;
};

const PlayDroppable = ({
  id,
  isDragDropEnabled,
  children,
  contentPosition = 'left',
}: TPlayDroppable) => {
  const theme = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  const [justifyContent, setJustifyContent] =
    useState<TJustifyContent>('flex-start');
  const sx = {
    display: 'flex',
    flexFlow: 'nowrap',
    alignItems: 'center',
    justifyContent,
    gap: theme.spacing(1),
    width: '100%',
    minHeight: '3.5rem',
    padding: theme.spacing(0.5),
    borderWidth: '2px',
    borderStyle: 'dotted',
    borderColor: theme.palette.grey['400'],
    borderRadius: '0.25rem',
    backgroundColor: isOver
      ? theme.palette.mode === 'dark' ? theme.palette.grey['700'] : theme.palette.grey['100']
      : theme.palette.mode === 'dark' ? theme.palette.grey['600'] :theme.palette.grey['50'],
  };

  useEffect(() => {
    let position: TJustifyContent = 'flex-start';

    if (contentPosition === 'center') {
      position = 'center';
    } else if (contentPosition === 'right') {
      position = 'flex-end';
    }

    setJustifyContent(position);
  }, [contentPosition]);

  return (
    <>
      {!isDragDropEnabled ? (
        children
      ) : (
        <Box ref={setNodeRef} sx={sx}>
          {children}
        </Box>
      )}
    </>
  );
};

export default PlayDroppable;
