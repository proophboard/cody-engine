import { ReactNode, useContext, useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box, Collapse, IconButton, useTheme } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Target } from 'mdi-material-ui';
import { useVibeCodyFocusElement } from '@cody-play/hooks/use-vibe-cody';
import { FocusedElement } from '@cody-play/state/focused-element';
import { DragAndDropContext } from '@cody-play/app/providers/DragAndDrop';

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
  const { activeElementId, transformValue, setTransformValue } =
    useContext(DragAndDropContext);
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
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey['800'] : theme.palette.grey['200'],
    padding: '0.25rem',
    cursor: 'move',
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : transformValue && activeElementId === id
      ? `translate3d(${transformValue.x}px, ${transformValue.y}px, 0)`
      : 'none',
    zIndex: transform ? theme.zIndex.drawer + 1 : 'auto',
  };

  useEffect(() => {
    if (transform) {
      setTransformValue(transform);
    }
  }, [JSON.stringify(transform)]);

  const isFocusedEle =
    focusableElement && focusedEle && focusableElement.id === focusedEle.id;

  return (
    <>
      {!isDragDropEnabled ? (
        children
      ) : (
        <Box
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          sx={sx}
          onMouseEnter={(e) => {
            console.log("setShowTarget");
            setShowTarget(true)
          }}
          onMouseLeave={(e) => {
            console.log("setShowTarget");
            setShowTarget(false)
          }}
        >
          <Box flex={1} className="children-wrapper">
            {children}
          </Box>
          {focusableElement && (
            <Collapse
              orientation={'horizontal'}
              in={showTarget || isFocusedEle}
            >
              <IconButton
                onClick={(e) => {
                    setFocusedEle(isFocusedEle ? undefined : focusableElement)
                  }
                }
                color={isFocusedEle ? 'info' : undefined}
              >
                <Target />
              </IconButton>
            </Collapse>
          )}
          <DragIndicatorIcon />
        </Box>
      )}
    </>
  );
};

export default PlayDraggable;
