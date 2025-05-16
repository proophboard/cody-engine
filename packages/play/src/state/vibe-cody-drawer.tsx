import {createContext, PropsWithChildren, useState} from "react";

export const openContext = createContext({open: false, setOpen: (open: boolean) => {}});

const {Provider} = openContext;

const PlayVibeCodyDrawerProvider = (props: PropsWithChildren) => {
  const [open, setOpen] = useState(false);

  return <Provider value={{open, setOpen}}>{props.children}</Provider>
}

export default PlayVibeCodyDrawerProvider;
