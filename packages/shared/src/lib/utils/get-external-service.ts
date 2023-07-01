import {services} from "@app/extensions/be/services";

export const getExternalService = <T>(name: string): T | undefined => {
  return services[name] as T;
}
