import {
  ChangeLayout,
  PlayAddAggregateAction,
  PlayAddAggregateEventAction,
  PlayAddCommandAction,
  PlayAddCommandHandlerAction,
  PlayAddEventPolicyAction,
  PlayAddPageAction,
  PlayAddPersona,
  PlayAddPureEventAction,
  PlayAddQueryAction,
  PlayAddTypeAction,
  PlayAddViewAction,
  PlayAggregateRegistry,
  PlayApplyRulesRegistry,
  PlayChangeTheme,
  PlayCommandHandlerRegistry,
  PlayCommandRegistry,
  PlayEventPolicyRegistry,
  PlayEventRegistry,
  PlayInformationRegistry,
  PlayInitAction,
  PlayPageRegistry,
  PlayQueryRegistry,
  PlayRemoveAggregateAction,
  PlayRemoveAggregateEventAction,
  PlayRemoveCommandAction,
  PlayRemoveCommandHandlerAction,
  PlayRemoveEventPolicyAction,
  PlayRemovePageAction,
  PlayRemovePureEventAction,
  PlayRemoveQueryAction,
  PlayRemoveTypeAction,
  PlayRemoveViewAction,
  PlayRenameApp,
  PlayRenameDefaultService,
  PlayResolverRegistry,
  PlaySchemaDefinitions,
  PlaySetPersonas,
  PlayTopLevelPage,
  PlayUpdatePersona,
  PlayViewRegistry
} from '@cody-play/state/types';
import {createContext, PropsWithChildren, useContext, useEffect, useReducer} from "react";
import {injectCustomApiQuery} from "@frontend/queries/use-api-query";
import {makeLocalApiQuery} from "@cody-play/queries/local-api-query";
import {useUser} from "@frontend/hooks/use-user";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import PlayWelcome from "@cody-play/app/components/core/PlayWelcome";
import {ThemeOptions} from "@mui/material";
import {Persona} from "@app/shared/extensions/personas";
import {types as sharedTypes} from "@app/shared/types";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";
import _ from "lodash";
import {playDefinitionIdFromFQCN,} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {directSetEnv, EnvContext} from "@frontend/app/providers/UseEnvironment";
import {names} from "@event-engine/messaging/helpers";
import {PageRegistry} from "@frontend/app/pages";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {Map} from "immutable";
import {Node} from "@proophboard/cody-types";
import {LayoutType} from "@frontend/app/layout/layout-type";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import PlayVibeCodyProcessing from "@cody-play/app/components/core/PlayVibeCodyProcessing";

export interface CodyPlayConfig {
  appName: string,
  defaultService: string,
  boardId: string,
  boardName: string,
  origin: string,
  lastEditor: string,
  layout: LayoutType,
  theme: ThemeOptions,
  personas: Persona[],
  pages: PlayPageRegistry,
  views: PlayViewRegistry,
  commands: PlayCommandRegistry,
  commandHandlers: PlayCommandHandlerRegistry,
  aggregates: PlayAggregateRegistry,
  events: PlayEventRegistry,
  eventReducers: PlayApplyRulesRegistry,
  eventPolicies: PlayEventPolicyRegistry,
  queries: PlayQueryRegistry,
  resolvers: PlayResolverRegistry,
  types: PlayInformationRegistry,
  definitions: PlaySchemaDefinitions,
}

