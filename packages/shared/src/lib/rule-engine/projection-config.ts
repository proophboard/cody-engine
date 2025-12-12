import {
  AnyRule,
  isDeleteInformation, isExecuteRules, isForEach,
  isInsertInformation, isReplaceInformation, isUpdateInformation,
  isUpsertInformation,
  Rule,
  ThenType
} from "@app/shared/rule-engine/configuration";

const cloneDeepJSON = <T>(val: T): T => {
  return JSON.parse(JSON.stringify(val));
}

export interface ProjectionConfig {
  name: string,
  live: boolean,
  cases: ProjectionConfigCase[]
}

export interface ProjectionConfigCase {
  given?: Rule[],
  when: string,
  then: ThenType,
}

export const normalizeProjectionConfig = (config: ProjectionConfig, informationFQCN: string): ProjectionConfig => {
  const modifiedConfig = cloneDeepJSON(config);

  if(!modifiedConfig.cases) {
    modifiedConfig.cases = [];
  }

  modifiedConfig.cases.forEach(prjCase => {
    if(isInsertInformation(prjCase.then)) {
      prjCase.then.insert.information = informationFQCN;
    }

    if(isUpsertInformation(prjCase.then)) {
      prjCase.then.upsert.information = informationFQCN;
    }

    if(isUpdateInformation(prjCase.then)) {
      prjCase.then.update.information = informationFQCN;
    }

    if(isReplaceInformation(prjCase.then)) {
      prjCase.then.replace.information = informationFQCN;
    }

    if(isDeleteInformation(prjCase.then)) {
      prjCase.then.delete.information = informationFQCN;
    }

    if(isExecuteRules(prjCase.then)) {
      prjCase.then.execute.rules = normalizeProjectionConfig({
        cases: prjCase.then.execute.rules as unknown as ProjectionConfigCase[],
        name: informationFQCN,
        live: true
      }, informationFQCN).cases as unknown as Rule[];
    }

    if(isForEach(prjCase.then)) {
      prjCase.then.forEach.then = normalizeProjectionConfig({
        cases: [{then: prjCase.then.forEach.then}] as unknown as ProjectionConfigCase[],
        name: informationFQCN,
        live: true
      }, informationFQCN).cases[0].then as unknown as ThenType;
    }
  })

  modifiedConfig.name = config.name || informationFQCN;

  if(typeof config.live === "undefined") {
    modifiedConfig.live = true;
  }

  return modifiedConfig;
}

export const convertProjectionConfigCaseToRules = (config: ProjectionConfigCase): Rule[] => {
  const rules: AnyRule[] = [];

  if(config.given) {
    rules.push(...config.given);
  }

  rules.push({
    rule: "always",
    then: config.then
  });

  return rules;
}
