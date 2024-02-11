import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";

export interface PolicyMeta {
  service?: string;
  dependencies?: DependencyRegistry;
  rules?: Rule[];
  live?: boolean;
  projection?: string;
}