const initialPlayConfig: CodyPlayConfig = {
  appName: 'Cody Play',
  defaultService: 'App',
  layout: 'task-based-ui',
  boardId: '',
  boardName: '',
  origin: 'https://app.prooph-board.com',
  lastEditor: '',
  theme: {
    vars: {},
    lightPalette: {},
    darkPalette: {},
  },
  personas: [
    {
      displayName: 'Anyone',
      userId: '0299cda3-a2f7-4e94-9899-e1e37e5fe088',
      email: 'anyone@example.local',
      roles: ['Anyone'],
      avatar: '/assets/account-circle-outline.svg',
      description: 'Anyone represents a standard user of the app without a specific role. This user has access to functionality that is not explicitly restricted.'
    }
  ],
  pages: {
    Welcome: ({
      name: 'App.Welcome',
      service: 'App',
      commands: [],
      components: ["Core.Welcome"],
      sidebar: {
        label: "Welcome",
        icon: "ViewDashboard",
        invisible: true
      },
      route: "/welcome",
      topLevel: true
    } as PlayTopLevelPage),
    'CodyPlay.VibeCodyProcessing': ({
      name: 'CodyPlay.VibeCodyProcessing',
      service: 'CodyPlay',
      commands: [],
      components: ["CodyPlay.VibeCodyProcessing"],
      title: '',
      sidebar: {
        label: "VC Processing",
        icon: "cogs",
        invisible: true
      },
      route: "/cody-play-internal/vibe-cody-processing",
      topLevel: true
    } as PlayTopLevelPage),
  },
  views: {
    "Core.Welcome": PlayWelcome,
    "CodyPlay.VibeCodyProcessing": PlayVibeCodyProcessing,
  },
  commands: {
  },
  commandHandlers: {
  },
  aggregates: {
  },
  events: {
  },
  eventReducers: {
  },
  queries: {
  },
  resolvers: {
  },
  types: {
  },
  definitions: {
  },
  eventPolicies: {
  }
}

export const CONFIG_STORE_LOCAL_STORAGE_KEY = 'cody_play_config_';

const syncTypesWithSharedRegistry = (config: CodyPlayConfig): void => {
  // Sync types, so that DataSelect, breadcrumbs, ... can resolve references
  for (const typeName in config.types) {
    sharedTypes[typeName] = config.types[typeName] as any;
  }
}

export const cloneConfig = (config: CodyPlayConfig): CodyPlayConfig => {
  const shallowClone = {
    ...config,
    pages: {
      ...config.pages
    },
    views: {
      ...config.views
    }
  };

  delete shallowClone.pages.Welcome;
  delete shallowClone.views['Core.Welcome'];
  delete shallowClone.pages['CodyPlay.VibeCodyProcessing'];
  delete shallowClone.views['CodyPlay.VibeCodyProcessing'];

  const deepClone = cloneDeepJSON(shallowClone);

  return enhanceConfigWithDefaults(deepClone);
}

export const enhanceConfigWithDefaults = (config: CodyPlayConfig): CodyPlayConfig => {
  const defaultService = config.defaultService || config.appName || initialPlayConfig.defaultService;
  return {
    ...initialPlayConfig,
    ...config,
    defaultService,
    pages: {
      ...config.pages,
      Welcome: initialPlayConfig.pages.Welcome,
      'CodyPlay.VibeCodyProcessing': initialPlayConfig.pages['CodyPlay.VibeCodyProcessing'],
    },
    views: {
      ...config.views,
      "Core.Welcome": initialPlayConfig.views['Core.Welcome'],
      "CodyPlay.VibeCodyProcessing": initialPlayConfig.views['CodyPlay.VibeCodyProcessing'],
    }
  }
}

export const getEditedContextFromConfig = (config: CodyPlayConfig, syncedNodes?: Map<string, Node>): ElementEditedContext => {
  return {
    boardId: config.boardId,
    boardName: config.boardName,
    userId: config.lastEditor,
    service: config.defaultService,
    syncedNodes: syncedNodes || Map(),
    origin: config.origin,
  }
}

const storedConfigStr = localStorage.getItem(CONFIG_STORE_LOCAL_STORAGE_KEY + currentBoardId());

const defaultPlayConfig = storedConfigStr ? enhanceConfigWithDefaults(JSON.parse(storedConfigStr) as CodyPlayConfig) : initialPlayConfig;

syncTypesWithSharedRegistry(defaultPlayConfig);

console.log(`[PlayConfigStore] Initializing with config: `, defaultPlayConfig);

directSetEnv({UI_ENV: "play", DEFAULT_SERVICE: defaultPlayConfig.defaultService, PAGES: defaultPlayConfig.pages as unknown as PageRegistry});

const configStore = createContext<{config: CodyPlayConfig, dispatch: (a: Action) => void}>({config: defaultPlayConfig, dispatch: (action: Action) => {return;}});

const { Provider } = configStore;

