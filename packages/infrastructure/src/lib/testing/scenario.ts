import {InMemoryStreamStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {Documents, Sequences} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {Persona} from "@app/shared/extensions/personas";
import {Command} from "@event-engine/messaging/command";
import {Event} from "@event-engine/messaging/event";
import {
  ThenCallService, ThenDeleteInformation,
  ThenInsertInformation, ThenReplaceInformation,
  ThenUpdateInformation,
  ThenUpsertInformation
} from "@app/shared/rule-engine/configuration";
import {RecordedSession} from "@event-engine/infrastructure/testing/recorded-session";

export interface Scenario {
  type: 'command' | 'policy' | 'projection' | 'query';
  given: {
    data: {
      streams: InMemoryStreamStore,
      documents: Documents,
      sequences?: Sequences,
    },
    personas: Persona[],
    services: Record<string, any>,
  },
}

export interface CommandScenario extends Scenario {
  type: 'command',
  when: Partial<Command>,
  then: {
    session?: RecordedSession,
    serviceCalls?: ThenCallService[],
    error?: string,
  }
}

export interface PolicyScenario extends Scenario {
  type: 'policy',
  when: Partial<Event>,
  then: {
    commands: Partial<Command>[],
    serviceCalls: ThenCallService[],
    error?: string,
  }
}

export interface ProjectionScenario extends Scenario {
  type: 'projection',
  when: Partial<Event>,
  then: {
    dbOperation?: ThenInsertInformation | ThenUpsertInformation | ThenUpdateInformation | ThenReplaceInformation | ThenDeleteInformation,
    logMessage?: string,
    error?: string,
  }
}




