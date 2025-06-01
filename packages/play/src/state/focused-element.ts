import {Action, ActionContainerInfo} from "@frontend/app/components/core/form/types/action";

export type FocusedElementType = 'appName' | 'button' | 'pageTitle'
  | 'sidebarItem' | 'sidebarItemGroup' | 'tab' | 'breadcrumb'
  | 'table' | 'tableColumn'
  | 'viewTitle' | 'stateView' | 'formView' | 'formViewInput' | 'formViewObject' | 'formViewList'
  | 'commandForm' | 'commandFormInput' | 'commandFormObject' | 'commandFormList';

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

export interface FocusedSidebarItem extends FocusedElement {
  pageName: string;
}

export const isFocusedSidebarItem = (element: FocusedElement): element is FocusedSidebarItem => {
  return element.type === "sidebarItem";
}


