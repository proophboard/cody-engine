import {PlayServiceConfig, PlayServiceRules} from "@cody-play/state/types";
import {makeAsyncExecutable, makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {get} from "lodash";

export const makePlayRulesServiceFactory = (name: string, config: PlayServiceConfig): (options?: any) => any => {
  return (options?: any): any => {
    if(config.func) {
      return makeCallable(config.func, options);
    } else if (config.methods) {
      const service: Record<string, any> = {};

      for (const method in config.methods) {
        service[method] = makeCallable(config.methods[method], options);
      }

      return service;
    }

    throw new Error(`Invalid service config given for service "${name}". Either "func" or "methods" config needs to be set!`);
  }
}

const makeCallable = (rules: PlayServiceRules, options?: any): (...args: any[]) => any => {
  if(rules.async) {
    return async (...args: any[]) => {
      const ctx = {args, options};

      const exec = makeAsyncExecutable(rules.rules);

      const result = await exec(ctx);

      return get(result, 'result');
    }
  } else {
    return (...args: any[]) => {
      const ctx = {args, options};

      const exec = makeSyncExecutable(rules.rules);

      const result = exec(ctx);

      return get(result, 'result');
    }
  }
}
