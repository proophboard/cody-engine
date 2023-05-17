import {Rule} from "../rule-engine/configuration";

export interface AggregateMetadata {
  collection?: string;
  stream?: string;
  rules?: Rule[];
}
