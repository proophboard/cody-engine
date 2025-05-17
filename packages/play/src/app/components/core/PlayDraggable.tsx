import {ReactNode, useState} from 'react';
import { useDraggable } from '@dnd-kit/core';
import {Box, Collapse, IconButton, useTheme} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {Target} from "mdi-material-ui";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {FocusedElement} from "@cody-play/state/vibe-cody-drawer";

type TPlayDraggable = {
  id: string;
  isDragDropEnabled: boolean;
  children: ReactNode;
  focusableElement?: FocusedElement;
  data?: Record<string, any>;
};

const PlayDraggable = ({
  id,
  isDragDropEnabled,
  focusableElement,
  data,
  children,
}: TPlayDraggable) => {
  const theme = useTheme();
  const [focusedEle, setFocusedEle] = useVibeCodyFocusElement();
  const [showTarget, setShowTarget] = useState(false);
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
  };

  const isFocusedEle = (focusableElement && focusedEle && focusableElement.id === focusedEle.id);

  return (
    <>
      {!isDragDropEnabled ? (
        children
      ) : (
        <Box ref={setNodeRef} {...listeners} {...attributes} sx={sx}
             onMouseEnter={e => setShowTarget(true)}
             onMouseLeave={e => setShowTarget(false)}
        >
          <Box flex={1} className="children-wrapper">
            {children}
          </Box>
          {focusableElement && <Collapse orientation={"horizontal"} in={showTarget || isFocusedEle}>
            <IconButton onClick={e => setFocusedEle(isFocusedEle ? undefined : focusableElement)}
                        color={isFocusedEle ? "info" : undefined}
            >
              <Target/>
            </IconButton>
          </Collapse>}
          <DragIndicatorIcon />
        </Box>
      )}
    </>
  );
};

export default PlayDraggable;
