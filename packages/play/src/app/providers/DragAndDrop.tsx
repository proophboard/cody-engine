import { createContext, ReactNode, useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

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

  const handleDragEnd = (event: DragEndEvent) => {
    setDndEvent(event);
  };

  return (
    <DragAndDropContext.Provider value={dnd}>
      <DndContext onDragEnd={handleDragEnd}>{children}</DndContext>
    </DragAndDropContext.Provider>
  );
};

export default DragAndDrop;
