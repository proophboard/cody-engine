import {CodyResponse, Node} from "@proophboard/cody-types";
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
  QueryableStateDescription, QueryableStateListDescription,
  QueryableValueObjectDescription,
  StateDescription,
  StateListDescription,
  ValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {namespaceToJSONPointer} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {playDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {JSONSchema7} from "json-schema";

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

    const queryPbInfo = playUpdateProophBoardInfo(vo, ctx, config.queries[queryName]?.desc);

    dispatch({
      type: "ADD_QUERY",
      name: queryName,
      query: {
        desc: {
          name: queryName,
          returnType: voFQCN,
          ...queryPbInfo
        },
        schema: voMeta.querySchema || {} as JSONSchema7,
        factory: []
      },
      resolver: voMeta.resolve || {}
    })

    return {
      cody: `The data type (value object) "${vo.getName()}" is added to the app.`,
      details: `You can reference the data type in commands, events, queries and other data type using "${voMeta.ns}${voNames.className}".`
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}

const getDesc = (vo: Node, voName: string, voMeta: PlayValueObjectMetadata, queryName: string, ctx: ElementEditedContext, config: CodyPlayConfig): ValueObjectDescription | StateDescription | StateListDescription | QueryableValueObjectDescription | QueryableStateDescription | QueryableStateListDescription => {
  const pbInfo = playUpdateProophBoardInfo(vo, ctx, config.types[voName]?.desc);

  switch (detectDescriptionType(voMeta)) {
    case "StateDescription":
      return ({
        name: voName,
        hasIdentifier: true,
        identifier: voMeta.identifier,
        isList: false,
        isQueryable: false,
        ...pbInfo
      } as StateDescription);
    case "StateListDescription":
      return ({
        name: voName,
        hasIdentifier: true,
        isList: true,
        isQueryable: false,
        itemIdentifier: voMeta.identifier,
        ...pbInfo
      } as StateListDescription);
    case "QueryableValueObjectDescription":
      return ({
        name: voName,
        hasIdentifier: false,
        isList: voMeta.isList,
        isQueryable: true,
        query: queryName,
        collection: voMeta.collection,
        ...pbInfo
      } as QueryableValueObjectDescription);
    case "QueryableStateDescription":
      return ({
        name: voName,
        hasIdentifier: true,
        identifier: voMeta.identifier,
        isList: false,
        isQueryable: true,
        query: queryName,
        collection: voMeta.collection,
        ...pbInfo
      } as QueryableStateDescription);
    case "QueryableStateListDescription":
      return ({
        name: voName,
        hasIdentifier: true,
        isList: true,
        isQueryable: true,
        itemIdentifier: voMeta.identifier,
        query: queryName,
        collection: voMeta.collection,
        ...pbInfo
      } as QueryableStateListDescription);
    default:
      return ({
        name: voName,
        hasIdentifier: false,
        isList: voMeta.isList,
        isQueryable: false,
        ...pbInfo
      } as ValueObjectDescription);
  }
}
