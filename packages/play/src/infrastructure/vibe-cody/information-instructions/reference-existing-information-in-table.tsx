import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {
  isTableWithEmptySchemaFocused
} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-with-empty-schema-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {JSONSchema7} from "json-schema";
import {
  playDefinitionIdFromFQCN,
  playNodeLabel
} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {DatabaseOutline, VectorLink} from "mdi-material-ui";
import * as React from "react";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {
  isQueryableStateDescription,
  QueryableNotStoredStateDescription, QueryableNotStoredStateListDescription, QueryableStateDescription,
  QueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {cloneConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {get, set} from "lodash";
import {findProjectionType} from "@cody-play/infrastructure/vibe-cody/utils/types/find-projection-type";

const TEXT = `Reference existing information `

const makeReferenceExistingInformation = (label: string, information: PlayInformationRuntimeInfo): Instruction => {
  return {
    text: `${TEXT} ${label}`,
    label,
    icon: <DatabaseOutline />,
    isActive: () => true,
    noInputNeeded: true,
    match: input => input.startsWith(`${TEXT} ${label}`),
    execute: withNavigateToProcessing(async (input, ctx, dispatch, config, navigateTo) => {
      const pageConfig = ctx.page.handle.page;

      const tableVO = getFocusedQueryableStateListVo(ctx.focusedElement, pageConfig, config);

      if(playIsCodyError(tableVO)) {
        return tableVO;
      }

      const orgProjectionVO = findProjectionType(information, config);

      const oldItemFQCN = (tableVO.desc as QueryableStateListDescription).itemType;

      const newConfig = cloneConfig(config);

      // Delete old item type (we assume it's the empty default created by Vibe cody)
      delete newConfig.types[oldItemFQCN];
      delete newConfig.definitions[playDefinitionIdFromFQCN(oldItemFQCN)];

      const desc = cloneDeepJSON(tableVO.desc) as QueryableNotStoredStateListDescription;

      delete (desc as any).collection;
      delete (desc as any).projection;
      desc.isNotStored = true;
      desc.itemType = information.desc.name;
      desc.itemIdentifier = (information.desc as QueryableStateDescription).identifier;

      const schema = set(cloneDeepJSON(tableVO.schema), 'items', {$ref: playDefinitionIdFromFQCN(information.desc.name)});

      newConfig.types[tableVO.desc.name] = {
        desc,
        schema,
        uiSchema: set(cloneDeepJSON(tableVO.uiSchema || {}), 'ui:table.columns', orgProjectionVO ? cloneDeepJSON(get(orgProjectionVO.uiSchema || {}, 'ui:table.columns', [])) : []),
        factory: tableVO.factory
      }

      newConfig.definitions[playDefinitionIdFromFQCN(tableVO.desc.name)] = schema as JSONSchema7;

      newConfig.resolvers[desc.query] = {
        rules: [
          {
            rule: "always",
            then: {
              find: {
                information: information.desc.name,
                filter: {
                  any: true
                }
              }
            }
          }
        ]
      }

      dispatch({
        type: "INIT",
        payload: newConfig,
        ctx: getEditedContextFromConfig(newConfig),
      })

      return {
        cody: `The row data type is changed to "${playNodeLabel(information.desc.name)}"`
      }
    })
  }
}

export const ReferenceExistingInformationInTableProvider: InstructionProvider = {
  isActive: (context, config) => isTableWithEmptySchemaFocused(context.focusedElement, context.page.handle.page, config),
  provide: (ctx, config) => {
    const informationName = getLabelFromInstruction(ctx.searchStr, TEXT);

    const availableTypes = Object.values(config.types)
      .filter(t => isQueryableStateDescription(t.desc));

    const availableTypeLabels: Array<{label: string, type: PlayInformationRuntimeInfo}> = [];

    availableTypes.forEach(t => {
      const label = playNodeLabel(t.desc.name);

      if(availableTypeLabels.map(aT => aT.label).includes(label)) {
        availableTypeLabels.push({
          label: t.desc.name,
          type: t
        });
      } else {
        availableTypeLabels.push({
          label,
          type: t
        });
      }
    })

    if(!ctx.searchStr.startsWith(TEXT)) {
      return [
        {
          isActive: () => true,
          text: TEXT,
          icon: <VectorLink />,
          allowSubSuggestions: true,
          match: input => input === TEXT,
          execute: async (input, ctx1, dispatch, config1, navigateTo) => {
            const informationNameFromInput = getLabelFromInstruction(input, TEXT);

            const matchedType = availableTypeLabels.filter(aT => aT.label === informationNameFromInput)[0];

            if(matchedType) {
              return await makeReferenceExistingInformation(matchedType.label, matchedType.type).execute(input, ctx1, dispatch, config1, navigateTo);
            }

            return {
              cody: `Sorry, I can't find a matching type.`,
              details: `Have a look at the Cody Play Config in the app settings dialog. The "types" section contains all available types. You can only use a reference to a queryable state type, so the schema needs to be of type object and the type description should have an "identifier" set.`
            }
          }
        }
      ]
    }

    return availableTypeLabels.filter(aT => aT.label.startsWith(informationName)).map(aT => makeReferenceExistingInformation(aT.label, aT.type))
  }
}
