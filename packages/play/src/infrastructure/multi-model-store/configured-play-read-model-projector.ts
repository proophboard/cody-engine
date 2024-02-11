import {EventStore, MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {InformationService} from "@server/infrastructure/information-service/information-service";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {DEFAULT_READ_MODEL_PROJECTION} from "@event-engine/infrastructure/Projection/types";
import {Event} from "@event-engine/messaging/event";
import {PlayEventPolicyDescription} from "@cody-play/state/types";
import {playLoadDependencies} from "@cody-play/infrastructure/cody/dependencies/play-load-dependencies";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";

class PlayReadModelProjector {
  private eventStore: EventStore;
  private config: CodyPlayConfig;


  constructor(eventStore: EventStore, config: CodyPlayConfig) {
    this.eventStore = eventStore;
    this.config = config;
  }

  public async run(streamName: string, metadataMatcher?: MetadataMatcher, projectionName?: string, fromEventId?: string, limit?: number): Promise<void> {
    if(!projectionName) {
      projectionName = DEFAULT_READ_MODEL_PROJECTION;
    }

    const events = await this.eventStore.load(streamName, metadataMatcher, fromEventId, limit);

    for await (const event of events) {
      const policies = this.getEventProjections(event, projectionName);

      if(!policies) {
        continue;
      }

      for (const policy of Object.values(policies)) {
        console.log(`[Projector] Going to execute projection rules of "${projectionName}.${policy.name}"`)
        try {
          const dependencies = await playLoadDependencies(event, 'event', policy.dependencies || {}, this.config);

          const ctx = {event: event.payload, meta: event.meta, ...dependencies, commandRegistry: this.config.commands, schemaDefinitions: this.config.definitions};
          const exe = makeAsyncExecutable(policy.rules);
          const result = await exe(ctx);

          if(result['commands']) {
            throw new Error(`Projection "${policy.name}" triggered a command. This is not allowed for a projection. Please check its rules!`)
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  private getEventProjections(event: Event, projectionName: string): {[policyName: string]: PlayEventPolicyDescription} | null {
    if(this.config.eventPolicies[event.name]) {
      const filteredPolicies: {[policyName: string]: PlayEventPolicyDescription} = {};

      for (const policyName in this.config.eventPolicies[event.name]) {
        const policy = this.config.eventPolicies[event.name][policyName];

        if(policy.projection === projectionName) {
          filteredPolicies[policyName] = policy;
        }
      }

      return filteredPolicies
    }

    return null;
  }
}

export const getConfiguredPlayReadModelProjector = (config: CodyPlayConfig) => {
  const es = getConfiguredPlayEventStore();
  return new PlayReadModelProjector(es, config);
}
