import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";
import {names} from "@event-engine/messaging/helpers";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {isCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

export type PlayUiMetadata = UiMetadata & {sidebar: {label: string, icon: string}};

export const playUiMetadata = (ui: Node, ctx: ElementEditedContext): PlayUiMetadata | CodyResponse => {
  const meta = playParseJsonMetadata(ui) as UiMetadata;

  if(isCodyError(meta)) {
    return meta;
  }

  const metadata = meta || {};

  if(!metadata.sidebar) {
    meta.sidebar = {
      label: ui.getName(),
      icon: 'Square'
    }
  }

  if(metadata.sidebar?.icon) {
    metadata.sidebar.icon = names(metadata.sidebar.icon).className;
  }

  return metadata as PlayUiMetadata;
}
