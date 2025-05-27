import {StringOrTableColumnUiSchema} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {isActionsColumn} from "@cody-play/infrastructure/vibe-cody/utils/table/is-actions-column";

export const addNewColumn = (existingColumns: StringOrTableColumnUiSchema[], newColumn: StringOrTableColumnUiSchema): StringOrTableColumnUiSchema[] => {
  const lastCol = existingColumns.pop();

  if(!lastCol) {
    existingColumns.push(newColumn);
    return existingColumns;
  }

  if(isActionsColumn(lastCol)) {
    existingColumns.push(newColumn);
    existingColumns.push(lastCol);
  } else {
    existingColumns.push(lastCol);
    existingColumns.push(newColumn);
  }

  return existingColumns;
}
