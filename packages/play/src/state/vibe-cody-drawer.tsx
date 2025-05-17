import {createContext, PropsWithChildren, useState} from "react";
import {Action} from "@frontend/app/components/core/form/types/action";

type VCCtx = {
  open: boolean;
  setOpen: (open: boolean) => void;
  focusedElement?: FocusedElement;
  focusElement: (ele: FocusedElement | undefined) => void;
}

export type FocusedElementType = 'button' | 'sidebarItem' | 'tab' | 'breadcrumb'
  | 'table' | 'tableColumn' | 'stateView' | 'formView' | 'formViewInput' | 'formViewObject' | 'formViewArray'
  | 'commandForm' | 'commandFormInput' | 'commandFormObject' | 'commandFormArray';

export interface FocusedElement {
  id: string;
  name: string;
  type: FocusedElementType;
}

export interface FocusedButton extends FocusedElement {
  action: Action;

}

export const VibeCodyContext = createContext<VCCtx>({
  open: false,
  setOpen: (open: boolean) => {},
  focusElement: (ele: FocusedElement | undefined) => {},
});

const {Provider} = VibeCodyContext;

const PlayVibeCodyDrawerProvider = (props: PropsWithChildren) => {
  const [open, setOpen] = useState(false);
  const [focusedElement, focusElement] = useState<FocusedElement | undefined>();

  return <Provider value={{open, setOpen, focusedElement, focusElement}}>{props.children}</Provider>
}

export default PlayVibeCodyDrawerProvider;
