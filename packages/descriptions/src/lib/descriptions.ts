export interface ProophBoardDescription {
  _pbBoardId: string;
  _pbCardId: string;
  _pbCreatedBy: string;
  _pbCreatedAt: string;
  _pbLastUpdatedBy: string;
  _pbLastUpdatedAt: string;
  _pbVersion: number;
  _pbLink: string;
}

export type DependencyType = "query" | "service";

export interface Dependency {
  type: DependencyType,
  options?: Record<string, any>,
  alias?: string,
  if?: string,
}

export type DependencyRegistry = {[dependencyName: string]: Dependency}

export interface AggregateDescription extends ProophBoardDescription {
  name: string;
  identifier: string;
  collection: string;
  stream?: string;
  state: string;
}

export interface CommandDescription extends ProophBoardDescription {
  name: string;
  aggregateCommand: boolean;
  dependencies?: DependencyRegistry;
}

export interface AggregateCommandDescription extends CommandDescription{
  newAggregate: boolean;
  aggregateName: string;
  aggregateIdentifier: string;
  deleteState?: boolean;
  deleteHistory?: boolean;
}

export function isAggregateCommandDescription (desc: CommandDescription | AggregateCommandDescription): desc is AggregateCommandDescription {
  return desc.aggregateCommand;
}

export interface EventDescription extends ProophBoardDescription {
  name: string;
  aggregateEvent: boolean;
  public: boolean;
}

export interface AggregateEventDescription extends EventDescription {
  aggregateName: string;
  aggregateIdentifier: string;
  aggregateState: string;
}

export interface QueryDescription extends ProophBoardDescription {
  name: string;
  returnType: string;
  dependencies?: DependencyRegistry;
}

export interface PolicyDescription extends ProophBoardDescription {
  name: string;
  dependencies?: DependencyRegistry;
  live?: boolean;
  projection?: string;
}

export interface ValueObjectDescriptionFlags {
  isList: boolean;
  hasIdentifier: boolean;
  isQueryable: boolean;
  isNotStored?: boolean;
}

export interface ValueObjectDescription extends ProophBoardDescription, ValueObjectDescriptionFlags {
  name: string;
}

export interface QueryableValueObjectDescription extends ValueObjectDescription {
  query: string;
  collection: string;
}

export const isQueryableValueObjectDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableValueObjectDescription => {
  return desc.isQueryable && !desc.hasIdentifier && !desc.isList && !desc.isNotStored;
}

export interface QueryableNotStoredValueObjectDescription extends ValueObjectDescription {
  query: string;
}

export const isQueryableNotStoredValueObjectDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableNotStoredValueObjectDescription => {
  return desc.isQueryable && !desc.hasIdentifier && !desc.isList && !!desc.isNotStored;
}

export interface StateDescription extends ValueObjectDescription {
  identifier: string;
}

export const isStateDescription = (desc: ValueObjectDescriptionFlags): desc is StateDescription => {
  return desc.hasIdentifier && !desc.isList;
}

export interface StateListDescription extends ValueObjectDescription{
  itemIdentifier: string;
}

export const isStateListDescription = (desc: ValueObjectDescriptionFlags): desc is StateListDescription => {
  return desc.hasIdentifier && desc.isList;
}

export interface QueryableStateDescription extends StateDescription {
  query: string;
  collection: string;
}

export const isQueryableStateDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableStateDescription => {
  return isStateDescription(desc) && desc.isQueryable;
}

export interface QueryableNotStoredStateDescription extends StateDescription {
  query: string;
}

export const isQueryableNotStoredStateDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableNotStoredStateDescription => {
  return isStateDescription(desc) && desc.isQueryable && !!desc.isNotStored;
}

export interface QueryableNotStoredStateListDescription extends StateListDescription {
  query: string;
  itemType: string;
}

export const isQueryableNotStoredStateListDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableNotStoredStateListDescription => {
  return isStateListDescription(desc) && !!desc.isNotStored && desc.isQueryable;
}

export interface QueryableStateListDescription extends StateListDescription {
  query: string;
  collection: string;
  itemType: string;
}

export const isQueryableStateListDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableStateListDescription => {
  return isStateListDescription(desc) && desc.isQueryable && !desc.isNotStored;
}

export interface QueryableListDescription extends ValueObjectDescription {
  query: string;
  itemType: string;
}

export const isQueryableListDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableListDescription => {
  return desc.isList && !desc.hasIdentifier && desc.isQueryable;
}

export type ValueObjectDescriptionType = "ValueObjectDescription" | "StateDescription" | "StateListDescription"
  | "QueryableValueObjectDescription" | "QueryableNotStoredValueObjectDescription"
  | "QueryableStateDescription" | "QueryableNotStoredStateDescription" | "QueryableStateListDescription"
  | "QueryableNotStoredStateListDescription" | "QueryableListDescription";

export const detectDescriptionType = (desc: ValueObjectDescriptionFlags): ValueObjectDescriptionType => {
  switch (true) {
    case isQueryableStateListDescription(desc):
      return "QueryableStateListDescription";
    case isQueryableListDescription(desc):
      return "QueryableListDescription";
    case isQueryableNotStoredStateListDescription(desc):
      return "QueryableNotStoredStateListDescription";
    case isQueryableNotStoredStateDescription(desc):
      return "QueryableNotStoredStateDescription";
    case isQueryableStateDescription(desc):
      return "QueryableStateDescription";
    case isStateListDescription(desc):
      return "StateListDescription";
    case isStateDescription(desc):
      return "StateDescription";
    case isQueryableValueObjectDescription(desc):
      return "QueryableValueObjectDescription";
    case isQueryableNotStoredValueObjectDescription(desc):
      return "QueryableNotStoredValueObjectDescription";
    default:
      return "ValueObjectDescription";
  }
}
