import {CodyHook, CodyResponseType, Node, NodeRecord, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {asyncWithErrorCheck, CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {names} from "@event-engine/messaging/helpers";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {flushChanges} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";
import {namespaceNames, valueObjectNamespaceFromFQCN} from "./utils/value-object/namespace";
import {voPath} from "./utils/value-object/vo-path";
import {
  detectDescriptionType,
  isQueryableListDescription,
  isQueryableNotStoredStateDescription,
  isQueryableNotStoredStateListDescription,
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateListDescription,
  isQueryableValueObjectDescription,
} from "@event-engine/descriptions/descriptions";
import {detectService} from "./utils/detect-service";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {toJSON} from "./utils/to-json";
import {
  convertRuleConfigToValueObjectInitializeRules
} from "@cody-engine/cody/hooks/rule-engine/convert-rule-config-to-behavior";
import {register, registerQuery, registerQueryResolver, registerValueObjectDefinition} from "./utils/registry";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {makeQueryResolver} from "./utils/query/make-query-resolver";
import {definitionIdFromFQCN, voClassNameFromFQCN, voFQCN} from "./utils/value-object/definitions";
import {upsertListViewComponent} from "./utils/ui/upsert-list-view-component";
import {upsertStateViewComponent} from "./utils/ui/upsert-state-view-component";
import {ensureAllRefsAreKnown} from "./utils/json-schema/ensure-all-refs-are-known";
import {isInlineItemsArraySchema} from "@app/shared/utils/schema-checks";
import {ValueObjectMetadata} from "@cody-engine/cody/hooks/utils/value-object/types";
import {JSONSchema7} from "json-schema-to-ts";
import {requireUncachedTypes} from "@cody-engine/cody/hooks/utils/value-object/require-uncached-types";
import {Rule} from "@app/shared/rule-engine/configuration";
import {List} from "immutable";
import {convertProjectionConfigCaseToRules} from "@app/shared/rule-engine/projection-config";
import {onPolicy} from "@cody-engine/cody/hooks/on-policy";
import {normalizeDependencies} from "@cody-play/infrastructure/rule-engine/normalize-dependencies";
import {upsertStaticViewComponent} from "@cody-engine/cody/hooks/utils/ui/upsert-static-view-component";
import {nodeNameFQCN} from "@cody-engine/cody/hooks/utils/node-fqcn";
import {getNodeFromSyncedNodesByFQCN} from "@cody-engine/cody/hooks/utils/node-tree";
import {isCodyError} from "@proophboard/cody-utils";

export const onDocument: CodyHook<Context> = async (vo: Node, ctx: Context) => {
  try {
    const voNames = names(vo.getName());
    const voMeta = withErrorCheck(getVoMetadata, [vo, ctx]);
    const service = withErrorCheck(detectService, [vo, ctx]);
    const serviceNames = names(service);
    let queryNames;

    if(voMeta.isQueryable) {
      queryNames = names('Get' + voNames.className);
    }

    const tree = ctx.tree();

    const ns = namespaceNames(voMeta.ns);

    // Register Value Object

    let initializeRules = '';

    if(voMeta.initialize) {
      initializeRules = withErrorCheck(convertRuleConfigToValueObjectInitializeRules, [vo, ctx, voMeta.initialize]);
    }

    withErrorCheck(ensureAllRefsAreKnown, [vo, voMeta.schema]);

    const proophBoardInfo = withErrorCheck(updateProophBoardInfo, [vo, ctx, tree]);

    generateFiles(tree, __dirname + '/vo-files/shared/types', withErrorCheck(voPath, [vo, voMeta, ctx]), {
      tmpl: "",
      "descriptionType": detectDescriptionType(voMeta),
      ...voNames,
      serviceNames,
      meta: voMeta,
      queryNames,
      ns,
      toJSON,
      initializeRules,
      ...proophBoardInfo
    });

    withErrorCheck(register, [vo, ctx, tree]);
    withErrorCheck(registerValueObjectDefinition, [service, vo, voMeta, ctx, tree]);

    // Register Item Type + Query for inline array item
    let itemFQCN, itemSchema, itemUiSchema;

    const makeQueryProperties = (identifier: string): Record<string, JSONSchema7> => {
      const props: Record<string, any> = {};
      props[identifier] = {type: "string", format: "uuid"} as JSONSchema7;

      return props;
    }

    if(isInlineItemsArraySchema(voMeta.schema)) {
      itemFQCN = withErrorCheck(voFQCN, [vo, voMeta, ctx]) + "Item";
      itemSchema = voMeta.schema.items || {};
      itemUiSchema = voMeta.uiSchema?.items || {};
      itemSchema.title = (voMeta.schema.title || '') + ' Item';
      itemSchema.$id = definitionIdFromFQCN(itemFQCN);
      const itemMeta = {
        ...voMeta,
        isList: false,
        schema: itemSchema as JSONSchema7,
        uiSchema: itemUiSchema,
        isQueryable: false,
      };

      if(itemMeta.querySchema) {
        delete itemMeta.querySchema;
      }

      if(itemMeta.collection) {
        delete itemMeta.collection;
      }

      if(itemMeta.queryDependencies) {
        delete itemMeta.queryDependencies;
      }

      if(itemMeta.projection) {
        delete itemMeta.projection;
      }

      const itemNames = names(voNames.className + "Item");
      const itemVO = makeTempItemVOFromListVo(vo, itemMeta);

      generateFiles(tree, __dirname + '/vo-files/shared/types', withErrorCheck(voPath, [vo, voMeta, ctx]), {
        tmpl: "",
        "descriptionType": detectDescriptionType(itemMeta),
        ...itemNames,
        serviceNames,
        meta: itemMeta,
        queryNames: undefined,
        ns,
        toJSON,
        initializeRules: '',
        ...proophBoardInfo
      });

      withErrorCheck(register, [itemVO, ctx, tree]);
      withErrorCheck(registerValueObjectDefinition, [service, itemVO, itemMeta, ctx, tree]);
    }

    // Register Query if VO is queryable
    if(voMeta.isQueryable) {

      withErrorCheck(ensureAllRefsAreKnown, [vo, voMeta.querySchema!]);

      const dependencies = normalizeDependencies(voMeta.queryDependencies, serviceNames.className);

      generateFiles(tree, __dirname + '/query-files/shared', ctx.sharedSrc, {
        tmpl: "",
        service: serviceNames.fileName,
        serviceNames,
        voNames,
        ns,
        schema: voMeta.querySchema,
        dependencies,
        toJSON,
        ...queryNames,
        ...withErrorCheck(updateProophBoardInfo, [vo, ctx, tree])
      });

      withErrorCheck(registerQuery, [service, vo, voMeta, ctx, tree]);

      let itemNames, itemNS, isList = false, isSingleVOQuery = false;

      if(isQueryableStateListDescription(voMeta) || isQueryableListDescription(voMeta) || isQueryableNotStoredStateListDescription(voMeta)) {
        itemNames = names(voClassNameFromFQCN(voMeta.itemType));
        itemNS = namespaceNames(valueObjectNamespaceFromFQCN(voMeta.itemType));
        isList = true;

        // item is a RefSchema (not inline), so we should be able to get it from the type registry
        if(!itemSchema) {
          const types = requireUncachedTypes();

          if(!types[voMeta.itemType]) {
            return {
              cody: `Can't find the type ${voMeta.itemType} in the type registry!`,
              details: "Please pass the corresponding document card to Cody",
              type: CodyResponseType.Error
            }
          }

          itemSchema = types[voMeta.itemType].schema as JSONSchema7;
          itemUiSchema = types[voMeta.itemType].uiSchema || {};
        }

      } else if (isQueryableValueObjectDescription(voMeta) || isQueryableNotStoredStateDescription(voMeta) || isQueryableNotStoredValueObjectDescription(voMeta)) {
        isSingleVOQuery = true;
      }


      generateFiles(tree, __dirname + '/query-files/be', ctx.beSrc, {
        tmpl: "",
        service: serviceNames.fileName,
        serviceNames,
        voNames,
        ns,
        isList,
        isSingleVOQuery,
        itemNames,
        itemNS,
        ...queryNames,
        resolve: ctx.codeGeneration.be.resolverLogic ? withErrorCheck(makeQueryResolver, [vo, voMeta, ctx]) : '',
      });

      withErrorCheck(registerQueryResolver, [service, vo, ctx, tree]);

      if(ctx.codeGeneration.fe.reactHooks) {
        generateFiles(tree, __dirname + '/query-files/fe', ctx.feSrc, {
          tmpl: "",
          service: serviceNames.fileName,
          serviceNames,
          voNames,
          ns,
          isList,
          ...queryNames
        });
      }

      if(ctx.codeGeneration.fe.reactComponents) {
        // Upsert View Component
        if(isList) {
          await asyncWithErrorCheck(upsertListViewComponent, [vo, voMeta, ctx, tree, voMeta.itemType as string, itemSchema as JSONSchema7, itemUiSchema]);
        } else {
          await asyncWithErrorCheck(upsertStateViewComponent, [vo, voMeta, ctx, tree]);
        }
      }
    } else {
      // Handle Static View
      if(ctx.codeGeneration.fe.reactComponents && voMeta.staticView) {
        await asyncWithErrorCheck(upsertStaticViewComponent, [vo, voMeta, ctx, tree]);
      }
    }

    // Handle projection
    if(voMeta.projection) {
      const prjName = voMeta.projection.name;

      for (const prjCase of voMeta.projection.cases) {
        const eventFQCN = nodeNameFQCN(prjCase.when, serviceNames.className);

        const matchingEvent = getNodeFromSyncedNodesByFQCN(eventFQCN, NodeType.event, ctx.syncedNodes, ctx);

        if(isCodyError(matchingEvent)) {
          return {
            cody: `Cannot install projection case for event ${prjCase.when}. The event is unknown. Did you forget to pass the event to Cody?`,
            type: CodyResponseType.Error
          }
        }

        await asyncWithErrorCheck(onPolicy, [makeTempPolicyProjectionFromVO(
          vo,
          matchingEvent,
          prjName,
          convertProjectionConfigCaseToRules(prjCase),
          voMeta
        ), ctx])
      }
    }


    await formatFiles(tree);

    const changes = tree.listChanges();

    flushChanges(ctx.projectRoot, changes);

    return {
      cody: `The data type (value object) "${vo.getName()}" is added to the app.`,
      details: `You can reference the data type in commands, events, queries and other data type using "${voMeta.ns}${voNames.className}".\n\n`
        + listChangesForCodyResponse(tree)
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}

const makeTempItemVOFromListVo = (listVO: Node, itemVoMeta: ValueObjectMetadata): Node => {
  return new NodeRecord({
    id: 'tmp_item_vo_from_list_vo_' + listVO.getId(),
    name: listVO.getName() + "Item",
    type: NodeType.document,
    link: listVO.getLink(),
    metadata: JSON.stringify(itemVoMeta),
  })
}

const makeTempPolicyProjectionFromVO = (vo: Node, event: Node, projectionName: string, rules: Rule[], voMeta: ValueObjectMetadata): Node => {
  return new NodeRecord({
    id: 'tmp_projection_policy_from_vo_' + vo.getId(),
    name: projectionName,
    type: NodeType.policy,
    link: vo.getLink(),
    metadata: JSON.stringify({
      projection: projectionName,
      live: voMeta.projection?.live,
      rules,
    }),
    sourcesList: List([event])
  })
}
