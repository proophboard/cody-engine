import {useContext} from "react";
import {VibeCodyAiCtx} from "@cody-play/state/vibe-cody-ai";

export const useVibeCodyAi = (): [boolean, (active: boolean) => void] => {
  const {active, setActive} = useContext(VibeCodyAiCtx);

  return [active, setActive];
}
