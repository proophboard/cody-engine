import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";

export const getUiMetadata = (ui: Node, ctx: Context): UiMetadata | CodyResponse => {
  // @todo: validate ui meta
  const meta = parseJsonMetadata(ui) as UiMetadata & {sidebar?: {hidden?: string}};

  if(isCodyError(meta)) {
    return meta;
  }

  if(meta && meta.sidebar?.icon) {
    meta.sidebar.icon = names(meta.sidebar.icon).className;
  }

  if(meta && meta.tab?.icon) {
    meta.tab.icon = names(meta.tab.icon).className;
  }

  if(meta && meta.sidebar && meta.sidebar.hidden) {
    meta.sidebar.invisible = meta.sidebar.hidden;
  }

  return meta;
}
