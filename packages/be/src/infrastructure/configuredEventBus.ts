import {Event} from "@event-engine/messaging/event";
import {policies as extensionPolicies} from "@server/extensions/policies";
import {policies} from "@server/policies/index";
import {MessageBus} from "@server/infrastructure/MessageBus";
import {getConfiguredCommandBus, SERVICE_NAME_COMMAND_BUS} from "@server/infrastructure/configuredCommandBus";
import {services} from "@server/extensions/services";
import {EventBus} from "@event-engine/messaging/event-bus";

export const SERVICE_NAME_EVENT_BUS = '$EventBus';

class LiveEventBus extends MessageBus implements EventBus {
  public async on(event: Event, triggerLiveProjections?: boolean): Promise<boolean> {
    const eventPolicies = {
      ...policies[event.name],
      ...extensionPolicies[event.name]
    }

    const filteredPolicies = Object.values(eventPolicies).filter(({policy, desc}) => !!desc.live === !!triggerLiveProjections);

    console.log("[EventBus] "+(triggerLiveProjections? 'Live Projections' : 'Policies')+" for event: ", event.name, filteredPolicies.map(({policy, desc}) => desc));

    for (const {policy, desc} of filteredPolicies) {
      const dependencies = await this.loadDependencies(event, desc, 'event');

      dependencies[SERVICE_NAME_COMMAND_BUS] = services[SERVICE_NAME_COMMAND_BUS]? services[SERVICE_NAME_COMMAND_BUS]({}) : getConfiguredCommandBus();

      if(triggerLiveProjections) {
        await policy(event, dependencies);
      } else {
        policy(event, dependencies).catch(e => console.error(e));
      }

    }

    return true;
  }

  public async runProjection(event: Event, projectionName: string): Promise<boolean> {
    const eventPolicies = {
      ...policies[event.name],
      ...extensionPolicies[event.name]
    }

    const filteredPolicies = Object.values(eventPolicies)
      .filter(({policy, desc}) => desc.projection && desc.projection === projectionName);

    console.log(`[EventBus] Running projection ${projectionName} for event: `, event.name, filteredPolicies.map(({policy, desc}) => desc));

    for (const {policy, desc} of filteredPolicies) {
      const dependencies = await this.loadDependencies(event, desc, 'event');

      policy(event, dependencies).catch(e => console.error(e));
    }

    return true;
  }
}

let eventBus: LiveEventBus;

export const getConfiguredEventBus = (): LiveEventBus => {
  if(!eventBus) {
    eventBus = new LiveEventBus();
  }

  return eventBus;
}
