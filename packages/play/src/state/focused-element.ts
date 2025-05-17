import {Action, ActionContainerInfo} from "@frontend/app/components/core/form/types/action";

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
  containerInfo: ActionContainerInfo;
}

export const isFocusedButton = (element: FocusedElement): element is FocusedButton => {
  return element.type === "button"
}

