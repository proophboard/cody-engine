import {DynamicSidebar, PageDefinition, TopLevelGroup, TopLevelPage} from "@frontend/app/pages/page-definitions";
import React from "react";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  AggregateCommandDescription,
  AggregateDescription,
  AggregateEventDescription,
  CommandDescription, DependencyRegistry,
  EventDescription, PolicyDescription, PureCommandDescription, QueryableStateDescription, QueryableStateListDescription,
  QueryableValueObjectDescription,
  QueryDescription,
  StateDescription,
  StateListDescription, StreamCommandDescription,
  ValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {AnyRule} from "@app/shared/rule-engine/configuration";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import {UiSchema} from "@rjsf/utils";
import {DynamicBreadcrumbMetadata, ViewComponentType} from "@cody-engine/cody/hooks/utils/ui/types";
import {ResolveConfig, TableUiSchema} from "@cody-engine/cody/hooks/utils/value-object/types";
import {ThemeOptions} from "@mui/material";
import {Persona} from "@app/shared/extensions/personas";
import {LayoutType} from "@frontend/app/layout/layout-type";
import {Playshot} from "@cody-play/infrastructure/cody/cody-message-server";

/* UI */
export type PlayPageDefinition = Omit<PageDefinition, 'breadcrumb'> & {breadcrumb?: string | DynamicBreadcrumbMetadata, service: string};

export type PlayTopLevelPage = Omit<Omit<TopLevelPage, 'sidebar'>, 'breadcrumb'> & {sidebar: {label: string, icon: string, invisible?: string | boolean, group?: string | TopLevelGroup, position?: number, dynamic?: DynamicSidebar}} & PlayPageDefinition;

export interface PlaySubLevelPage extends PlayPageDefinition {
  routeParams: string[];
}

export type PlayPageRegistry = {[pageName: string]: PlayPageDefinition};

export type PlayViewComponentConfig = { information: string };

export type PlayViewRegistry = {
  [valueObjectName: string]: React.FunctionComponent<any> | PlayViewComponentConfig;
};

export interface PlayInitAction {
  type: 'INIT',
  payload: CodyPlayConfig,
}

export interface PlayRenameApp {
  type: 'RENAME_APP',
  name: string,
}

export interface PlayRenameDefaultService {
  type: 'RENAME_DEFAULT_SERVICE',
  name: string,
}

export interface ChangeLayout {
  type: 'CHANGE_LAYOUT',
  layout: LayoutType
}

export interface PlayChangeTheme {
  type: 'CHANGE_THEME',
  theme: ThemeOptions,
}

export interface PlaySetPersonas {
  type: 'SET_PERSONAS',
  personas: Persona[],
}

export interface PlayAddPersona {
  type: 'ADD_PERSONA',
  persona: Persona,
}

export interface PlayUpdatePersona {
  type: 'UPDATE_PERSONA',
  persona: Persona,
}

export interface PlayAddPageAction {
  type: 'ADD_PAGE',
  name: string,
  page: PlayPageDefinition,
}

export interface PlayRemovePageAction {
  type: 'REMOVE_PAGE',
  name: string,
}

export interface PlayAddCommandAction {
  type: 'ADD_COMMAND',
  name: string,
  command: PlayCommandRuntimeInfo,
}

export interface PlayRemoveCommandAction {
  type: 'REMOVE_COMMAND',
  name: string,
}

export interface PlayAddCommandHandlerAction {
  type: 'ADD_COMMAND_HANDLER',
  command: string,
  businessRules: AnyRule[]
}

export interface PlayRemoveCommandHandlerAction {
  type: 'REMOVE_COMMAND_HANDLER',
  command: string,
}

export interface PlayAddTypeAction {
  type: 'ADD_TYPE',
  name: string,
  information: PlayInformationRuntimeInfo,
  definition: {
    definitionId: string,
    schema: JSONSchema7
  }
}

export interface PlayRemoveTypeAction {
  type: 'REMOVE_TYPE',
  name: string,
}

export interface PlayAddQueryAction {
  type: 'ADD_QUERY',
  name: string,
  query: PlayQueryRuntimeInfo,
  resolver: ResolveConfig,
  dependencies?: DependencyRegistry,
}

export interface PlayRemoveQueryAction {
  type: 'REMOVE_QUERY',
  name: string,
}

export interface PlayAddViewAction {
  type: 'ADD_VIEW',
  name: string,
  information: string,
}

export interface PlayRemoveViewAction {
  type: 'REMOVE_VIEW',
  name: string,
}

export interface PlayAddAggregateAction {
  type: 'ADD_AGGREGATE',
  name: string,
  command: string,
  aggregate: AggregateDescription,
  businessRules: AnyRule[]
}

export interface PlayRemoveAggregateAction {
  type: 'REMOVE_AGGREGATE',
  name: string,
}

export interface PlayAddAggregateEventAction {
  type: 'ADD_AGGREGATE_EVENT',
  name: string,
  aggregate: string,
  event: PlayEventRuntimeInfo,
  reducer: AnyRule[],
}

export interface PlayAddPureEventAction {
  type: 'ADD_PURE_EVENT',
  name: string,
  event: PlayEventRuntimeInfo,
}

export interface PlayRemovePureEventAction {
  type: 'REMOVE_PURE_EVENT',
  name: string,
}

export interface PlayRemoveAggregateEventAction {
  type: 'REMOVE_AGGREGATE_EVENT',
  name: string,
  aggregate: string,
}

export interface PlayAddEventPolicyAction {
  type: 'ADD_EVENT_POLICY',
  name: string,
  event: string,
  desc: PlayEventPolicyDescription,
}

export interface PlayRemoveEventPolicyAction {
  type: 'REMOVE_EVENT_POLICY',
  name: string,
  event: string,
}

/* Commands */
export type PlayCommandRegistry = {
  [commandName: string]: PlayCommandRuntimeInfo;
}

export interface PlayCommandRuntimeInfo {
  desc: CommandDescription | AggregateCommandDescription | PureCommandDescription | StreamCommandDescription;
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

export type PlayResolverRegistry = {
  [queryName: string]: ResolveConfig;
}

/* Information */
export type PlayInformationRegistry = {
  [informationName: string]: PlayInformationRuntimeInfo;
}

export interface PlayInformationRuntimeInfo {
  desc: ValueObjectDescription | StateDescription | StateListDescription | QueryableValueObjectDescription | QueryableStateDescription | QueryableStateListDescription;
  factory: AnyRule[];
  schema: DeepReadonly<JSONSchema7>;
  uiSchema?: UiSchema & TableUiSchema;
}

/* Aggregates */
export type PlayAggregateRegistry = {
  [aggregateName: string]: AggregateDescription;
}

/* Event Policies */
export type PlayEventPolicyRegistry = {
  [eventName: string]: {
    [policyName: string]: PlayEventPolicyDescription
  };
}

export type PlayEventPolicyDescription = PolicyDescription & { rules: AnyRule[] };

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