type Action = {ctx: ElementEditedContext} & (PlayInitAction | PlayRenameApp | PlayRenameDefaultService | ChangeLayout | PlayChangeTheme | PlaySetPersonas | PlayAddPersona | PlayUpdatePersona| PlayAddPageAction | PlayRemovePageAction
  | PlayAddCommandAction | PlayRemoveCommandAction | PlayAddCommandHandlerAction | PlayRemoveCommandHandlerAction | PlayAddTypeAction | PlayRemoveTypeAction
  | PlayAddQueryAction | PlayRemoveQueryAction | PlayAddViewAction | PlayRemoveViewAction | PlayAddAggregateAction | PlayRemoveAggregateAction
  | PlayAddAggregateEventAction | PlayRemoveAggregateEventAction | PlayAddPureEventAction | PlayRemovePureEventAction | PlayAddEventPolicyAction | PlayRemoveEventPolicyAction);

type AfterDispatchListener = (state: CodyPlayConfig) => void;

const afterDispatchListeners: AfterDispatchListener[] = [];

const addAfterDispatchListener = (listener: AfterDispatchListener): void => {
  afterDispatchListeners.push(listener);
}

const clearAfterDispatchListener = (): void => {
  afterDispatchListeners.pop();
}

let currentDispatch: any;

