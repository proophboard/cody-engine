import {Index} from "@event-engine/infrastructure/DocumentStore/Index";
import {IndexProcessor} from "@event-engine/infrastructure/DocumentStore/IndexProcessor";
import {FieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/FieldIndex";
import {MultiFieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/MultiFieldIndex";
import {Sort} from "@event-engine/infrastructure/DocumentStore";
import {MetadataFieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/MetadataFieldIndex";

export class PostgresIndexProcessor implements IndexProcessor {
  process(index: Index, tableName: string): string {
    return index.processWith(this, tableName);
  }

  processFieldIndex(index: FieldIndex, tableName: string): string {
    return `
      CREATE ${index.unique ? 'UNIQUE' : ''} INDEX ${index.name}
      ON ${tableName}
      (${this.extractFieldPart(index.field, index.sort)});
    `;
  }

  processMultiFieldIndex(index: MultiFieldIndex, tableName: string): string {
    const fieldClause = index.fields.map(field => this.extractFieldPart(field.field, field.sort)).join(', ');

    return `
      CREATE ${index.unique ? 'UNIQUE' : ''} INDEX ${index.name}
      ON ${tableName}
      (${fieldClause})
    `;
  }

  processMetadataFieldIndex(index: MetadataFieldIndex, tableName: string): string {
    return `
      CREATE ${index.unique ? 'UNIQUE' : ''} INDEX ${index.name}
      ON ${tableName}
      (${index.field} ${this.extractSortFlag(index.sort)});
    `;
  }



  private extractSortFlag(sort?: Sort): string {
    return sort
      ? sort === 'asc' ? 'ASC' : 'DESC'
      : '';
  }

  private extractFieldPart(field: string, sort?: Sort): string {
    const sortFlag = this.extractSortFlag(sort);
    return `(${this.propToJsonPath(field)}) ${sortFlag}`;
  }

  private propToJsonPath(field: string): string {
    return `doc->'${field.replace('.', "'->'")}'`;
  }
}
