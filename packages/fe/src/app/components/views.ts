import React from "react";

export type ViewRegistry = {[valueObjectName: string]: React.FunctionComponent}

export const views: ViewRegistry = {};
