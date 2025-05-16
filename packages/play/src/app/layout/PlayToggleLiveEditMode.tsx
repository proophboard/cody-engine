import { createContext, ReactNode, useMemo, useState } from 'react';

type TToggleLiveEditMode = {
  children: ReactNode;
};

export const LiveEditModeContext = createContext({
  liveEditMode: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleLiveEditMode: (open: boolean) => {},
});

const PlayToggleLiveEditMode = ({ children }: TToggleLiveEditMode) => {
  const [liveEditMode, setLiveEditMode] = useState<boolean>(false);
  const liveEditModeContextValue = useMemo(
    () => ({
      liveEditMode,
      toggleLiveEditMode: setLiveEditMode,
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
