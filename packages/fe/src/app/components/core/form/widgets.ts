import {Widget} from "@rjsf/utils";
import DataSelectWidget from "@frontend/app/components/core/form/widgets/DataSelectWidget";

export type WidgetRegistry = {[widgetName: string]: Widget};

export const widgets: WidgetRegistry = {
  DataSelect: DataSelectWidget,
}
