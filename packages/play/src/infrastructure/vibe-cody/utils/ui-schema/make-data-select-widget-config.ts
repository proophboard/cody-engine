import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {UiSchema} from "@rjsf/utils";
import {
  isQueryableListDescription, isQueryableStateListDescription, isStateDescription,
} from "@event-engine/descriptions/descriptions";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {JSONSchema7} from "json-schema";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {camelCaseToTitle} from "@frontend/util/string";

export const makeDataSelectWidgetConfig = (queryableListVO: PlayInformationRuntimeInfo, config: CodyPlayConfig, multiSelect?: boolean): UiSchema => {
  debugger;

  if(!isQueryableListDescription(queryableListVO.desc) && !isQueryableStateListDescription(queryableListVO.desc)) {
    return {};
  }

  const itemType = config.types[queryableListVO.desc.itemType];

  if(!itemType) {
    return {}
  }

  const itemDesc = itemType.desc;

  if(!isStateDescription(itemDesc)) {
    return {};
  }

  let dropdownLabel = (new Schema(itemType.schema as JSONSchema7, true))
    .getDisplayNamePropertyCandidates().map(c => `data.${c}`).join(` + ' ' + `);

  if(dropdownLabel === '') {
    dropdownLabel = `data.${itemDesc.identifier}`;
  }

  const title = itemDesc.identifier.endsWith('Id')
    ? camelCaseToTitle(itemDesc.identifier.slice(0, -2))
    : camelCaseToTitle(itemDesc.identifier);

  return {
      'ui:widget': 'DataSelect',
      'ui:title': title,
      'ui:options': {
        'data': registryIdToDataReference(queryableListVO.desc.name),
        'label': `$> ${dropdownLabel}`,
        'value': `$> data.${itemDesc.identifier}`,
        'checkbox': multiSelect
      }
    } as unknown as UiSchema;
  }
