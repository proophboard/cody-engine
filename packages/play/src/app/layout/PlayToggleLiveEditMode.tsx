import { createContext, ReactNode, useMemo, useState } from 'react';

type TToggleLiveEditMode = {
  children: ReactNode;
};

let isLiveEditMode = false;

export const LiveEditModeContext = createContext({
  liveEditMode: isLiveEditMode,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleLiveEditMode: (open: boolean) => {},
});

const PlayToggleLiveEditMode = ({ children }: TToggleLiveEditMode) => {
  const [liveEditMode, setLiveEditMode] = useState<boolean>(isLiveEditMode);
  const liveEditModeContextValue = useMemo(
    () => ({
      liveEditMode,
      toggleLiveEditMode: (liveEdit: boolean) => {
        setLiveEditMode(liveEdit);
        isLiveEditMode = liveEdit;
      },
    }),
    [liveEditMode]
  );

  return (
    <LiveEditModeContext.Provider value={liveEditModeContextValue}>
      {children}
    </LiveEditModeContext.Provider>
  );
};

export default PlayToggleLiveEditMode;
