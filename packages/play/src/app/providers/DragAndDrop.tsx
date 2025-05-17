import { createContext, ReactNode, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor, PointerSensor } from '@dnd-kit/core';

type TDragAndDrop = {
  children: ReactNode;
};

type TDragAndDropContext = {
  dndEvent: DragEndEvent | null;
};

export const DragAndDropContext = createContext<TDragAndDropContext>({
  dndEvent: null,
});

const DragAndDrop = ({ children }: TDragAndDrop) => {
  const [dndEvent, setDndEvent] = useState<DragEndEvent | null>(null);
  const dnd = useMemo(
    () => ({
      dndEvent,
    }),
    [dndEvent]
  );

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10
    }
  })
  const mouseSensor = useSensor(MouseSensor)
  const touchSensor = useSensor(TouchSensor)
  const keyboardSensor = useSensor(KeyboardSensor)

  const sensors = useSensors(
    mouseSensor,
    touchSensor,
    keyboardSensor,
    pointerSensor
  )

  const handleDragEnd = (event: DragEndEvent) => {
    setDndEvent(event);
  };

  return (
    <DragAndDropContext.Provider value={dnd}>
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>{children}</DndContext>
    </DragAndDropContext.Provider>
  );
};

export default DragAndDrop;
