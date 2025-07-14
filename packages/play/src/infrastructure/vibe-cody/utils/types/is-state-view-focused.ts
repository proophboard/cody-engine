import {FocusedElement} from "@cody-play/state/focused-element";

export const isStateViewFocused = (focusedElement?: FocusedElement): boolean => {
  if(!focusedElement) {
    return false;
  }

  return focusedElement.type === "stateView";
}
