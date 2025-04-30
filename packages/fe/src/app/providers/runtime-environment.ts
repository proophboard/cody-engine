import {PageRegistry} from "@frontend/app/pages";

export type RuntimeEnvironment = {
  UI_ENV: 'play' | 'dev' | 'test' | 'prod',
  DEFAULT_SERVICE: string,
  PAGES: PageRegistry
};
