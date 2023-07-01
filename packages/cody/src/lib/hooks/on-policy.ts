import {CodyHook, CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {Rule} from "./utils/rule-engine/configuration";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {names} from "@event-engine/messaging/helpers";
import {getTargetsOfType, parseJsonMetadata} from "@proophboard/cody-utils";
import {detectService} from "./utils/detect-service";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {registerPolicy} from "./utils/registry";
import {alwaysTriggerCommand} from "./utils/policy/always-trigger-command";
import {convertRuleConfigToPolicyRules} from "./utils/rule-engine/convert-rule-config-to-behavior";
import {toJSON} from "./utils/to-json";

interface PolicyMeta {
  service?: string;
  dependencies?: DependencyRegistry;
  rules?: Rule[];
}

export const onPolicy: CodyHook<Context> = async (policy: Node, ctx: Context): Promise<CodyResponse> => {
  try {
    const policyNames = names(policy.getName());
    const meta = policy.getMetadata() ? withErrorCheck(parseJsonMetadata, [policy]) as PolicyMeta : {} as PolicyMeta;
    const service = withErrorCheck(detectService, [policy, ctx]);
    const serviceNames = names(service);
    const dependencies = meta.dependencies;

    let rules = meta.rules || [];

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
        {name: 'eventMeta', initializer: 'event.meta'},
      ]
    ]);

    const tree = new FsTree(ctx.projectRoot, true);

    generateFiles(tree, __dirname + '/policy-files/be', ctx.beSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      ...withErrorCheck(updateProophBoardInfo, [policy, ctx, tree]),
      serviceNames,
      dependencies,
      ...policyNames,
      behavior,
      toJSON,
    });

    withErrorCheck(registerPolicy, [service, policy, ctx, tree]);

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
