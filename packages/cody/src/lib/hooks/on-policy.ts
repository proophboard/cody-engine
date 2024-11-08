import {CodyHook, CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {names} from "@event-engine/messaging/helpers";
import {getSingleSource, getTargetsOfType, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {detectService} from "./utils/detect-service";
import {flushChanges} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {registerPolicy} from "./utils/registry";
import {alwaysTriggerCommand} from "./utils/policy/always-trigger-command";
import {convertRuleConfigToPolicyRules} from "@cody-engine/cody/hooks/rule-engine/convert-rule-config-to-behavior";
import {toJSON} from "./utils/to-json";
import {PolicyMeta} from "@cody-engine/cody/hooks/utils/policy/metadata";
import {visitRulesThen} from "@cody-engine/cody/hooks/rule-engine/visit-rule-then";
import {
  isDeleteInformation,
  isInsertInformation,
  isReplaceInformation,
  isUpdateInformation,
  isUpsertInformation
} from "@app/shared/rule-engine/configuration";
import {DEFAULT_READ_MODEL_PROJECTION} from "@event-engine/infrastructure/Projection/types";

export const onPolicy: CodyHook<Context> = async (policy: Node, ctx: Context): Promise<CodyResponse> => {
  try {
    const policyNames = names(policy.getName());
    const meta = policy.getMetadata() ? withErrorCheck(parseJsonMetadata, [policy]) as PolicyMeta : {} as PolicyMeta;
    const service = withErrorCheck(detectService, [policy, ctx]);
    const serviceNames = names(service);
    const dependencies = meta.dependencies;
    const isLiveProjection = !!meta.live;

    const rules = meta.rules || [];

    let isProjection = false;

    visitRulesThen(rules, then => {
      switch (true) {
        case isInsertInformation(then):
        case isUpsertInformation(then):
        case isUpdateInformation(then):
        case isReplaceInformation(then):
        case isDeleteInformation(then):
          isProjection = true;
          break
      }

      return then;
    })

    const projectionName = isProjection? meta.projection || DEFAULT_READ_MODEL_PROJECTION : undefined;

    if(rules.length === 0) {
      const commands = withErrorCheck(getTargetsOfType, [policy, NodeType.command, true, false, true]);

      commands.forEach(command => {
        const commandService = withErrorCheck(detectService, [command, ctx]);
        const commandName = `${names(commandService).className}.${names(command.getName()).className}`;

        rules.push(alwaysTriggerCommand(commandName));
      });
    }

    const behavior = withErrorCheck(convertRuleConfigToPolicyRules, [
      policy,
      ctx,
      rules,
      [
        {name: 'event', initializer: 'event.payload'},
        {name: 'meta', initializer: 'event.meta'},
        {name: 'eventCreatedAt', initializer: 'event.createdAt'}
      ]
    ]);

    const {tree} = ctx;

    const event = getSingleSource(policy, NodeType.event);

    if(isCodyError(event)) {
      return event;
    }

    generateFiles(tree, __dirname + '/policy-files/be', ctx.beSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      'event': names(event.getName()).fileName,
      ...withErrorCheck(updateProophBoardInfo, [policy, ctx, tree]),
      serviceNames,
      dependencies,
      ...policyNames,
      behavior,
      isProjection,
      isLiveProjection,
      projectionName,
      toJSON,
    });

    withErrorCheck(registerPolicy, [service, policy, event, ctx, tree]);

    await formatFiles(tree);

    const changes = tree.listChanges();

    flushChanges(ctx.projectRoot, changes);

    return {
      cody: `Policy "${policy.getName()}" is listening on events now.`,
      details: listChangesForCodyResponse(tree),
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
