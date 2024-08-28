import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  CodyResponseException,
  playwithErrorCheck
} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {PlayValueObjectMetadata, playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playEnsureAllRefsAreKnown} from "@cody-play/infrastructure/cody/schema/play-ensure-all-refs-are-known";
import {
  detectDescriptionType,
  QueryableListDescription,
  QueryableNotStoredStateDescription,
  QueryableNotStoredValueObjectDescription,
  QueryableStateDescription,
  QueryableStateListDescription,
  QueryableValueObjectDescription,
  StateDescription,
  StateListDescription, StoredQueryableListDescription,
  ValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {
  playGetProophBoardInfoFromDescription,
  playUpdateProophBoardInfo
} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {namespaceToJSONPointer} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {playDefinitionId, playDefinitionIdFromFQCN,} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {JSONSchema7} from "json-schema";
import {normalizeProjectionRules} from "@cody-play/infrastructure/rule-engine/normalize-projection-rules";
import {convertProjectionConfigCaseToRules} from "@cody-engine/cody/hooks/utils/rule-engine/projection-config";
import {playFindEventInfoByName} from "@cody-play/infrastructure/events/play-find-event-info-by-name";
import {isInlineItemsArraySchema} from "@app/shared/utils/schema-checks";

export const onDocument = async (vo: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {
    const voNames = names(vo.getName());
    const voMeta = playwithErrorCheck(playVoMetadata, [vo, ctx, config.types]);
    const service = playwithErrorCheck(playService, [vo, ctx]);
    const serviceNames = names(service);
    let queryName = '';

    if(voMeta.isQueryable) {
      queryName = serviceNames.className + '.Get' + voNames.className;
    }

    playwithErrorCheck(playEnsureAllRefsAreKnown, [vo, voMeta.schema, config.types]);

    if(voMeta.querySchema) {
      playwithErrorCheck(playEnsureAllRefsAreKnown, [vo, voMeta.querySchema, config.types]);
    }

    const nsJsonPointer = namespaceToJSONPointer(voMeta.ns);

    const voFQCN = `${serviceNames.className}${nsJsonPointer}${voNames.className}`;

    const desc = getDesc(vo, voFQCN, voMeta, queryName, ctx, config);


    dispatch({
      type: "ADD_TYPE",
      name: voFQCN,
      information: {
        desc,
        schema: voMeta.schema,
        uiSchema: voMeta.uiSchema,
        factory: voMeta.initialize || []
      },
      definition: {
        definitionId: playwithErrorCheck(playDefinitionId, [vo, voMeta.ns, ctx]),
        schema: voMeta.schema
      }
    });

    if(isInlineItemsArraySchema(voMeta.schema)) {
      const itemDesc = getInlineItemDesc(vo, voFQCN, voMeta, desc);
      const itemSchema = voMeta.schema.items || {};
      const itemUiSchema = voMeta.uiSchema?.items || {};

      itemSchema.title = (voMeta.schema.title || '') + ' Item';
      itemSchema.$id = playDefinitionIdFromFQCN(itemDesc.name);

      dispatch({
        type: "ADD_TYPE",
        name: itemDesc.name,
        information: {
          desc: itemDesc,
          schema: itemSchema,
          uiSchema: itemUiSchema,
          factory: []
        },
        definition: {
          definitionId: itemSchema.$id,
          schema: itemSchema
        }
      });
    }

    if(voMeta.isQueryable) {
      const queryPbInfo = playUpdateProophBoardInfo(vo, ctx, config.queries[queryName]?.desc);

      if(voMeta.resolve && voMeta.resolve.rules) {
        voMeta.resolve = {...voMeta.resolve, rules: normalizeProjectionRules(voMeta.resolve.rules, service, config)}
      }

      dispatch({
        type: "ADD_QUERY",
        name: queryName,
        query: {
          desc: {
            ...queryPbInfo,
            name: queryName,
            returnType: voFQCN,
            dependencies: voMeta.queryDependencies,
          },
          schema: voMeta.querySchema || {} as JSONSchema7,
          factory: []
        },
        resolver: voMeta.resolve || {},
      })
    } else {
      dispatch({
        type: "ADD_VIEW",
        name: voFQCN
      })
    }

    if(voMeta.projection) {
      const prjName = voMeta.projection.name;

      const prjPbInfo = playGetProophBoardInfoFromDescription(desc);

      for (const prjCase of voMeta.projection.cases) {
        const evtInfo = playFindEventInfoByName(prjCase.when, config);

        if(!evtInfo) {
          return {
            cody: `Cannot install projection case for event ${prjCase.when}. The event is unknown. Did you forget to pass the event to Cody?`,
            type: CodyResponseType.Error
          }
        }

        dispatch({
          type: "ADD_EVENT_POLICY",
          name: prjName,
          event: evtInfo.desc.name,
          desc: {
            ...prjPbInfo,
            name: prjName,
            rules: convertProjectionConfigCaseToRules(prjCase),
            dependencies: {},
            live: voMeta.projection?.live,
            projection: prjName
          }
        })
      }
    }

    return {
      cody: `The data type (value object) "${vo.getName()}" is added to the app.`,
      details: `You can reference the data type in commands, events, queries and other data type using "${voFQCN}".`
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}

const getInlineItemDesc = (vo: Node, voName: string, voMeta: PlayValueObjectMetadata, desc: ValueObjectDescription): ValueObjectDescription | QueryableValueObjectDescription => {
  return {
    ...playGetProophBoardInfoFromDescription(desc),
    isList: false,
    isQueryable: desc.isQueryable,
    name: voName + 'Item',
    hasIdentifier: desc.hasIdentifier,
    isNotStored: desc.isNotStored,
    collection: desc.isQueryable && !desc.isNotStored? (desc as QueryableStateListDescription).collection || names(vo.getName()).constantName.toLowerCase() + '_collection' : undefined,
  }
}

const getDesc = (vo: Node, voName: string, voMeta: PlayValueObjectMetadata, queryName: string, ctx: ElementEditedContext, config: CodyPlayConfig): ValueObjectDescription | StateDescription | StateListDescription | QueryableValueObjectDescription | QueryableStateDescription | QueryableStateListDescription => {
  const pbInfo = playUpdateProophBoardInfo(vo, ctx, config.types[voName]?.desc);

  switch (detectDescriptionType(voMeta)) {
    case "StateDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: true,
        identifier: voMeta.identifier,
        isList: false,
        isQueryable: false,
      } as StateDescription);
    case "StateListDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: true,
        isList: true,
        isQueryable: false,
        itemIdentifier: voMeta.identifier,
        itemType: voMeta.itemType,

      } as StateListDescription);
    case "QueryableValueObjectDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: false,
        isList: voMeta.isList,
        isQueryable: true,
        query: queryName,
        collection: voMeta.collection,

      } as QueryableValueObjectDescription);
    case "QueryableNotStoredStateDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: true,
        identifier: voMeta.identifier,
        isList: false,
        isQueryable: true,
        query: queryName,
        isNotStored: true,
      } as QueryableNotStoredStateDescription);
    case "QueryableStateDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: true,
        identifier: voMeta.identifier,
        isList: false,
        isQueryable: true,
        query: queryName,
        collection: voMeta.collection,

      } as QueryableStateDescription);
    case "QueryableStateListDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: true,
        isList: true,
        isQueryable: true,
        itemIdentifier: voMeta.identifier,
        itemType: voMeta.itemType,
        query: queryName,
        collection: voMeta.collection,

      } as QueryableStateListDescription);
    case "QueryableNotStoredStateListDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: true,
        isList: true,
        isQueryable: true,
        itemIdentifier: voMeta.identifier,
        itemType: voMeta.itemType,
        query: queryName,
        isNotStored: true,
      } as QueryableStateListDescription);
    case "StoredQueryableListDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: false,
        isList: true,
        isQueryable: true,
        query: queryName,
        collection: voMeta.collection,
        itemType: voMeta.itemType,
      } as StoredQueryableListDescription);
    case "QueryableListDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: false,
        isList: true,
        isQueryable: true,
        query: queryName,
        itemType: voMeta.itemType
      } as QueryableListDescription);
    case "QueryableNotStoredValueObjectDescription":
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: false,
        isList: false,
        isQueryable: true,
        query: queryName,
        isNotStored: true,
      } as QueryableNotStoredValueObjectDescription);
    default:
      return ({
        ...pbInfo,
        name: voName,
        hasIdentifier: false,
        isList: voMeta.isList,
        isQueryable: false,
      } as ValueObjectDescription);
  }
}
