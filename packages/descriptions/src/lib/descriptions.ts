export interface ProophBoardDescription {
  _pbBoardId: string;
  _pbCardId: string;
  _pbCreatedBy: string;
  _pbCreatedAt: string;
  _pbLastUpdatedBy: string;
  _pbLastUpdatedAt: string;
  _pbVersion: number;
}

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

export interface ValueObjectDescription extends ProophBoardDescription {
  name: string;
  isList: boolean;
  hasIdentifier: boolean;
  isQueryable: boolean;
}

export interface StateDescription extends ValueObjectDescription {
  identifier: string;
}

export const isStateDescription = (desc: ValueObjectDescription): desc is StateDescription => {
  return desc.hasIdentifier && !desc.isList;
}

export interface StateListDescription extends ValueObjectDescription{
  itemIdentifier: string;
}

export const isStateListDescription = (desc: ValueObjectDescription): desc is StateListDescription => {
  return desc.hasIdentifier && desc.isList;
}

export interface QueryableStateDescription extends StateDescription {
  query: string;
  collection: string;
}

export const isQueryableStateDescription = (desc: ValueObjectDescription): desc is QueryableStateDescription => {
  return isStateDescription(desc) && desc.isQueryable;
}

export interface QueryableStateListDescription extends StateListDescription {
  query: string;
  collection: string;
}

export const isQueryableStateListDescription = (desc: ValueObjectDescription): desc is QueryableStateListDescription => {
  return isQueryableStateListDescription(desc) && desc.isQueryable;
}

