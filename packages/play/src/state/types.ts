import {PageDefinition, TopLevelPage} from "@frontend/app/pages/page-definitions";
import React from "react";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  AggregateCommandDescription,
  AggregateDescription, AggregateEventDescription,
  CommandDescription, EventDescription, QueryDescription, StateDescription, StateListDescription, ValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import {UiSchema} from "@rjsf/utils";
import {TableUiSchema} from "@cody-engine/cody/hooks/utils/value-object/get-vo-metadata";

/* UI */

export type PlayTopLevelPage = Omit<TopLevelPage, 'sidebar'> & {sidebar: {label: string, Icon: string, invisible?: string | boolean}};

export type PlayPageRegistry = {[pageName: string]: PageDefinition};

export type PlayViewRegistry = {
  [valueObjectName: string]: React.FunctionComponent<any> | { information: string };
};



export interface PlayInitAction {
  type: 'INIT',
  payload: CodyPlayConfig,
}


/* Commands */
export type PlayCommandRegistry = {
  [commandName: string]: PlayCommandRuntimeInfo;
}

export interface PlayCommandRuntimeInfo {
  desc: CommandDescription | AggregateCommandDescription;
  factory: AnyRule[],
  schema: DeepReadonly<JSONSchema7>,
  uiSchema?: UiSchema,
}

export type PlayCommandHandlerRegistry = {
  [commandName: string]: AnyRule[];
}

/* Queries */
export type PlayQueryRegistry = {
  [queryName: string]: PlayQueryRuntimeInfo;
}

export interface PlayQueryRuntimeInfo {
  desc: QueryDescription,
  factory: AnyRule[],
  schema: DeepReadonly<JSONSchema7>,
}

/* Information */
export type PlayInformationRegistry = {
  [informationName: string]: PlayInformationRuntimeInfo;
}

export interface PlayInformationRuntimeInfo {
  desc: ValueObjectDescription | StateDescription | StateListDescription;
  factory: AnyRule[];
  schema: DeepReadonly<JSONSchema7>;
  uiSchema?: UiSchema & TableUiSchema;
}

/* Aggregates */
export type PlayAggregateRegistry = {
  [aggregateName: string]: AggregateDescription;
}

/* Events */
export type PlayEventRegistry = {
  [eventName: string]: PlayEventRuntimeInfo;
}

export interface PlayEventRuntimeInfo {
  desc: EventDescription | AggregateEventDescription;
  factory: AnyRule[];
  schema: DeepReadonly<JSONSchema7>;
}

export type PlayEventReducers = {
  [eventName: string]: AnyRule[]
};

export type PlayApplyRulesRegistry = {
  [aggregateName: string]: PlayEventReducers
}

/* Definitions */
export type PlaySchemaDefinitions = {
  [definitionId: string]: JSONSchema7;
}
