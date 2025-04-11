import {JSONSchema7} from "json-schema";

export type PageFormReference = {
  getData: () => {[prop: string]: any},
  useSchema: (schema: JSONSchema7) => void,
  validate: () => boolean,
  markAsSubmitted: () => void,
  displayError: (errorComponent: JSX.Element) => void,
}

export type PageFormRegistry = Record<string, PageFormReference>;

export type AddPageFormReference = (name: string, form: PageFormReference) => void;

