import React from "react";
import {views as viewComponents} from "@frontend/app/components/views";
import {views as overwriteViewComponents} from "@frontend/extensions/app/components/views";
export const loadViewComponent = (valueObjectName: string): React.FunctionComponent<any> => {
  if(overwriteViewComponents[valueObjectName]) {

    return overwriteViewComponents[valueObjectName];
  }

  if(viewComponents[valueObjectName]) {

    return viewComponents[valueObjectName];
  }

  throw new Error(`No view component registered for value object: "${valueObjectName}". Please check the registry file: packages/fe/src/app/components/views.ts!`);
}
