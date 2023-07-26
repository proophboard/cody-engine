import React from "react";
import {views as viewComponents} from "@frontend/app/components/views";
import {views as overwriteViewComponents} from "@frontend/extensions/app/components/views";
export const loadViewComponent = (viewName: string): React.FunctionComponent<any> => {
  if(overwriteViewComponents[viewName]) {

    return overwriteViewComponents[viewName];
  }

  if(viewComponents[viewName]) {

    return viewComponents[viewName];
  }

  throw new Error(`No view component registered for value object: "${viewName}". Please check the registry file: packages/fe/src/app/components/views.ts!`);
}
