import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {OrFilter} from "@event-engine/infrastructure/DocumentStore/Filter/OrFilter";
import {DocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/DocIdFilter";
import {ExistsFilter} from "@event-engine/infrastructure/DocumentStore/Filter/ExistsFilter";
import {GtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GtFilter";
import {GteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GteFilter";
import {LtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LtFilter";
import {LteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LteFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";
import {LikeFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LikeFilter";
import {NotFilter} from "@event-engine/infrastructure/DocumentStore/Filter/NotFilter";
import {AnyOfDocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfDocIdFilter";
import {AnyOfFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfFilter";

export class PostgresFilterProcessor implements FilterProcessor {
  private arguments: any[] = [];

  process(filter: Filter): [string, any[]] {
    this.arguments = [];
    const query = filter.processWith(this);

    return [query, this.arguments];
  }

  processAnyFilter(filter: AnyFilter): string {
    return '1=1';
  };

  processEqFilter(filter: EqFilter): string {
    const argumentRef = this.registerArgument(JSON.stringify(filter.val));
    const propPath = this.propToJsonPath(filter.prop);

    return `${propPath}=$${argumentRef}`;
  };

  processAndFilter(filter: AndFilter): string {
    const subFilterQueries = filter.internalFilters.map(filter => filter.processWith(this));
    return '(' + subFilterQueries.join(') AND (') + ')';
  };

  processOrFilter(filter: OrFilter): string {
    const subFilterQueries = filter.internalFilters.map(filter => filter.processWith(this));
    return '(' + subFilterQueries.join(') OR (') + ')';
  };

  processDocIdFilter(filter: DocIdFilter): string {
    const argumentRef = this.registerArgument(filter.val);
    return `id=$${argumentRef}`;
  };

  processExistsFilter(filter: ExistsFilter): string {
    const jsonPath = this.propToJsonPath(filter.prop);
    const jsonPathParts = jsonPath.split('->');
    const lastProp = jsonPathParts.pop();
    const parentProps = jsonPathParts.join('->');

    return `JSONB_EXISTS(${parentProps}, ${lastProp})`;
  }

  processGtFilter(filter: GtFilter): string {
    const argumentRef = this.registerArgument(JSON.stringify(filter.val));
    const propPath = this.propToJsonPath(filter.prop);

    return `${propPath} > $${argumentRef}`;
  }

  processGteFilter(filter: GteFilter): string {
    const argumentRef = this.registerArgument(JSON.stringify(filter.val));
    const propPath = this.propToJsonPath(filter.prop);

    return `${propPath} >= $${argumentRef}`;
  }

  processLtFilter(filter: LtFilter): string {
    const argumentRef = this.registerArgument(JSON.stringify(filter.val));
    const propPath = this.propToJsonPath(filter.prop);

    return `${propPath} < $${argumentRef}`;
  }

  processLteFilter(filter: LteFilter): string {
    const argumentRef = this.registerArgument(JSON.stringify(filter.val));
    const propPath = this.propToJsonPath(filter.prop);

    return `${propPath} <= $${argumentRef}`;
  }

  processInArrayFilter(filter: InArrayFilter): string {
    const argumentRef = this.registerArgument(`[${JSON.stringify(filter.val)}]`);
    const propPath = this.propToJsonPath(filter.prop);


    return `${propPath} @> $${argumentRef}`;
  }

  processLikeFilter(filter: LikeFilter): string {
    const argumentRef = this.registerArgument(filter.val);
    const propPath = this.propToJsonStringPath(filter.prop);

    return `${propPath} iLIKE $${argumentRef}`;
  }

  processNotFilter(filter: NotFilter): string {
    const innerFilterQuery = filter.innerFilter.processWith(this);

    return `NOT (${innerFilterQuery})`;
  }

  processAnyOfDocIdFilter(filter: AnyOfDocIdFilter): string {
    const options: string[] = [];
    filter.valList.forEach(value => {
      const argumentRef = this.registerArgument(value);
      options.push(`$${argumentRef}`);
    });

    return `id IN(${options.join(',')})`;
  }

  processAnyOfFilter(filter: AnyOfFilter): string {
    const options: string[] = [];
    filter.valList.forEach(value => {
      const argumentRef = this.registerArgument(JSON.stringify(value));
      options.push(`$${argumentRef}`);
    });
    const propPath = this.propToJsonPath(filter.prop);

    return `${propPath} IN(${options.join(',')})`;
  }


  private propToJsonPath(field: string): string {
    return `doc->'${field.replace('.', "'->'")}'`;
  }

  private propToJsonStringPath(field: string): string {
    const fieldParts = field.split('.');
    const path = fieldParts.slice(0, -1).join("'->'");

    return `doc->'${path}'->>'${fieldParts.slice(-1)}'`;
  }

  private registerArgument(value: any): number {
    this.arguments.push(value);
    return this.arguments.length;
  }
}
