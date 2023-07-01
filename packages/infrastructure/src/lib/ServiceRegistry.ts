// The registry references service factory functions that should return a service instance
// The factory function receives options from Dependency configuration, see @descriptions/descriptions#Dependency
export type ServiceRegistry = {[serviceName: string]: (options: Record<string, any>) => any};
