import {createContext, PropsWithChildren, useState} from "react";
import {environment} from "@cody-play/environments/environment";

/**
 * In VibeCodyAi-Mode, playshots are not synced to prooph board but instead exported
 * as playshot.json file. Users can reimport a playshot on the weclome page.
 */

type VibeCodyAiCtx = {
  active: boolean;
  setActive: (active: boolean) => void;
}

const isActive = environment.vibeCodyAI || false;

export const VibeCodyAiCtx = createContext<VibeCodyAiCtx>({
  active: isActive,
  setActive: (active: boolean) => {}
});

const {Provider} = VibeCodyAiCtx;

const VibeCodyAiProvider = (props: PropsWithChildren) => {
  const [active, setActive] = useState(isActive);

  const handleSetActive = (changedActive: boolean) => {
    setActive(changedActive);
  }

  return <Provider value={{active, setActive: handleSetActive}}>{props.children}</Provider>
}

export default VibeCodyAiProvider;
