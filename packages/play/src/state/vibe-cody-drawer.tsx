import {createContext, PropsWithChildren, useState} from "react";
import {FocusedElement} from "@cody-play/state/focused-element";

type VCCtx = {
  open: boolean;
  setOpen: (open: boolean) => void;
  focusedElement?: FocusedElement;
  focusElement: (ele: FocusedElement | undefined) => void;
}

let globallyStoredFocusedEle: FocusedElement | undefined;

export const VibeCodyContext = createContext<VCCtx>({
  open: false,
  setOpen: (open: boolean) => {},
  focusedElement: globallyStoredFocusedEle,
  focusElement: (ele: FocusedElement | undefined) => {},
});

const {Provider} = VibeCodyContext;

const PlayVibeCodyDrawerProvider = (props: PropsWithChildren) => {
  const [open, setOpen] = useState(false);
  const [focusedElement, setFocusedElement] = useState<FocusedElement | undefined>(globallyStoredFocusedEle);

  const focusElement = (ele: FocusedElement | undefined) => {
    setFocusedElement(ele);
    globallyStoredFocusedEle = ele;
  }

  return <Provider value={{open, setOpen, focusedElement, focusElement}}>{props.children}</Provider>
}

export default PlayVibeCodyDrawerProvider;
