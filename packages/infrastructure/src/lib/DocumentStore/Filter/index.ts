import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
import {AnyOfDocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfDocIdFilter";
import {AnyOfFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfFilter";
import {DocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/DocIdFilter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {ExistsFilter} from "@event-engine/infrastructure/DocumentStore/Filter/ExistsFilter";
import {GteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GteFilter";
import {GtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GtFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";
import {LikeFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LikeFilter";
import {LteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LteFilter";
import {LtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LtFilter";
import {NotFilter} from "@event-engine/infrastructure/DocumentStore/Filter/NotFilter";
import {OrFilter} from "@event-engine/infrastructure/DocumentStore/Filter/OrFilter";

export const filters = {
  AndFilter: AndFilter,
  AnyFilter: AnyFilter,
  AnyOfDocIdFilter: AnyOfDocIdFilter,
  AnyOfFilter: AnyOfFilter,
  DocIdFilter: DocIdFilter,
  EqFilter: EqFilter,
  ExistsFilter: ExistsFilter,
  GteFilter: GteFilter,
  GtFilter: GtFilter,
  InArrayFilter: InArrayFilter,
  LikeFilter: LikeFilter,
  LteFilter: LteFilter,
  LtFilter: LtFilter,
  NotFilter: NotFilter,
  OrFilter: OrFilter,
}
