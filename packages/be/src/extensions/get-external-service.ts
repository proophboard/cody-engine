import {services} from "@server/extensions/services";

export const getExternalService = <T>(name: string, options: Record<string, any>): T | undefined => {
  const serviceFactory = services[name];

  if(!serviceFactory) {
    return;
  }

  return serviceFactory(options);
}

export const getExternalServiceOrThrow = <T>(name: string, options: Record<string, any>): T => {
  const service = getExternalService<T>(name, options);

  if(!service) {
    throw new Error(`Service "${name}" is not registered in @extensions/be/services`);
  }

  return service;
}
