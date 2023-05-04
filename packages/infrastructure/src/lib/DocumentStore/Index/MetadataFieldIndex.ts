import {Index} from "@event-engine/infrastructure/DocumentStore/Index";
import {IndexProcessor} from "@event-engine/infrastructure/DocumentStore/IndexProcessor";
import {Sort} from "@event-engine/infrastructure/DocumentStore";

export class MetadataFieldIndex implements Index {
  public readonly name: string;
  public readonly field: string;
  public readonly unique?: boolean;
  public readonly sort?: Sort;

  public static forField(name: string, field: string, sort?: Sort, unique?: boolean): MetadataFieldIndex {
    return new MetadataFieldIndex(name, field, sort, unique);
  }

  private constructor(name: string, field: string, sort?: Sort, unique?: boolean) {
    if (name.length < 1) {
      throw new Error('Index name must not be empty');
    }

    if (field.length < 1) {
      throw new Error('Index field must not be empty');
    }

    this.name = name;
    this.field = field;
    this.sort = sort;
    this.unique = unique;
  }

  public processWith(indexProcessor: IndexProcessor, tableName: string): any {
    return indexProcessor.processMetadataFieldIndex(this, tableName);
  }
}
