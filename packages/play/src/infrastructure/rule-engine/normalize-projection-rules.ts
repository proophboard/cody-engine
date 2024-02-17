import {
  AnyRule, isCountInformation, isDeleteInformation, isFindInformation,
  isInsertInformation, isReplaceInformation, isUpdateInformation,
  isUpsertInformation
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {visitRulesThen} from "@cody-engine/cody/hooks/utils/rule-engine/visit-rule-then";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";

export const normalizeProjectionRules = (rules: AnyRule[], service: string, config: CodyPlayConfig): AnyRule[] => {
  return visitRulesThen(rules, then => {
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
