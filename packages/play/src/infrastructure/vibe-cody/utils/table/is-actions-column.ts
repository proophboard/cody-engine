import {StringOrTableColumnUiSchema, TableColumnUiSchema} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";

export const isActionsColumn = (col: StringOrTableColumnUiSchema): col is TableColumnUiSchema => {
  return typeof col === "object" && (col.type === "actions" || (col.field === 'actions' && !col.type))
}
