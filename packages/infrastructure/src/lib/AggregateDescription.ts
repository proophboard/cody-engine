import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {Description} from "@event-engine/infrastructure/ProophBoard/Description";

export interface AggregateDescription extends Description {
  name: string;
  identifier: string;
  collection: string;
  state: ValueObjectRuntimeInfo;
}

export interface AggregateRuntimeInfo {

}
