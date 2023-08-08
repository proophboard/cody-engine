import {Event} from "@event-engine/messaging/event";
import {policies as extensionPolicies} from "@server/extensions/policies";
import {policies} from "@server/policies/index";
import {MessageBus} from "@server/infrastructure/MessageBus";
import {getConfiguredCommandBus, SERVICE_NAME_COMMAND_BUS} from "@server/infrastructure/configuredCommandBus";
import {services} from "@server/extensions/services";

export const SERVICE_NAME_EVENT_BUS = '$EventBus';

class EventBus extends MessageBus {
  public async on(event: Event): Promise<boolean> {
    const eventPolicies = {
      ...policies[event.name],
      ...extensionPolicies[event.name]
    }

    console.log("[EventBus] Policies for event: ", event.name, eventPolicies);

    for (const {policy, desc} of Object.values(eventPolicies)) {
      const dependencies = await this.loadDependencies(event, desc, 'event');

      dependencies[SERVICE_NAME_COMMAND_BUS] = services[SERVICE_NAME_COMMAND_BUS]? services[SERVICE_NAME_COMMAND_BUS]({}) : getConfiguredCommandBus();

      policy(event, dependencies).catch(e => console.error(e));
    }

    return true;
  }
}

let eventBus: EventBus;

export const getConfiguredEventBus = (): EventBus => {
  if(!eventBus) {
    eventBus = new EventBus();
  }

  return eventBus;
}
