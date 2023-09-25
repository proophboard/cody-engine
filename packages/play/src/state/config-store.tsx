
import {
  PlayAddAggregateAction,
  PlayAddCommandAction,
  PlayAddPageAction, PlayAddQueryAction, PlayAddTypeAction,
  PlayAggregateRegistry, PlayApplyRulesRegistry, PlayCommandHandlerRegistry,
  PlayCommandRegistry, PlayEventRegistry, PlayInformationRegistry,
  PlayInitAction,
  PlayPageRegistry, PlayQueryRegistry, PlayResolverRegistry,
  PlaySchemaDefinitions, PlayTopLevelPage,
  PlayViewRegistry
} from "@cody-play/state/types";
import CoreWelcome from "@frontend/app/components/core/welcome";
import {createContext, PropsWithChildren, useEffect, useReducer} from "react";
import {
  AggregateCommandDescription,
  QueryableStateDescription,
  QueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {injectCustomApiQuery} from "@frontend/queries/use-api-query";
import {makeLocalApiQuery} from "@cody-play/queries/local-api-query";
import {useUser} from "@frontend/hooks/use-user";

export interface CodyPlayConfig {
  pages: PlayPageRegistry,
  views: PlayViewRegistry,
  commands: PlayCommandRegistry,
  commandHandlers: PlayCommandHandlerRegistry,
  aggregates: PlayAggregateRegistry,
  events: PlayEventRegistry,
  eventReducers: PlayApplyRulesRegistry,
  queries: PlayQueryRegistry,
  resolvers: PlayResolverRegistry,
  types: PlayInformationRegistry,
  definitions: PlaySchemaDefinitions,
}

const initialPlayConfig: CodyPlayConfig = {
  pages: {
    Dashboard: ({
      service: 'CrmTest',
      commands: [],
      components: ["Core.Welcome"],
      sidebar: {
        label: "Dashboard",
        icon: "ViewDashboard"
      },
      route: "/dashboard",
      topLevel: true,
      breadcrumb: 'Dashboard'
    } as PlayTopLevelPage),
    Cars: ({
      service: 'CrmTest',
      commands: ["FleetManagement.AddCarToFleet"],
      components: ["FleetManagement.CarList"],
      sidebar: {
        label: "Cars",
        icon: "CarMultiple"
      },
      route: "/cars",
      topLevel: true,
      breadcrumb: 'Cars'
    } as PlayTopLevelPage)
  },
  views: {
    "Core.Welcome": CoreWelcome,
    "FleetManagement.CarList": {
      information: "FleetManagement.Car.CarList"
    }
  },
  commands: {
    'FleetManagement.AddCarToFleet': {
      desc: ({
        name: 'FleetManagement.AddCarToFleet',
        aggregateCommand: true,
        newAggregate: true,
        aggregateName: 'FleetManagement.Car',
        aggregateIdentifier: 'vehicleId',
        dependencies: {
          'FleetManagement.GetBrand': {
            type: 'query',
            options: {
              mapping: {
                brandId: 'brand',
              },
            },
            alias: 'brand',
          },
        },
        _pbBoardId: 'ba59fb19-4d03-46fe-82a2-2725d61481ae',
        _pbCardId: '769vcgTup1x237QkfaD92U',
        _pbCreatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbCreatedAt: '2023-04-12T08:05:00+00',
        _pbLastUpdatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbLastUpdatedAt: '2023-07-25T21:35:42.940Z',
        _pbVersion: 9,
        _pbLink:
          'https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=769vcgTup1x237QkfaD92U&clicks=1',
      } as AggregateCommandDescription),
      factory: [],
      schema: {
        type: 'object',
        properties: {
          vehicleId: {
            type: 'string',
            title: 'Vehicle Id',
          },
          brand: {
            $ref: '/definitions/fleet-management/car/brand-ref',
            title: 'Brand',
          },
          model: {
            type: 'string',
            title: 'Model',
          },
          productionYear: {
            type: 'integer',
            minimum: 1900,
            title: 'Production Year',
          },
        },
        required: ['vehicleId', 'brand', 'model'],
        additionalProperties: false,
        $id: '/definitions/fleet-management/commands/add-car-to-fleet',
        title: 'Add Car To Fleet',
      },
      uiSchema: {
        'ui:button': {
          variant: 'text',
          color: 'warning',
          icon: 'car-back',
        },
        vehicleId: {
          'ui:hidden': "!isRole(user, 'Admin')",
        },
      }
    }
  },
  commandHandlers: {
    'FleetManagement.AddCarToFleet': [
      {
        rule: "always",
        then: {
          record: {
            event: "FleetManagement.Car.CarAdded",
            mapping: "command"
          }
        }
      },
      {
        rule: "condition",
        if: "command.productionYear",
        then: {
          record: {
            event: "FleetManagement.Car.CarAddedToFleet",
            mapping: {
              "vehicleId": "command.vehicleId"
            }
          }
        }
      }
    ]
  },
  aggregates: {
    'FleetManagement.Car': {
      name: 'FleetManagement.Car',
      identifier: "vehicleId",
      collection: "car_collection",
      stream: "write_model_stream",
      state: "FleetManagement.Car.Car",
      _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
      _pbCardId: "fiKF7BXDpp34fg4qTUC5Gr",
      _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
      _pbCreatedAt: "2023-04-12T08:05:00+00",
      _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
      _pbLastUpdatedAt: "2023-05-17T11:55:06.477Z",
      _pbVersion: 20,
      _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=fiKF7BXDpp34fg4qTUC5Gr&amp;clicks=1",
    }
  },
  events: {
    'FleetManagement.Car.CarAdded': {
      desc: {
        name: 'FleetManagement.Car.CarAdded',
        aggregateEvent: true,
        public: false,
        aggregateState: "FleetManagement.Car.Car",
        aggregateName: "FleetManagement.Car",
        aggregateIdentifier: "vehicleId",
        _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
        _pbCardId: "ncEudogeZ727TUbtRbbT4W",
        _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
        _pbCreatedAt: "2023-05-15T18:35:34.534Z",
        _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
        _pbLastUpdatedAt: "2023-05-16T22:04:18.830Z",
        _pbVersion: 4,
        _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=ncEudogeZ727TUbtRbbT4W&amp;clicks=1",
      },
      factory: [],
      schema: {
        "type": "object",
        "properties": {
          "vehicleId": {
            "type": "string"
          },
          "brand": {
            "type": "string"
          },
          "model": {
            "type": "string"
          },
          "productionYear": {
            "type": "integer",
            "minimum": 1900
          }
        },
        "required": [
          "vehicleId",
          "brand",
          "model",
          "productionYear"
        ],
        "additionalProperties": false,
        "$id": "/definitions/fleet-management/car/car-added"
      }
    },
    'FleetManagement.Car.CarAddedToFleet': {
      desc: {
        name: 'FleetManagement.Car.CarAddedToFleet',
        aggregateEvent: true,
        public: false,
        aggregateState: "FleetManagement.Car.Car",
        aggregateName: "FleetManagement.Car",
        aggregateIdentifier: "vehicleId",
        _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
        _pbCardId: "cQTvebiqthrzVnP4e1csvJ",
        _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
        _pbCreatedAt: "2023-04-12T08:05:00+00",
        _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
        _pbLastUpdatedAt: "2023-05-15T20:15:39.078Z",
        _pbVersion: 3,
        _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=cQTvebiqthrzVnP4e1csvJ&amp;clicks=1",
      },
      factory: [],
      schema: {
        "type": "object",
        "properties": {
          "vehicleId": {
            "type": "string"
          }
        },
        "required": [
          "vehicleId"
        ],
        "additionalProperties": false,
        "$id": "/definitions/fleet-management/car/car-added-to-fleet"
      }
    }
  },
  eventReducers: {
    'FleetManagement.Car': {
      'FleetManagement.Car.CarAdded': [
        {
          rule: "always",
          then: {
            assign: {
              variable: "information",
              value: "event"
            }
          }
        }
      ],
      'FleetManagement.Car.CarAddedToFleet': [
        {
          rule: "always",
          then: {
            assign: {
              variable: "information",
              value: {
                "$merge": "information",
                "completed": "true"
              }
            }
          }
        }
      ]
    }
  },
  queries: {
    'FleetManagement.GetBrandList': {
      desc: {
        name: 'FleetManagement.GetBrandList',
        returnType: 'FleetManagement.Car.BrandList',
        _pbBoardId: 'ba59fb19-4d03-46fe-82a2-2725d61481ae',
        _pbCardId: 'mjx58MGg9HfWsogJbZvL3T',
        _pbCreatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbCreatedAt: '2023-07-20T19:47:32.281Z',
        _pbLastUpdatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbLastUpdatedAt: '2023-07-25T20:01:29.215Z',
        _pbVersion: 2,
        _pbLink:
          'https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=mjx58MGg9HfWsogJbZvL3T&clicks=1',
      },
      factory: [],
      schema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
        title: 'Get Brand List',
      }
    }
  },
  resolvers: {
    'FleetManagement.GetBrandList': {}
  },
  types: {
    "FleetManagement.Car.BrandList": {
      desc: ({
        name: 'FleetManagement.Car.BrandList',
        isList: true,
        hasIdentifier: true,
        isQueryable: true,

        itemIdentifier: 'brandId',
        itemType: 'FleetManagement.Car.Brand',
        query: 'FleetManagement.GetBrandList',
        collection: 'brand_collection',
        _pbBoardId: 'ba59fb19-4d03-46fe-82a2-2725d61481ae',
        _pbCardId: 'mjx58MGg9HfWsogJbZvL3T',
        _pbCreatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbCreatedAt: '2023-07-20T19:47:32.281Z',
        _pbLastUpdatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbLastUpdatedAt: '2023-07-25T20:01:29.168Z',
        _pbVersion: 2,
        _pbLink:
          'https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=mjx58MGg9HfWsogJbZvL3T&clicks=1',
      } as QueryableStateListDescription),
      factory: [],
      schema: {
        type: 'array',
        items: {
          $ref: '/definitions/fleet-management/car/brand',
        },
        $id: '/definitions/fleet-management/car/brand-list',
        title: 'Brand List',
      },
      uiSchema: {}
    },
    "FleetManagement.Car.Car": {
      desc: ({
        name: 'FleetManagement.Car.Car',
        isList: false,
        hasIdentifier: true,
        isQueryable: true,
        identifier: 'vehicleId',
        query: 'FleetManagement.GetCar',
        collection: 'car_collection',
        _pbBoardId: 'ba59fb19-4d03-46fe-82a2-2725d61481ae',
        _pbCardId: 'buvRnYiNdBYqXibJZHiize',
        _pbCreatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbCreatedAt: '2023-04-12T08:05:00+00',
        _pbLastUpdatedBy: 'a35267cd-dfd0-410f-b64a-7163fd150352',
        _pbLastUpdatedAt: '2023-07-25T21:37:51.046Z',
        _pbVersion: 16,
        _pbLink:
          'https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=buvRnYiNdBYqXibJZHiize&clicks=1',
      } as QueryableStateDescription),
      factory: [],
      schema: {
        type: 'object',
        properties: {
          vehicleId: {
            type: 'string',
            title: 'Vehicle Id',
          },
          brand: {
            $ref: '/definitions/fleet-management/car/brand-ref',
            title: 'Brand',
          },
          model: {
            type: 'string',
            title: 'Model',
          },
          productionYear: {
            type: 'integer',
            minimum: 1900,
            title: 'Production Year',
          },
          completed: {
            type: 'boolean',
            title: 'Completed',
          },
        },
        required: ['vehicleId', 'brand', 'model'],
        additionalProperties: false,
        $id: '/definitions/fleet-management/car/car',
        title: 'Car',
      },
      uiSchema: {
        vehicleId: {
          'ui:hidden': "!isRole(user, 'Admin')",
        },
        brand: {
          'ui:title': 'Brand',
          'ui:widget': 'DataSelect',
          'ui:options': {
            data: '/Car/BrandList',
            text: 'data.name',
            value: 'data.brandId',
          },
        },
      }
    },
    "FleetManagement.Car.CarList": {
      desc: ({
        name: "FleetManagement.Car.CarList",
        isList: true,
        hasIdentifier: true,
        isQueryable: true,

        itemIdentifier: "vehicleId",
        itemType: "FleetManagement.Car.Car",
        query: "FleetManagement.GetCarList",
        collection: "car_collection",
        _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
        _pbCardId: "7jCd7ufbU3cigLRUwx756",
        _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
        _pbCreatedAt: "2023-05-23T11:28:49.322Z",
        _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
        _pbLastUpdatedAt: "2023-05-23T11:38:27.857Z",
        _pbVersion: 2,
        _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=7jCd7ufbU3cigLRUwx756&amp;clicks=1",
      } as QueryableStateListDescription),
      factory: [],
      schema: {
        "type": "array",
        "items": {
          "$ref": "/definitions/fleet-management/car/car"
        },
        "$id": "/definitions/fleet-management/car/car-list"
      },
      uiSchema: {
        'ui:table': {
          columns: [
            {
              field: "brand",
              headerName: "Brand",
              ref: {
                data: "FleetManagement.Car.BrandList",
                value: "data.name"
              }
            },
            "model",
            "productionYear"
          ]
        }
      }
    }
  },
  definitions: {
    '/definitions/fleet-management/car/brand-ref': {
      type: 'string',
      $id: '/definitions/fleet-management/car/brand-ref',
      title: 'Brand Ref',
    },
    '/definitions/fleet-management/car/brand': {
      type: 'object',
      properties: {
        brandId: {
          type: 'string',
          title: 'Brand Id',
        },
        name: {
          type: 'string',
          title: 'Name',
        },
        logoUrl: {
          type: 'string',
          title: 'Logo Url',
        },
      },
      required: ['brandId', 'name'],
      additionalProperties: false,
      $id: '/definitions/fleet-management/car/brand',
      title: 'Brand',
    },
    '/definitions/fleet-management/car/car': {
      type: 'object',
      properties: {
        vehicleId: {
          type: 'string',
          title: 'Vehicle Id',
        },
        brand: {
          $ref: '/definitions/fleet-management/car/brand-ref',
          title: 'Brand',
        },
        model: {
          type: 'string',
          title: 'Model',
        },
        productionYear: {
          type: 'integer',
          minimum: 1900,
          title: 'Production Year',
        },
        completed: {
          type: 'boolean',
          title: 'Completed',
        },
      },
      required: ['vehicleId', 'brand', 'model'],
      additionalProperties: false,
      $id: '/definitions/fleet-management/car/car',
      title: 'Car',
    }
  }
}

