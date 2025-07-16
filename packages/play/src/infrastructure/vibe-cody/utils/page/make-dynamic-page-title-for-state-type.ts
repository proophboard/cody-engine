import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {names} from "@event-engine/messaging/helpers";
import {playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {camelCaseToTitle} from "@frontend/util/string";
import {isQueryableStateDescription} from "@event-engine/descriptions/descriptions";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {JSONSchema7} from "json-schema";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";

export const makeDynamicPageTitleForStateType = (stateVO: PlayInformationRuntimeInfo): string => {
  const staticLabel = camelCaseToTitle(`${names(playNodeLabel(stateVO.desc.name)).className}Details`);

  if(!isQueryableStateDescription(stateVO.desc)) {
    return `$> '${staticLabel}'`;
  }

  const schema = new Schema(stateVO.schema as JSONSchema7, true);

  const candidates = schema.getDisplayNamePropertyCandidates();

  if(!candidates.length) {
    return `$> '${staticLabel}'`;
  }

  return `$> page|data('${registryIdToDataReference(stateVO.desc.name)}')|pick(['${candidates.join("', '")}'])|values|join(' ')`
}
