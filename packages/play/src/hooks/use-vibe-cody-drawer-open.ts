import {useContext} from "react";
import {openContext} from "@cody-play/state/vibe-cody-drawer";

export const useVibeCodyDrawerOpen = (): [boolean, (open: boolean) => void] => {
  const {open, setOpen} = useContext(openContext);

  return [open, setOpen];
}