const configStore = createContext<{config: CodyPlayConfig, dispatch: (a: Action) => void}>({config: initialPlayConfig, dispatch: (action: Action) => {return;}});

const { Provider } = configStore;

type Action = PlayInitAction | PlayAddPageAction | PlayAddCommandAction | PlayAddTypeAction | PlayAddQueryAction | PlayAddAggregateAction;

type AfterDispatchListener = (state: CodyPlayConfig) => void;

const afterDispatchListeners: AfterDispatchListener[] = [];

const addAfterDispatchListener = (listener: AfterDispatchListener): void => {
  afterDispatchListeners.push(listener);
}

const clearAfterDispatchListener = (): void => {
  afterDispatchListeners.pop();
}

const PlayConfigProvider = (props: PropsWithChildren) => {
  const [user, ] = useUser();
  const [config, dispatch] = useReducer((config: CodyPlayConfig, action: Action): CodyPlayConfig => {
    switch (action.type) {
      case "INIT":
        const newConfig = { ...action.payload };
        newConfig.pages.Dashboard = initialPlayConfig.pages.Dashboard;
        newConfig.views["Core.Welcome"] = initialPlayConfig.views["Core.Welcome"];
        return newConfig;
      case "ADD_PAGE":
        config.pages = {...config.pages};
        config.pages[action.name] = action.page;
        return {...config};
      case "ADD_COMMAND":
        config.commands = {...config.commands};
        config.commands[action.name] = action.command;
        return {...config};
      case "ADD_TYPE":
        config.types = {...config.types};
        config.definitions = {...config.definitions};
        config.types[action.name] = action.information;
        config.definitions[action.definition.definitionId] = action.definition.schema;
        return {...config};
      case "ADD_QUERY":
        config.queries = {...config.queries};
        config.resolvers = {...config.resolvers};
        config.views = {...config.views};
        config.queries[action.name] = action.query;
        config.resolvers[action.name] = action.resolver;
        config.views[action.query.desc.returnType] = {information: action.query.desc.returnType};
        return {...config};
      case "ADD_AGGREGATE":
        config.aggregates = {...config.aggregates};
        config.commandHandlers = {...config.commandHandlers};
        config.aggregates[action.name] = action.aggregate;
        config.commandHandlers[action.command] = action.businessRules;
        return {...config};
      default:
        return config;
    }
  }, initialPlayConfig);

  useEffect(() => {
    console.log("trigger after dispatch: ", config);
    afterDispatchListeners.forEach(l => l(config));
  }, [config]);

  injectCustomApiQuery(makeLocalApiQuery(config, user));

  return <Provider value={{ config, dispatch }}>{props.children}</Provider>;
}

export {configStore, PlayConfigProvider, Action, addAfterDispatchListener, clearAfterDispatchListener};
