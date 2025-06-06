import {useContext} from "react";
import {VibeCodyContext} from "@cody-play/state/vibe-cody-drawer";
import {FocusedElement} from "@cody-play/state/focused-element";

export const useVibeCodyOpen = (): [boolean, (open: boolean) => void] => {
  const {open, setOpen} = useContext(VibeCodyContext);

  return [open, setOpen];
}

export const useVibeCodyFocusElement = (): [FocusedElement | undefined, (ele: FocusedElement | undefined) => void] => {
  const {focusedElement, focusElement} = useContext(VibeCodyContext);

  return [focusedElement, focusElement];
}
