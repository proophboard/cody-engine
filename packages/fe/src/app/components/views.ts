import React from 'react';
import CoreWelcome from '@frontend/app/components/core/welcome';
import Questions from '@frontend/app/components/core/questions';

export type ViewRegistry = {
  [valueObjectName: string]: React.FunctionComponent<any>;
};

export const views: ViewRegistry = {
  'Core.Welcome': CoreWelcome,
  'Core.Questions': Questions,
};
