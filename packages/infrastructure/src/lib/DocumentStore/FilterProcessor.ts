import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
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

export interface FilterProcessor {
  process: (filter: Filter) => any;
  processAnyFilter: (filter: AnyFilter) => any;
  processEqFilter: (filter: EqFilter) => any;
  processAndFilter: (filter: AndFilter) => any;
  processOrFilter: (filter: OrFilter) => any;
  processDocIdFilter: (filter: DocIdFilter) => any;
  processExistsFilter: (filter: ExistsFilter) => any;
  processGtFilter: (filter: GtFilter) => any;
  processGteFilter: (filter: GteFilter) => any;
  processLtFilter: (filter: LtFilter) => any;
  processLteFilter: (filter: LteFilter) => any;
  processInArrayFilter: (filter: InArrayFilter) => any;
  processLikeFilter: (filter: LikeFilter) => any;
  processNotFilter: (filter: NotFilter) => any;
  processAnyOfDocIdFilter: (filter: AnyOfDocIdFilter) => any;
  processAnyOfFilter: (filter: AnyOfFilter) => any;
}
