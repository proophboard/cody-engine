import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {RawUiMetadata, UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {normalizeUiMetadata} from "@cody-engine/cody/hooks/utils/ui/normalize-ui-metadata";

export type PlayUiMetadata = UiMetadata & {
  sidebar?: {
    label: string,
    icon: string,
    invisible: string,
    dynamic?: {data: string, label?: string, icon?: string, hidden?: string}}
};

export const playUiMetadata = (ui: Node, ctx: ElementEditedContext): PlayUiMetadata | CodyResponse => {
  const meta = playParseJsonMetadata(ui) as RawUiMetadata;

  const metadata = playIsCodyError(meta)? {} : meta;

  return normalizeUiMetadata(metadata, false) as PlayUiMetadata;
}
