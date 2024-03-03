import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {RawUiMetadata, UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";
import {normalizeUiMetadata} from "@cody-engine/cody/hooks/utils/ui/normalize-ui-metadata";

export const getUiMetadata = (ui: Node, ctx: Context): UiMetadata | CodyResponse => {
  // @todo: validate ui meta
  const meta = parseJsonMetadata(ui) as RawUiMetadata;

  if(isCodyError(meta)) {
    return meta;
  }


  return normalizeUiMetadata(meta);
}


