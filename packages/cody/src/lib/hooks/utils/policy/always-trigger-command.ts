import {AlwaysRule} from "@app/shared/rule-engine/configuration";

export const alwaysTriggerCommand = (commandName: string): AlwaysRule => {
  return {
    rule: "always",
    then: {
      trigger: {
        command: commandName,
        mapping: 'event'
      }
    }
  }
}
