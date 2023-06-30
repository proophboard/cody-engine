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
}

export interface ValueObjectDescriptionFlags {
  isList: boolean;
  hasIdentifier: boolean;
  isQueryable: boolean;
}

export interface ValueObjectDescription extends ProophBoardDescription, ValueObjectDescriptionFlags {
  name: string;
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

export interface QueryableStateListDescription extends StateListDescription {
  query: string;
  collection: string;
  itemType: string;
}

export const isQueryableStateListDescription = (desc: ValueObjectDescriptionFlags): desc is QueryableStateListDescription => {
  return isStateListDescription(desc) && desc.isQueryable;
}

export type ValueObjectDescriptionType = "ValueObjectDescription" | "StateDescription" | "StateListDescription" | "QueryableStateDescription" | "QueryableStateListDescription";

export const detectDescriptionType = (desc: ValueObjectDescriptionFlags): ValueObjectDescriptionType => {
  switch (true) {
    case isQueryableStateListDescription(desc):
      return "QueryableStateListDescription";
    case isQueryableStateDescription(desc):
      return "QueryableStateDescription";
    case isStateListDescription(desc):
      return "StateListDescription";
    case isStateDescription(desc):
      return "StateDescription";
    default:
      return "ValueObjectDescription";
  }
}
