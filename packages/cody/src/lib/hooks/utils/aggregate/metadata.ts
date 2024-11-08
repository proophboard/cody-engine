import {Rule} from "@app/shared/rule-engine/configuration";

export interface AggregateMetadata {
  stream?: string;
  rules?: Rule[];
}
