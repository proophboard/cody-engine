# CodyEngine

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **This workspace has been generated by [Nx, a Smart, fast and extensible build system.](https://nx.dev)** ✨

## Installation 

```
git clone https://github.com/proophboard/cody-engine.git
cd cody-engine
npm install
```

## Start system

`npm run serve`

This will start:

- NodeJS backend (API + biz logic) on: [http://localhost:4100](http://localhost:4100)
- Webpack Dev Server + API Proxy serving React Frontend on: [http://localhost:4200](http://localhost:4200)
- Cody Server on default port: [http://localhost:3311](http://localhost:3311)

## Contribution

This repository is a skeleton for a Cody Engine app that has batteries included. This means, that Cody will
generate source code directly into the cloned repository and that designers and developers can add custom designs and logic, too.

When you want to contribute changes to the skeleton itself, you have to make sure to not submit any generated or customized code.
Therefor, we've prepared a terminal command that will set up a contribution environment with:

- an example domain, so that the skeleton is filled with some functionality
- .gitignore files that hide them self and the example domain from being committed
- changes in some registry files

`npm run prepare-contribution`

Unfortunately, there is no way to tell git via .gitignore to keep an existing file unchanged and ignore local changes.
So you have to run the following commands to manually tell git to ignore changes in the registry files:

```shell
git update-index --skip-worktree packages/shared/src/lib/aggregates.ts
git update-index --skip-worktree packages/shared/src/lib/commands.ts
git update-index --skip-worktree packages/shared/src/lib/events.ts
git update-index --skip-worktree packages/shared/src/lib/queries.ts
git update-index --skip-worktree packages/shared/src/lib/types.ts
git update-index --skip-worktree packages/shared/src/lib/types/definitions.ts
git update-index --skip-worktree packages/shared/src/lib/types/references.ts
git update-index --skip-worktree packages/be/src/command-handlers/index.ts
git update-index --skip-worktree packages/be/src/query-resolvers/index.ts
git update-index --skip-worktree packages/be/src/repositories/index.ts
git update-index --skip-worktree packages/fe/src/app/pages/index.ts
```

*Please Note: If you add a new registry file that should be included in the skeleton, please make sure that changes through contributions are not tracked. 
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
