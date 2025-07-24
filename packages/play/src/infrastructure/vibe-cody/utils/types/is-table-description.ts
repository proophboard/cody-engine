import {
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription,
  QueryableNotStoredStateListDescription,
  QueryableStateListDescription,
  ValueObjectDescriptionFlags
} from "@event-engine/descriptions/descriptions";

export const isTableDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableStateListDescription | QueryableNotStoredStateListDescription => {
  return isQueryableStateListDescription(desc) || isQueryableNotStoredStateListDescription(desc);
}
