import { createContext, ReactNode, useState } from 'react';

export const LiveEditModeContext = createContext({
  liveEditMode: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleLiveEditMode: () => {},
});

type TToggleLiveEditMode = {
  children: ReactNode;
};

const ToggleLiveEditMode = ({ children }: TToggleLiveEditMode) => {
  const [liveEditMode, setLiveEditMode] = useState<boolean>(false);
  const liveEditModeContextValue = {
    liveEditMode,
    toggleLiveEditMode: () => {
      setLiveEditMode((prevState) => !prevState);
    },
  };

  return (
    <LiveEditModeContext.Provider value={liveEditModeContextValue}>
      {children}
    </LiveEditModeContext.Provider>
  );
};

export default ToggleLiveEditMode;
