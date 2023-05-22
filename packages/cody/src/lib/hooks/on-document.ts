import {CodyHook, Node} from "@proophboard/cody-types";
import {Context} from "./context";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {names} from "@event-engine/messaging/helpers";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {generateFiles} from "@nx/devkit";
import {namespaceToClassName, namespaceToFilePath, namespaceToJSONPointer} from "./utils/value-object/namespace";
import {voPath} from "./utils/value-object/vo-path";
import {detectDescriptionType} from "@event-engine/descriptions/descriptions";
import {detectService} from "./utils/detect-service";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {toJSON} from "./utils/to-json";
import {convertRuleConfigToValueObjectInitializeRules} from "./utils/rule-engine/convert-rule-config-to-behavior";
import {register, registerQuery, registerValueObjectDefinition} from "./utils/registry";
import {listChangesForCodyResponse} from "./utils/fs-tree";

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

    const tree = new FsTree(ctx.projectRoot, true);

    const ns = {
      ns: voMeta.ns,
      className: namespaceToClassName(voMeta.ns),
      path: namespaceToFilePath(voMeta.ns),
      JSONPointer: namespaceToJSONPointer(voMeta.ns)
    }

    // Register Value Object

    let initializeRules = '';

    if(voMeta.initialize) {
      initializeRules = withErrorCheck(convertRuleConfigToValueObjectInitializeRules, [vo, ctx, voMeta.initialize]);
    }

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
      ...withErrorCheck(updateProophBoardInfo, [vo, ctx, tree])
    });

    withErrorCheck(register, [vo, ctx, tree]);
    withErrorCheck(registerValueObjectDefinition, [service, vo, voMeta, ctx, tree]);

    // Register Query if VO is queryable

    if(voMeta.isQueryable) {
      generateFiles(tree, __dirname + '/query-files/shared', ctx.sharedSrc, {
        tmpl: "",
        service: serviceNames.fileName,
        serviceNames,
        voNames,
        ns,
        schema: voMeta.querySchema,
        toJSON,
        ...queryNames,
        ...withErrorCheck(updateProophBoardInfo, [vo, ctx, tree])
      });

      withErrorCheck(registerQuery, [service, vo, voMeta, ctx, tree]);
    }

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
