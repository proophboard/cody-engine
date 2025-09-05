import {playshot} from "@frontend/playconfig/playshot";
import {commands as commandTypes} from "@app/shared/commands";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import definitions from "@app/shared/types/definitions";
import {
  PlayPageDefinition,
  PlaySchemaDefinitions,
  PlayTopLevelPage,
  PlayViewComponentConfig
} from "@cody-play/state/types";
import {DevLogger} from "@frontend/util/Logger";
import {commands as commandComponents} from "@frontend/app/components/commands";
import {makeStandardCommandComponent} from "@frontend/app/components/core/commands/make-standard-command-component";
import {types} from "@app/shared/types";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {queries} from "@app/shared/queries";
import {makeQueryFactory} from "@cody-play/queries/make-query-factory";
import {views} from "@frontend/app/components/views";
import {
  isQueryableDescription,
  isQueryableListDescription,
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {makeStandardListViewComponent} from "@frontend/app/components/core/views/make-standard-list-view-component";
import {makeStandardStateViewComponent} from "@frontend/app/components/core/views/make-standard-state-view-component";
import {makeStaticStateViewComponent} from "@frontend/app/components/core/views/make-static-state-view-component";
import {pages} from "@frontend/app/pages";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {getBreadcrumbFnFromPlayPage} from "@frontend/playconfig/utils/get-breadcrumb-fn-from-play-page";
import {isTopLevelPage, PageDefinition, TopLevelPage} from "@frontend/app/pages/page-definitions";
import {makeMdiIcon} from "@frontend/app/components/core/views/make-mdi-icon";
import {Personas} from "@app/shared/extensions/personas";

export const bootstrapPlayFrontend = () => {
  registerTypes();
  registerCommands();
  registerQueries();
  registerViews();
  registerPages();
  registerPersonas();
}

const registerTypes = () => {
  for (const typeName in playshot.types) {
    const information = playshot.types[typeName];

    if(types[typeName]) {
      DevLogger.log(`[CodyPlay] Skipping play type "${typeName}". A custom type is configured.`);
      continue;
    }

    types[typeName] = {
      desc: information.desc,
      schema: information.schema,
      uiSchema: information.uiSchema,
      factory: makeInformationFactory(information.factory)
    };

    (definitions as any)[playDefinitionIdFromFQCN(typeName)] = information.schema;

    DevLogger.log(`[CodyPlay] Registered play type "${typeName}".`);
  }
}

const registerCommands = () => {
  for (const commandName in playshot.commands) {
    if(commandTypes[commandName]) {
      DevLogger.log(`[CodyPlay] Skipping play command "${commandName}". A custom command is configured.`)
      continue;
    }

    const command = playshot.commands[commandName];

    commandTypes[commandName] = {
      desc: command.desc,
      schema: command.schema,
      uiSchema: command.uiSchema,
      factory: makeCommandFactory(command, definitions as unknown as PlaySchemaDefinitions)
    }

    DevLogger.log(`[CodyPlay] Registered play command "${commandName}".`)

    if(commandComponents[commandName]) {
      DevLogger.log(`[CodyPlay] Skipping play command component "${commandName}". A custom component is configured.`);
      continue;
    }

    commandComponents[commandName] = makeStandardCommandComponent(commandTypes[commandName]);

    DevLogger.log(`[CodyPlay] Registered play command component "${commandName}"`);
  }
}

const registerQueries = () => {
  for (const queryName in playshot.queries) {
    if(queries[queryName]) {
      DevLogger.log(`[CodyPlay] Skipping play query "${queryName}". A custom query is configured.`)
      continue;
    }

    const query = playshot.queries[queryName];

    queries[queryName] = {
      desc: query.desc,
      schema: query.schema,
      factory: makeQueryFactory(query, definitions as unknown as PlaySchemaDefinitions)
    }

    DevLogger.log(`[CodyPlay] Registered play query "${queryName}".`)
  }
}

const registerViews = () => {
  for (const viewName in playshot.views) {
    if(views[viewName]) {
      DevLogger.log(`[CodyPlay] Skipping play view "${viewName}". A custom view is configured.`);
      continue;
    }

    const viewConfig = playshot.views[viewName] as PlayViewComponentConfig;

    const information  = types[viewConfig.information];

    if(!information) {
      DevLogger.warn(`[CodyPlay] Skipping view registration of view "${viewName}". Connected type "${viewConfig.information}" cannot be found in the types registry.`);
    }

    if (
      !isQueryableStateListDescription(information.desc) &&
      !isQueryableListDescription(information.desc) &&
      !isQueryableNotStoredStateListDescription(information.desc)
    ) {
      if(!isQueryableDescription(information.desc)) {
        views[viewName] = makeStaticStateViewComponent(information);

        DevLogger.log(`[CodyPlay] Registered play static view component "${viewName}".`);
      } else {
        const query = queries[information.desc.query];

        if(!query) {
          DevLogger.warn(`[CodyPlay] Skipping view registration of view "${viewName}". Query "${information.desc.query}" cannot be found in the query registry.`);
          continue;
        }

        views[viewName] = makeStandardStateViewComponent(information, query);

        DevLogger.log(`[CodyPlay] Registered play state view component "${viewName}".`);
      }
    } else {
      views[viewName] = makeStandardListViewComponent(information);

      DevLogger.log(`[CodyPlay] Registered play list view component "${viewName}".`);
    }
  }
}

const registerPages = () => {
  const pagesCopy = {...pages};

  for(const customPageName in pages) {
    delete pages[customPageName];
  }

  for (const pageName in playshot.pages) {
    if(pageName === "Welcome") {
      continue;
    }

    if(pagesCopy[pageName]) {
      DevLogger.log(`[CodyPlay] Skipping play page "${pageName}". A custom page is configured.`);
      continue;
    }

    let page = playshot.pages[pageName];

    if(isTopLevelPage(page as PageDefinition)) {
      page = normalizeSidebar(page) as PlayPageDefinition;
    }

    pages[pageName] = {
      ...page,
      breadcrumb: getBreadcrumbFnFromPlayPage(playshot.pages[pageName], playshot as CodyPlayConfig)
    };

    DevLogger.log(`[CodyPlay] Registered play page "${pageName}".`);
  }

  for(const copyPageName in pagesCopy) {
    pages[copyPageName] = pagesCopy[copyPageName];
  }
}

const normalizeSidebar = (page: any): TopLevelPage => {
  return {
    ...page,
    sidebar: {
      ...(page as TopLevelPage).sidebar,
      Icon: makeMdiIcon((page as PlayTopLevelPage).sidebar.icon) as any
    }
  }
}

const registerPersonas = () => {
  Personas.shift();
  Personas.reverse();

  playshot.personas.forEach(p => {
    Personas.unshift(p);

    DevLogger.log(`[CodyPlay] Registered play persona "${p.displayName}".`);
  });

  Personas.reverse();

}
