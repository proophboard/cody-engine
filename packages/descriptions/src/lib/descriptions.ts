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

export interface ValueObjectDescription extends ProophBoardDescription {
  name: string;
  isList: boolean;
  hasIdentifier: boolean;
}

export interface StateDescription extends ValueObjectDescription {
  identifier: string;
}

export interface StateListDescription extends ValueObjectDescription{
  itemIdentifier: string;
}
