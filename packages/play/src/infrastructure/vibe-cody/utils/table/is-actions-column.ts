import {StringOrTableColumnUiSchema} from "@cody-engine/cody/hooks/utils/value-object/types";

export const isActionsColumn = <T extends StringOrTableColumnUiSchema>(col: T): boolean => {
  return typeof col === "object" && (col.type === "actions" || !!col.action || !!col.actions)
}
