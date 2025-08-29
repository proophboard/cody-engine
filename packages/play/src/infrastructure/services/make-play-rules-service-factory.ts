import {PlayServiceConfig, PlayServiceRules} from "@cody-play/state/types";
import {makeAsyncExecutable, makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {get} from "lodash";
import {
  INFORMATION_SERVICE_NAME,
  InformationService
} from "@event-engine/infrastructure/information-service/information-service";

export const makePlayRulesServiceFactory = (name: string, config: PlayServiceConfig, infoServiceFactory: (options: Record<string, any>) => InformationService): (options?: any) => any => {
  return (options?: any): any => {
    if(config.func) {
      return makeCallable(config.func, infoServiceFactory, options);
    } else if (config.methods) {
      const service: Record<string, any> = {};

      for (const method in config.methods) {
        service[method] = makeCallable(config.methods[method], infoServiceFactory, options);
      }

      return service;
    }

    throw new Error(`Invalid service config given for service "${name}". Either "func" or "methods" config needs to be set!`);
  }
}

const makeCallable = (rules: PlayServiceRules, infoServiceFactory: (options: Record<string, any>) => InformationService, options?: any): (...args: any[]) => any => {
  if(rules.async) {
    return async (...args: any[]) => {
      const ctx = {args, options, [INFORMATION_SERVICE_NAME]: infoServiceFactory(options)};

      const exec = makeAsyncExecutable(rules.rules);

      const result = await exec(ctx);

      return get(result, 'result');
    }
  } else {
    return (...args: any[]) => {
      const ctx = {args, options, [INFORMATION_SERVICE_NAME]: infoServiceFactory(options)};

      const exec = makeSyncExecutable(rules.rules);

      const result = exec(ctx);

      return get(result, 'result');
    }
  }
}
