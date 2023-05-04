import {Index} from "@event-engine/infrastructure/DocumentStore/Index";
import {FieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/FieldIndex";
import {MultiFieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/MultiFieldIndex";
import {MetadataFieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/MetadataFieldIndex";

export interface IndexProcessor {
  process: (index: Index, tableName: string) => any;
  processFieldIndex: (index: FieldIndex, tableName: string) => any;
  processMultiFieldIndex: (index: MultiFieldIndex, tableName: string) => any;
  processMetadataFieldIndex: (index: MetadataFieldIndex, tableName: string) => any;
}
