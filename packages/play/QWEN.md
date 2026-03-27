# Cody Play - Project Context

## Project Overview

**Cody Play** is a rapid prototyping application designed for collaborative sessions on [prooph board](https://prooph-board.com). Its primary goal is to eliminate development friction by providing:
- No server restarts required
- Fast feedback loops during screen sharing
- Real-time collaboration capabilities

**Deployment**: Production build is hosted at https://play.prooph-board.com (GitHub Pages)

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 with TypeScript |
| **Build Tool** | Webpack (via Nx) |
| **Monorepo** | Nx |
| **Routing** | React Router v6 |
| **State Management** | Custom config-store with React Context |
| **Data Fetching** | TanStack React Query |
| **UI Components** | Material-UI (MUI) |
| **Styling** | CSS with Roboto font family |
| **Testing** | Jest + React Testing Library |
| **Linting** | ESLint (@nx/react plugin) |
| **Transpilation** | Babel (@nx/react/babel preset) |

## Architecture

### Core Structure
```
src/
├── app/                    # Main application layer
│   ├── components/         # Reusable UI components
│   ├── form/               # Form-related components
│   ├── layout/             # Layout components (MainLayout, etc.)
│   ├── pages/              # Page components (Dialog, Drawer, Standard)
│   ├── providers/          # React context providers
│   └── utils/              # Utility functions
├── commands/               # Command handlers
├── environments/           # Environment configurations
├── hooks/                  # Custom React hooks
├── infrastructure/         # Infrastructure layer
│   ├── auth/               # Authentication services
│   ├── cody/               # Cody-related services
│   ├── events/             # Event store implementations
│   ├── message-box/        # Message box services
│   ├── multi-model-store/  # Document/Event store configurations
│   ├── services/           # General services
│   └── vibe-cody/          # Vibe Cody AI features
├── queries/                # Query handlers
├── state/                  # State management
└── vibe-cody-ai/           # Vibe Cody AI specific code
```

### Key Patterns
- **Event-Driven Architecture**: Uses event store and document store patterns
- **CQRS-inspired**: Separate commands and queries directories
- **Dependency Injection**: Services configured via factory functions
- **Global Window Object**: `window.$CP` exposes documentStore, eventStore, projector, config, and dispatch

## Building and Running

### Development Server
```bash
npx nx run play:spinup
```
- Runs on port **4300**
- HMR (Hot Module Replacement) enabled by default

### Build Commands

| Command | Description |
|---------|-------------|
| `npx nx run play:build` | Production build for prooph-board.com |
| `npx nx run play:build:development` | Development build with source maps |
| `npx nx run play:build:vibe-cody` | Production build for vibe-cody.ai |
| `npx nx run play:serve-static` | Serve static build |

### Testing
```bash
npx nx run play:test          # Run tests
npx nx run play:test:ci       # CI mode with code coverage
```

### Linting
```bash
npx nx run play:lint
```

## Environment Configurations

The project supports multiple environments via file replacements:

| Environment | File | Mode |
|-------------|------|------|
| Development | `environment.ts` | prototype |
| Production | `environment.prod.ts` | production |
| Vibe Cody | `environment.vibe-cody.ts` | vibe-cody AI |

## Key Features

### Multi-Model Store
- **Document Store**: `getConfiguredPlayDocumentStore()` - For document-based data
- **Event Store**: `getConfiguredPlayEventStore()` - For event sourcing

### Configuration System
- Dynamic page registry (`PlayPageRegistry`)
- Runtime configuration via `configStore` context
- Supports live edit mode toggling

### Page Types
- **Standard Pages**: Full-page views
- **Dialog Pages**: Modal dialogs
- **Drawer Pages**: Side drawer panels

### Extensions
- **Vibe Cody AI**: AI-assisted features (toggleable)
- **Mock API Handler**: For prototyping without backend

## Development Conventions

### Code Style
- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **JSX**: React JSX transform (`react-jsx`)
- **Imports**: Absolute paths using `@cody-play/` and `@frontend/` aliases

### File Naming
- Components: PascalCase (e.g., `MainLayout.tsx`)
- Utilities: camelCase
- Test files: `*.spec.tsx`

### Testing Practices
- Tests co-located with source files
- Uses `whatwg-fetch` polyfill for tests
- Coverage output to `../../coverage/packages/fe`

### Commit Guidelines
Part of a larger monorepo (`cody-engine`). Follow conventional commits and ensure:
- Build passes: `npx nx run play:build`
- Lint passes: `npx nx run play:lint`
- Tests pass: `npx nx run play:test`

## Deployment Process

1. Build production bundle: `npx nx run play:build`
2. Copy build output to local `cody-play` repository
3. Commit and push changes
4. GitHub Actions automatically deploys to GitHub Pages

## Important Notes

- **CORS Configuration**: Dev server configured with permissive CORS headers for local development
- **Webpack Externals**: `fs` module externalized (browser compatibility)
- **SPA Routing**: Includes GitHub Pages SPA redirect script in `index.html`
- **React DevTools**: Integrated and disabled by default (`initialIsOpen={false}`)
