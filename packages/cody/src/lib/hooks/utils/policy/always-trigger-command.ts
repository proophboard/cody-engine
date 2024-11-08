import {AlwaysRule} from "@cody-engine/cody/hooks/rule-engine/configuration";

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
