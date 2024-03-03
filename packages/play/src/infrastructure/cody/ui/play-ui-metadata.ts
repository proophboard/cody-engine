import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {RawUiMetadata, UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";
import {names} from "@event-engine/messaging/helpers";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {playAllowedRoles} from "@cody-play/infrastructure/role/play-allowed-roles";
import {playConvertToRoleCheck} from "@cody-play/infrastructure/role/play-convert-to-role-check";
import {normalizeUiMetadata} from "@cody-engine/cody/hooks/utils/ui/normalize-ui-metadata";

export type PlayUiMetadata = UiMetadata & {sidebar?: {label: string, icon: string, invisible: string}};

export const playUiMetadata = (ui: Node, ctx: ElementEditedContext): PlayUiMetadata | CodyResponse => {
  const meta = playParseJsonMetadata(ui) as RawUiMetadata;

  const metadata = playIsCodyError(meta)? {} : meta;

  return normalizeUiMetadata(metadata) as PlayUiMetadata;
}
