import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {
  isTableWithFixedFilterPossibilitiesFocused
} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-with-fixed-filter-possibilties-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription,
  ListDescription,
  QueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {get} from "lodash";
import {JSONSchema7} from "json-schema";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {Filter1Outlined} from "@mui/icons-material";
import {CodyResponseType} from "@proophboard/cody-types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {ResolveConfig} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {AnyRule} from "@app/shared/rule-engine/configuration";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {isTableDescription} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-description";

const TEXT = `Apply a fixed filter `;

const makeFixedFilter = (tableVO: PlayInformationRuntimeInfo, prop: string, val: unknown): Instruction => {
  return {
    text: `${TEXT}${prop}: isEqual(${val})`,
    icon: <Filter1Outlined />,
    noInputNeeded: true,
    isActive: () => true,
    match: input => input.startsWith(`${TEXT}${prop}: isEqual(${val})`),
    execute: withNavigateToProcessing(async (input, ctx, dispatch, config) => {

      const queryName = (tableVO.desc as QueryableStateListDescription).query;
      const query = config.queries[queryName];

      if(!query) {
        return {
          cody: `I can't a query with name "${queryName}" in the Cody Play configuration.`,
          details: `This seems to be a bug. Please contact the prooph board team.`,
          type: CodyResponseType.Error
        }
      }

      const editedContext = getEditedContextFromConfig(config);


      const resolver: ResolveConfig = isQueryableNotStoredStateListDescription(tableVO.desc)
        ? {
          rules: [
            {
              rule: "always",
              then: {
                find: {
                  information: (tableVO.desc as QueryableStateListDescription).itemType,
                  filter: {
                    eq: {
                      prop,
                      value: `$> ${typeof val === "string" ? `'${val}'` : val}`
                    }
                  }
                }
              }
            }
          ]
        }
        : {
          where: {
            rule: "always",
            then: {
              filter: {
                eq: {
                  prop,
                  value: `$> ${typeof val === "string" ? `'${val}'` : val}`
                }
              }
            }
          },
        };

      dispatch({
        ctx: editedContext,
        type: "ADD_QUERY",
        name: queryName,
        query,
        resolver,
      })

      return {
        cody: `The table is now prefiltered.`
      }
    })
  }
}

export const ApplyAFixedFilterToTheTableProvider: InstructionProvider = {
  isActive: (context, config) => isTableWithFixedFilterPossibilitiesFocused(context.focusedElement, context.page.handle.page, config),
  provide: (context, config) => {
    // @TODO: Extend possibilities
    // - prop: isEqual(...)
    // - prop: isNotEqual(...)
    // - prop: isGreaterThan()
    // - prop: isLowerThan()
    // - prop: isGreaterThanOrEqual()
    // - prop: isLowerThanOrEqual()
    // input can be: enum, boolean, fixed string, user(), now(), userAttr()

    const tableVO = getFocusedQueryableStateListVo(context.focusedElement, context.page.handle.page, config);

    if(playIsCodyError(tableVO)) {
      return [];
    }

    if(!isTableDescription(tableVO.desc) ) {
      return [];
    }

    const itemFQCN = (tableVO.desc as ListDescription).itemType;

    const item = config.types[itemFQCN];

    if(!item) {
      return [];
    }

    const suggestions: Instruction[] = [];

    Object.keys(get(item.schema, 'properties', {})).forEach(prop => {
      const propSchema = get(item.schema, `properties.${prop}`, {type: "string"}) as JSONSchema7;

      if(propSchema.enum) {
        propSchema.enum.forEach(enumVal => {
          suggestions.push(makeFixedFilter(tableVO, prop, enumVal));
        })
      }

      if(propSchema.type && propSchema.type === "boolean") {
        suggestions.push(makeFixedFilter(tableVO, prop, true));
        suggestions.push(makeFixedFilter(tableVO, prop, false));
      }
    });

    return suggestions;
  }
}
