import {Rule} from "../rule-engine/configuration";

export interface AggregateMetadata {
  stream?: string;
  rules?: Rule[];
}