const PlayConfigProvider = (props: PropsWithChildren) => {
  const [user, ] = useUser();
  const {env, setEnv} = useContext(EnvContext);
  const [config, dispatch] = useReducer((config: CodyPlayConfig, action: Action): CodyPlayConfig => {
    console.log(`[PlayConfigStore] Going to apply action: `, action);

    // Sync ElementEditedContext with config
    config.boardId = action.ctx.boardId;
    config.boardName = action.ctx.boardName;
    config.lastEditor = action.ctx.userId;
    config.origin = action.ctx.origin;

    switch (action.type) {
      case "INIT":
        const newConfig = _.isEmpty(action.payload)? initialPlayConfig : enhanceConfigWithDefaults(action.payload);
        syncTypesWithSharedRegistry(newConfig);
        window.setTimeout(() => {
          setEnv({...env, DEFAULT_SERVICE: names(config.defaultService).className, PAGES: config.pages as unknown as PageRegistry});
        }, 50);

        return newConfig;
      case "RENAME_APP":
        return {...config, appName: action.name};
      case "RENAME_DEFAULT_SERVICE":
        setEnv({...env, DEFAULT_SERVICE: action.name})
        return {...config, defaultService: action.name};
      case "CHANGE_LAYOUT":
        return {...config, layout: action.layout};
      case "CHANGE_THEME":
        return {...config, theme: action.theme};
      case "SET_PERSONAS":
        // Sync Auth Service
        getConfiguredPlayAuthService(getEditedContextFromConfig(config), action.personas, currentDispatch);
        return {...config, personas: action.personas};
      case "ADD_PERSONA":
        for (const existingPersona of config.personas) {
          if(existingPersona.userId === action.persona.userId) {
            return config
          }
        }

        const personasWithNew =  [...config.personas, action.persona];
        // Sync Auth Service
        getConfiguredPlayAuthService(getEditedContextFromConfig(config), personasWithNew, currentDispatch);
        return {...config, personas: personasWithNew};
      case "UPDATE_PERSONA":
        const personasWithoutUpdates = config.personas.filter(p => p.userId !== action.persona.userId);
        if (personasWithoutUpdates.length === config.personas.length) {
          return config;
        }

        const updatedPersonas =  [...personasWithoutUpdates, action.persona];
        // Sync Auth Service
        getConfiguredPlayAuthService(getEditedContextFromConfig(config), updatedPersonas, currentDispatch);
        return {...config, personas: updatedPersonas};
      case "ADD_PAGE":
        config.pages = {...config.pages};
        config.pages[action.name] = action.page;
        window.setTimeout(() => {
          setEnv({...env, PAGES: config.pages as unknown as PageRegistry});
        }, 50);

        return {...config};
      case "REMOVE_PAGE":
        config.pages = {...config.pages};
        delete config.pages[action.name];
        window.setTimeout(() => {
          setEnv({...env, PAGES: config.pages as unknown as PageRegistry});
        }, 50);
        return {...config};
      case "ADD_COMMAND":
        config.commands = {...config.commands};
        config.commands[action.name] = action.command;
        return {...config};
      case "REMOVE_COMMAND":
        config.commands = {...config.commands};
        delete config.commands[action.name];
        return {...config};
      case "ADD_COMMAND_HANDLER":
        config.commandHandlers = {...config.commandHandlers};
        config.commandHandlers[action.command] = action.businessRules;
        return {...config};
      case "REMOVE_COMMAND_HANDLER":
        config.commandHandlers = {...config.commandHandlers};
        delete config.commandHandlers[action.command];
        return {...config};
      case "ADD_TYPE":
        config.types = {...config.types};
        config.definitions = {...config.definitions};
        config.types[action.name] = action.information;
        config.definitions[action.definition.definitionId] = action.definition.schema;

        syncTypesWithSharedRegistry(config);
        return {...config};
      case "REMOVE_TYPE":
        config.types = {...config.types};
        config.definitions = {...config.definitions};

        delete config.types[action.name];
        delete config.definitions[playDefinitionIdFromFQCN(action.name)];
        return {...config};
      case "ADD_QUERY":
        config.queries = {...config.queries};
        config.resolvers = {...config.resolvers};
        config.views = {...config.views};
        config.queries[action.name] = action.query;
        config.resolvers[action.name] = action.resolver;
        return {...config};
      case "REMOVE_QUERY":
        config.queries = {...config.queries};
        config.resolvers = {...config.resolvers};

        delete config.queries[action.name];
        delete config.resolvers[action.name];
        return {...config};
      case "ADD_VIEW":
        config.views = {...config.views};
        config.views[action.name] = {information: action.information};
        return {...config};
      case "REMOVE_VIEW":
        config.views = {...config.views};
        delete config.views[action.name];
        return {...config};
      case "ADD_AGGREGATE":
        config.aggregates = {...config.aggregates};
        config.commandHandlers = {...config.commandHandlers};
        config.aggregates[action.name] = action.aggregate;
        config.commandHandlers[action.command] = action.businessRules;
        return {...config};
      case "REMOVE_AGGREGATE":
        config.aggregates = {...config.aggregates};
        config.eventReducers = {...config.eventReducers};

        delete config.aggregates[action.name];
        delete config.eventReducers[action.name];
        return {...config};
      case "ADD_PURE_EVENT":
        config.events = {...config.events};
        config.events[action.name] = action.event;
        return {...config};
      case "REMOVE_PURE_EVENT":
        config.events = {...config.events};
        delete config.events[action.name];
        return {...config};
      case "ADD_AGGREGATE_EVENT":
        config.events = {...config.events};
        config.eventReducers = {...config.eventReducers};
        config.eventReducers[action.aggregate] = {...config.eventReducers[action.aggregate]};
        config.events[action.name] = action.event;
        config.eventReducers[action.aggregate][action.name] = action.reducer;
        return {...config};
      case "REMOVE_AGGREGATE_EVENT":
        config.events = {...config.events};
        config.eventReducers = {...config.eventReducers};
        config.eventReducers[action.aggregate] = {...config.eventReducers[action.aggregate]};

        delete config.events[action.name];
        delete config.eventReducers[action.aggregate][action.name];
        return {...config};
      case "ADD_EVENT_POLICY":
        config.eventPolicies = {...config.eventPolicies};
        config.eventPolicies[action.event] = {...config.eventPolicies[action.event]};
        config.eventPolicies[action.event][action.name] = action.desc;
        return {...config};
      case "REMOVE_EVENT_POLICY":
        config.eventPolicies = {...config.eventPolicies};
        config.eventPolicies[action.event] = {...config.eventPolicies[action.event]};

        delete config.eventPolicies[action.event][action.name];
        return {...config};
      default:
        return config;
    }
  }, defaultPlayConfig);

  useEffect(() => {
    console.log("[PlayConfigStore] trigger after dispatch: ", config);
    afterDispatchListeners.forEach(l => l(config));
  }, [config]);

  useEffect(() => {
    getConfiguredPlayAuthService(getEditedContextFromConfig(config), config.personas, dispatch);
  })

  injectCustomApiQuery(makeLocalApiQuery(config, user));

  currentDispatch = dispatch;

  (window as any).$CP.dispatch = (action: Action) => {
    currentDispatch(action);
  }

  return <Provider value={{ config, dispatch }}>{props.children}</Provider>;
}

export {configStore, PlayConfigProvider, Action, addAfterDispatchListener, clearAfterDispatchListener};
