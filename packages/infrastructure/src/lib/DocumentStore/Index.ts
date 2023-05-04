import {IndexProcessor} from "@event-engine/infrastructure/DocumentStore/IndexProcessor";

export interface Index {
  readonly name: string;

  processWith: (indexProcessor: IndexProcessor, tableName: string) => any;
}

