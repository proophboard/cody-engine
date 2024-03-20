# CodyEngine

Looking for a way to bridge the gap between Event Modeling and prototyping or even production-ready solutions?

[Cody]({{site.baseUrl}}/cody/introduction.html) sounds nice, but developing your own code generator on top of it is too much of a hassle?

We've got you covered! 💪

Cody Engine is a **ready-to-use** Open Source solution to transform [Event Modeling on prooph board](https://wiki.prooph-board.com/event_modeling/event-modeling-on-prooph-board.html)
into a prototype and if you want also into a production-ready system.

## Installation 

```
git clone https://github.com/proophboard/cody-engine.git my-app
cd my-app
npm install
```

## Start system

`npm run serve`

This will start:

- NodeJS backend (API + biz logic) on: [http://localhost:4100](http://localhost:4100)
- Webpack Dev Server + API Proxy serving React Frontend on: [http://localhost:4200](http://localhost:4200)
- Cody Server on default port: [http://localhost:3311](http://localhost:3311)

## Prepare Database

`npx nx run be:preparedb`

## Push to your own repo

If you want to keep a connection to the upstream repo `cody-engine` you can do:

```
git remote rename origin cody-engine
git remote add origin my-app-repo
```

*This allows you to still pull changes like Cody bugfixes or new features with `git pull cody-engine main`*

Otherwise, just delete the `.git` folder in the project root and start with a fresh `git init`

## Production Build

Cody Engine works with packages insight a mono repo. The packages you'll likely deploy to production are:

- `packages/be`
- `packages/fe`
- `packages/shared`

The shared package is used in the frontend as well as in the backend. Cody generates most of the type classes and interfaces (e.g. for commands, queries, events, value objects)
into this shared package. Frontend and Backend include the shared package in their respective builds.

### Backend Build

`npx nx build be` -> builds into `dist/packages/be`

You can also build a docker image with:

`npx nx run be:docker-build`

### Frontend Build

`npx nx build fe` -> builds into `dist/packages/fe`

The frontend build can be served by a reverse proxy like Nginx. The reverse proxy should forward all requests to `/api/*`
to the backend service.

## Prototype Mode

By default, Cody Engine runs in a prototyping mode. This means, that the app is not secured by authentication and data is
only written to json files located in the `data` directory.

The mode can be changed so that Cody Engine connects to a `Postgres` database and uses an authentication server like `Keycloak`.

However, the needed extensions are not part of the Open Source Cody Engine. If you're interested in running Cody Engine as a
production system, please get in touch with the [prooph board team](https://prooph-software.de/#board).

## Extension Points

Cody will generate fully working source code for frontend and backend. However, low code has limitations. 
At some point you'll hit a use case that can't be handled without some custom development be it in the frontend or backend.
Therefor, Cody Engine ships with many extension points to let you override code generated behavior.

You'll find `extensions` directories in all main packages (fe, be, shared) with files to guide you how to inject your own logic.
As long as you only modify or add files in the `extensions` directories, you should be able to pull updates from the `cody-engine` upstream repository.

### Example

Let's say you want to override a handler function for a specific command. You can add your custom command handler to:
`packages/be/src/extensions/command-handlers.ts`

```ts
import {CommandHandlerRegistry} from "@event-engine/infrastructure/commandHandling";
import {handleCommandWithCustomHandler} from "@server/extensions/command-handlers/handle-command-with-custom-handler"

export const commandHandlerExtensions: CommandHandlerRegistry = {
  'MyService.CommandWithCustomHandler': handleCommandWithCustomHander,
};
```

*Please Note: Every extension registry file (like the one shown in the example above) uses a specific registry type (e.g. CommandHandlerRegistry). Check the type, to learn how to add custom functions. TypeScript should complain, if you're missing something.*

### Theming

Theming is based on [material-ui](https://mui.com/material-ui/customization/theming/).

You'll find a theme file in `packages/fe/src/extensions/app/layout/theme.ts`

**Please Note: Changing the layout itself is not yet supported. If you want to change the layout structure (different sidebar, topbar, ...), you need to change the respective files directly. This might conflict with future updates of Cody Engine, especially when we add support for custom layouts, but it's the only way for now. Sorry :(**

## Testing

Run tests of all 3 main packages in parallel:

```shell
npm run test
```

### Backend Testing

```shell
npm run test-be
```

### Frontend Testing

```shell
npm run test-fe
```

### Shared Library Testing

```shell
npm run test-shared
```

## Republish Events

Useful during development to test new policies or trigger events in production again

```shell
npx nx run be:republish --eventid <EventId>
```

## Trigger Projection with event

Useful during development to test new projections or trigger events in production again

```shell
npx nx run be:project --eventid <EventId> --name <ProjectionName>
```

`--name` is optional and defaults to: "read_model"


## Contribution

This repository is a skeleton for a Cody Engine app that has batteries included. This means, that Cody will
generate source code directly into the cloned repository and that designers and developers can add custom designs and logic, too.

When you want to contribute changes to the skeleton itself, you have to make sure to not submit any generated or customized code.
Therefor, we've prepared a terminal command that will set up a contribution environment with:

- an example domain, so that the skeleton is filled with some functionality
- .gitignore files that hide them self and the example domain from being committed
- changes in some registry files

`npm run prepare-contribution`

*Please Note: If you add a new registry file that should be included in the skeleton, please use the file extension `.ts.cetmpl`. 
A script will turn that template into a normal TS file on server start up. 
Ask a maintainer for help, if you're not sure how to do it!*

## Understand this workspace

Run `nx graph` to see a diagram of the dependencies of the projects.

## Batteries Included

The Cody Engine app skeleton makes use of a bunch of awesome open source libraries. Here is a list of the most important ones, so that you can find their documentation quickly:

### Backend

- [Express](https://expressjs.com/): Fast, unopinionated, minimalist web framework for Node.js
- CQRS/Event Sourcing implementation is inspired by [prooph components](https://getprooph.org/), [Event Engine](https://event-engine.github.io/) and [MartenDB](https://martendb.io/)
- [Jexl](https://github.com/TomFrost/jexl): Powerful context-based expression parser and evaluator

### Frontend
- [React](https://react.dev/): The library for web and native user interfaces
- [MUI](https://mui.com/): Move faster with intuitive React UI tools
- [react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form/docs/): A simple React component capable of building HTML forms out of a JSON schema

### Lowcode

- [prooph board Cody](https://wiki.prooph-board.com/cody/Cody-Server.html): Cody is a HTTP server that receives requests from prooph board to turn an event model into working code
- [Nx Generators](https://nx.dev/plugin-features/use-code-generators): Generators provide a way to automate many tasks you regularly perform as part of your development workflow
- [ts-morph](https://ts-morph.com/): Setup, navigation, and manipulation of the TypeScript AST made simple

## Further help

Visit the [Nx Documentation](https://nx.dev) to learn more.

## License

[MIT](LICENSE)
