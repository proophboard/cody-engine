import {ViewComponentType} from "@cody-engine/cody/hooks/utils/ui/types";
import {UiSchema} from "@rjsf/utils";
import {PageType} from "@frontend/app/pages/page-definitions";

export type ViewRuntimeConfig = {
  isHiddenView: boolean,
  viewType: ViewComponentType,
  pageMode: PageType,
  loadState?: boolean,
  uiSchemaOverride?: UiSchema,
  injectedInitialValues?: any
}
