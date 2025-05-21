import { createContext, ReactNode, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  PointerSensor,
  DragMoveEvent,
} from '@dnd-kit/core';

type TTransform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

type TDragAndDrop = {
  children: ReactNode;
};

type TDragAndDropContext = {
  dndEvent: DragEndEvent | null;
  activeElementId: string;
  transformValue: TTransform | null;
  setTransformValue: (newValue: TTransform | null) => void;
};

export const DragAndDropContext = createContext<TDragAndDropContext>({
  dndEvent: null,
  activeElementId: '',
  transformValue: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTransformValue: (newValue: TTransform | null) => {},
});

const DragAndDrop = ({ children }: TDragAndDrop) => {
  const [dndEvent, setDndEvent] = useState<DragEndEvent | null>(null);
  const [transformValue, setNewTransformValue] = useState<TTransform | null>(
    null
  );
  const [activeElementId, setActiveElementId] = useState<string>('');
  const dnd = useMemo(
    () => ({
      dndEvent,
      activeElementId,
      transformValue,
      setTransformValue: setNewTransformValue,
    }),
    [dndEvent, activeElementId, transformValue]
  );

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);

  const sensors = useSensors(
    mouseSensor,
    touchSensor,
    pointerSensor
  );

  const handleDragMove = (event: DragMoveEvent) => {
    const { active } = event;
    const { id } = active;
    if (id !== activeElementId) {
      setActiveElementId((id as string) ?? '');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDndEvent(event);
  };

  return (
    <DragAndDropContext.Provider value={dnd}>
      <DndContext
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        {children}
      </DndContext>
    </DragAndDropContext.Provider>
  );
};

export default DragAndDrop;
