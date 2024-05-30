import React from 'react';
import CoreWelcome from '@frontend/app/components/core/welcome';
import Questionnaire from '@frontend/app/components/core/weboranger/questionnaire';
import Adminpanel from '@frontend/app/components/core/weboranger/Adminpanel';

export type ViewRegistry = {
  [valueObjectName: string]: React.FunctionComponent<any>;
};

export const views: ViewRegistry = {
  'Core.Welcome': CoreWelcome,
  'Core.Questions': Questionnaire,
  'Core.Adminpanel': Adminpanel
};
