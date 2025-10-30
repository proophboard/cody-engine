// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

import {CodyEngineMode} from "@app/shared/types/core/cody/cody-engine-mode";

export const environment = {
  production: true,
  mode: 'prototype' as CodyEngineMode,
  vibeCodyAI: true,
};
