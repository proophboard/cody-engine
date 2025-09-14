import {createContext, PropsWithChildren, useState} from "react";

/**
 * When a user starts a session on vibe-cody.ai they get redirected to
 * play.prooph-board.com/new-vibe-cody-app
 *
 * This endpoint will set up an empty playshot with a random board id
 * and set the origin of the INIT_PLAYSHOT action to: "vibe-cody.ai",
 * which tells the config store to activate "VibeCodyAi-Mode"
 *
 * In this mode, playshots are not synced to prooph board but instead stored
 * in a public playshot store. Users can revisit and share a link that contains
 * the random board id + either "latest" or a specific playshot id.
 *
 * The endpoint matching the link will fetch the (latest) playshot from the store and
 * initializes the playshot again using the origin: vibe-cody.ai
 */

type VibeCodyAiCtx = {
  active: boolean;
  setActive: (active: boolean) => void;
}

const SESSION_STORAGE_KEY = 'vibe_cody_ai_mode';

const isActive = !!sessionStorage.getItem(SESSION_STORAGE_KEY);

export const VibeCodyAiCtx = createContext<VibeCodyAiCtx>({
  active: isActive,
  setActive: (active: boolean) => {}
});

const {Provider} = VibeCodyAiCtx;

const VibeCodyAiProvider = (props: PropsWithChildren) => {
  const [active, setActive] = useState(isActive);

  const handleSetActive = (changedActive: boolean) => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, changedActive ? '1' : '');
    setActive(changedActive);
  }

  return <Provider value={{active, setActive: handleSetActive}}>{props.children}</Provider>
}

export default VibeCodyAiProvider;
