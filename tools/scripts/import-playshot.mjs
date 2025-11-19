import { readFileSync, writeFileSync } from 'fs';

const playshotStr = readFileSync(process.cwd() + '/data/playshot.json').toString();

const playshot = JSON.parse(playshotStr).playConfig;

const bePlayshot = {
  defaultService: playshot.defaultService,
  commands: playshot.commands,
  commandHandlers: playshot.commandHandlers,
  aggregates: playshot.aggregates,
  events: playshot.events,
  eventReducers: playshot.eventReducers,
  eventPolicies: playshot.eventPolicies,
  queries: playshot.queries,
  resolvers: playshot.resolvers,
  types: playshot.types,
  definitions: playshot.definitions,
  services: playshot.services,
  personas: playshot.personas,
}

const bePath = process.cwd() + '/packages/be/src/playconfig/playshot.ts';

writeFileSync(bePath, `import {BePlayConfig} from "@server/playconfig/be-play-config";

export const playshot = ${JSON.stringify(bePlayshot, null, 2)} as unknown as BePlayConfig;
`);

console.log(`Imported backend playshot to: ${bePath}`);

const fePlayshot = {
  defaultService: playshot.defaultService,
  commands: playshot.commands,
  views: playshot.views,
  pages: playshot.pages,
  aggregates: playshot.aggregates,
  events: playshot.events,
  queries: playshot.queries,
  types: playshot.types,
  definitions: playshot.definitions,
  theme: playshot.theme,
  personas: playshot.personas,
}

const fePath = process.cwd() + '/packages/fe/src/playconfig/playshot.ts';

writeFileSync(fePath, `import {FePlayConfig} from "@frontend/playconfig/fe-play-config";

export const playshot = ${JSON.stringify(fePlayshot, null, 2)} as unknown as FePlayConfig;
`);

console.log(`Imported frontend playshot to: ${fePath}`);


