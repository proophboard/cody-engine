import React from 'react';
import CoreWelcome from '@frontend/app/components/core/welcome';
import Questionnaire from '@frontend/app/components/core/questionnaire/questionnaire';

export type ViewRegistry = {
  [valueObjectName: string]: React.FunctionComponent<any>;
};

export const views: ViewRegistry = {
  'Core.Welcome': CoreWelcome,
  'Core.Questions': Questionnaire,
};
