import {cloneConfig, CodyPlayConfig} from "@cody-play/state/config-store";
import {visitRef} from "@cody-play/infrastructure/cody/schema/play-normalize-refs";
import {JSONSchema7} from "json-schema";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {UiSchema} from "@rjsf/utils";
import {CommandAction, isCommandAction} from "@frontend/app/components/core/form/types/action";
import {ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {isListDescription, isQueryableValueObjectDescription} from "@event-engine/descriptions/descriptions";

const makeRenameRef = (oldName: string, newName: string, oldFQCN: string, newFQCN: string): (ref: string) => string => {
  return (ref: string): string => {
    if(ref === oldName) {
      return newName;
    }

    if(ref === oldFQCN) {
      return newFQCN;
    }

    return ref;
  }
}

const visitDataReference = (uiSchema: UiSchema, visitor: (ref: string) => string): UiSchema => {
  if(typeof uiSchema !== "object") {
    return uiSchema;
  }

  if(uiSchema['ui:options'] && uiSchema['ui:options'].data) {
    uiSchema['ui:options'].data = visitor(String(uiSchema['ui:options'].data))
  }

  if(uiSchema['ui:table'] && uiSchema['ui:table'].columns && Array.isArray(uiSchema['ui:table'].columns)) {
    uiSchema['ui:table'].columns = uiSchema['ui:table'].columns.map((c: any) => {
      if(typeof c === "object" && c.ref && c.ref.data) {
        c.ref.data = visitor(c.ref.data);
      }

      return c;
    })
  }

  for (const uiSchemaKey in uiSchema) {
    if(!uiSchemaKey.startsWith('ui:')) {
      uiSchema[uiSchemaKey] = visitDataReference(uiSchema[uiSchemaKey], visitor);
    }
  }

  return uiSchema;
}

export const renameType = (oldTypeFQCN: string, newTypeFQCN: string, config: CodyPlayConfig): CodyPlayConfig => {
  const clonedConfig = cloneConfig(config);

  const oldDefinitionId = playDefinitionIdFromFQCN(oldTypeFQCN);
  const newDefinitionId = playDefinitionIdFromFQCN(newTypeFQCN);
  const oldDataReference = registryIdToDataReference(oldTypeFQCN);
  const newDataReference = registryIdToDataReference(newTypeFQCN);
  const renameRef = makeRenameRef(oldDefinitionId, newDefinitionId, oldTypeFQCN, newTypeFQCN);
  const renameDataRef = makeRenameRef(oldDataReference, newDataReference, oldTypeFQCN, newTypeFQCN);


  for (const commandName in clonedConfig.commands) {
    const command = clonedConfig.commands[commandName];

    clonedConfig.commands[commandName] = {
      ...command,
      schema: visitRef(command.schema as JSONSchema7, renameRef),
      uiSchema: visitDataReference(command.uiSchema || {}, renameDataRef),
    }
  }

  for (const eventName in clonedConfig.events) {
    const event = clonedConfig.events[eventName];

    clonedConfig.events[eventName] = {
      ...event,
      schema: visitRef(event.schema as JSONSchema7, renameRef),
    }
  }

  for (let typeName in clonedConfig.types) {
    const type = clonedConfig.types[typeName];

    if(typeName === oldTypeFQCN) {
      delete clonedConfig.types[typeName];
      delete clonedConfig.definitions[oldDefinitionId];
      typeName = newTypeFQCN;
    }

    const modifiedSchema = visitRef(type.schema as JSONSchema7, renameRef);
    const typeDesc = type.desc;

    if(typeDesc.name === oldTypeFQCN) {
      typeDesc.name = newTypeFQCN;
    }

    if(isQueryableValueObjectDescription(typeDesc)) {
      if(typeDesc.query === oldTypeFQCN) {
        typeDesc.query = newTypeFQCN;
      }
    }

    if(isListDescription(typeDesc)) {
      typeDesc.itemType = renameDataRef(typeDesc.itemType);
    }

    clonedConfig.types[typeName] = {
      ...type,
      desc: typeDesc,
      schema: modifiedSchema,
      uiSchema: visitDataReference(type.uiSchema || {}, renameDataRef),
    }

    clonedConfig.definitions[playDefinitionIdFromFQCN(typeName)] = modifiedSchema;
  }

  for (const pageName in clonedConfig.pages) {
    const page = clonedConfig.pages[pageName];

    clonedConfig.pages[pageName] = {
      ...page,
      commands: page.commands.map(c => {
        if(typeof c === "string") {
          return renameDataRef(c);
        }

        if(isCommandAction(c)) {
          return {
            ...c,
            command: renameDataRef(c.command),
            uiSchema: c.uiSchema ? visitDataReference(c.uiSchema, renameDataRef) : undefined
          } as CommandAction
        }

        return c;
      }),
      components: page.components.map(view => {
        if(typeof view === "string") {
          if(view === oldTypeFQCN) {
            return newTypeFQCN;
          }

          return view;
        }

        return {
          ...view,
          view: renameDataRef(view.view),
          uiSchema: view.uiSchema ? visitDataReference(view.uiSchema, renameDataRef) : undefined,
        } as ViewComponent
      })
    }
  }

  for (const viewName in clonedConfig.views) {
    const view = clonedConfig.views[viewName];

    if(typeof view === "object") {
      if(view.information === oldTypeFQCN) {
        view.information = newTypeFQCN;
      }
    }

    clonedConfig.views[viewName] = view;
  }

  for (let queryName in clonedConfig.queries) {
    const query = clonedConfig.queries[queryName];

    const queryDesc = query.desc;

    if(queryDesc.returnType === oldTypeFQCN) {
      queryDesc.returnType = newTypeFQCN;
    }

    if(queryName === oldTypeFQCN) {
      delete clonedConfig.queries[queryName];
      queryName = newTypeFQCN;
    }

    clonedConfig.queries[queryName] = {
      ...query,
      desc: queryDesc,
      schema: visitRef(query.schema as JSONSchema7, renameRef)
    }
  }

  return clonedConfig;
}
