import {Widget} from "@rjsf/utils";
import DataSelectWidget from "@frontend/app/components/core/form/widgets/DataSelectWidget";
import FilteredEnumWidget from "@frontend/app/components/core/form/widgets/FilteredEnumWidget";

export type WidgetRegistry = {[widgetName: string]: Widget};

export const widgets: WidgetRegistry = {
  DataSelect: DataSelectWidget,
  FilteredEnum: FilteredEnumWidget,
}
