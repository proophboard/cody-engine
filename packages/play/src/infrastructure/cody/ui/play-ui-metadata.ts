import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";
import {names} from "@event-engine/messaging/helpers";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {playAllowedRoles} from "@cody-play/infrastructure/role/play-allowed-roles";
import {playConvertToRoleCheck} from "@cody-play/infrastructure/role/play-convert-to-role-check";

export type PlayUiMetadata = UiMetadata & {sidebar?: {label: string, icon: string, invisible: string}};

export const playUiMetadata = (ui: Node, ctx: ElementEditedContext): PlayUiMetadata | CodyResponse => {
  const meta = playParseJsonMetadata(ui) as UiMetadata;

  if(playIsCodyError(meta)) {
    return meta;
  }

  const metadata = meta || {};

  if(metadata.sidebar?.icon) {
    metadata.sidebar.icon = names(metadata.sidebar.icon).className;
  }

  if(metadata.sidebar) {
    const allowedRoles = playAllowedRoles(ui, ctx);

    if(playIsCodyError(allowedRoles)) {
      return allowedRoles;
    }

    metadata.sidebar.invisible = allowedRoles.count() ? playConvertToRoleCheck(allowedRoles) : undefined;
  }

  return metadata as PlayUiMetadata;
}
