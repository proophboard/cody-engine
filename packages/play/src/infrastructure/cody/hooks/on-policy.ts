import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  CodyResponseException,
  playwithErrorCheck
} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playGetSourcesOfType, playGetTargetsOfType} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playEventPolicyMetadata} from "@cody-play/infrastructure/cody/event-policy/play-policy-metadata";
import {alwaysTriggerCommand} from "@cody-engine/cody/hooks/utils/policy/always-trigger-command";
import {playOriginalEvent} from "@cody-play/infrastructure/cody/event/play-original-event";
import {playEventMetadata} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {normalizeProjectionRules} from "@cody-play/infrastructure/rule-engine/normalize-projection-rules";
import {visitRulesThen} from "@cody-engine/cody/hooks/utils/rule-engine/visit-rule-then";
import {
  isDeleteInformation,
  isInsertInformation, isReplaceInformation,
  isUpdateInformation,
  isUpsertInformation
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {DEFAULT_READ_MODEL_PROJECTION} from "@event-engine/infrastructure/Projection/types";

export const onPolicy = async (policy: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {
    const policyNames = names(policy.getName());
    const service = playwithErrorCheck(playService, [policy, ctx]);
    const serviceNames = names(service);
    const policyName = `${serviceNames.className}.${policyNames.className}`;
    const meta = playwithErrorCheck(playEventPolicyMetadata, [policy, ctx]);
    const dependencies = meta.dependencies || {};
    const rules = normalizeProjectionRules(meta.rules || [], service, config);
    const isLiveProjection = !!meta.live;

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
      const commands = playwithErrorCheck(playGetTargetsOfType, [policy, NodeType.command]);

      commands.forEach(cmd => {
        const commandService = playwithErrorCheck(playService, [cmd, ctx]);
        const commandName = `${names(commandService).className}.${names(cmd.getName()).className}`;

        rules.push(alwaysTriggerCommand(commandName));
      })
    }

    const events = playwithErrorCheck(playGetSourcesOfType, [policy, NodeType.event, true]);

    events.forEach(event => {
      event = playOriginalEvent(event, ctx, config);
      const eventMeta = playwithErrorCheck(playEventMetadata, [event, ctx, config.types]);
      const pbInfo = playwithErrorCheck(playUpdateProophBoardInfo, [policy, ctx, (config.eventPolicies[eventMeta.fqcn] || {})[policyName]])

      dispatch({
        type: "ADD_EVENT_POLICY",
        name: policyName,
        event: eventMeta.fqcn,
        desc: {
          ...pbInfo,
          name: policyName,
          rules,
          dependencies,
          live: isLiveProjection,
          projection: projectionName
        }
      })
    })

    return {
      cody: `Policy "${policy.getName()}" is listening on events now.`,
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
