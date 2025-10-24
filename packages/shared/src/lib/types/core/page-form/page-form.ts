import {JSONSchema7} from "json-schema";
import React from 'react';

export type PageFormReference = {
  getData: () => {[prop: string]: any},
  useSchema: (schema: JSONSchema7) => void,
  validate: () => Promise<boolean>,
  markAsSubmitted: () => void,
  cancel: () => void,
  displayError: (errorComponent: React.JSX.Element) => void,
}

export type PageFormRegistry = Record<string, PageFormReference>;

export type AddPageFormReference = (name: string, form: PageFormReference) => void;

