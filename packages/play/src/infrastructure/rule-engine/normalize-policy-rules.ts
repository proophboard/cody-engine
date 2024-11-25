import {
  AnyRule, isCountInformation, isDeleteInformation, isFindInformation,
  isInsertInformation, isReplaceInformation, isTriggerCommand, isUpdateInformation,
  isUpsertInformation
} from "@app/shared/rule-engine/configuration";
import {visitRulesThen} from "@cody-engine/cody/hooks/rule-engine/visit-rule-then";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";
import {normalizeCommandName} from "@cody-play/infrastructure/rule-engine/normalize-command-name";
import {CodyPlayConfig} from "@cody-play/state/config-store";

export const normalizePolicyRules = (rules: AnyRule[], service: string, config: CodyPlayConfig): AnyRule[] => {
  return visitRulesThen(rules, then => {
    if(isTriggerCommand(then)) {
      return {
        trigger: {
          ...then.trigger,
          command: normalizeCommandName(then.trigger.command, service)
        }
      }
    }

    if(isFindInformation(then)) {
      return {
        find: {
          ...then.find,
          information: playGetVoRuntimeInfoFromDataReference(then.find.information, service, config.types).desc.name
        }
      }
    }

    if(isCountInformation(then)) {
      return {
        count: {
          ...then.count,
          information: playGetVoRuntimeInfoFromDataReference(then.count.information, service, config.types).desc.name
        }
      }
    }

    if(isInsertInformation(then)) {
      return {
        insert: {...then.insert, information: playGetVoRuntimeInfoFromDataReference(then.insert.information, service, config.types).desc.name}
      }
    }

    if(isUpsertInformation(then)) {
      return {
        upsert: {...then.upsert, information: playGetVoRuntimeInfoFromDataReference(then.upsert.information, service, config.types).desc.name}
      }
    }

    if(isUpdateInformation(then)) {
      return {
        update: {...then.update, information: playGetVoRuntimeInfoFromDataReference(then.update.information, service, config.types).desc.name}
      }
    }

    if(isReplaceInformation(then)) {
      return {
        replace: {...then.replace, information: playGetVoRuntimeInfoFromDataReference(then.replace.information, service, config.types).desc.name}
      }
    }

    if(isDeleteInformation(then)) {
      return {
        delete: {...then.delete, information: playGetVoRuntimeInfoFromDataReference(then.delete.information, service, config.types).desc.name}
      }
    }

    return then;
  })
}
