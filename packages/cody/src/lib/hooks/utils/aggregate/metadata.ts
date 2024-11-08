import {Rule} from "@cody-engine/cody/hooks/rule-engine/configuration";

export interface AggregateMetadata {
  stream?: string;
  rules?: Rule[];
}
