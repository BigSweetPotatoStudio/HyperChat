---
applyTo: '**'
---
## Project Overview

HyperChat is a multi-platform AI chat application supporting:
- **Desktop application** (Electron-based)
- **Web application** (React + TypeScript)
- **Command-line interface** (Node.js headless mode)
- **Docker deployment**

The project has extensive **MCP (Model Context Protocol)** support and integrates with multiple LLM APIs including OpenAI, Claude, Gemini, Qwen, Deepseek, and others.

## Development Commands

### Initial Setup
```bash
# Install dependencies for all modules
cd electron && npm install
cd web && npm install  
npm install
```

### Development
```bash
# Full development mode (builds both web and electron)
npm run dev

# Web development only
cd web && npm run dev

# Electron development only  
cd electron && npm run dev
```

### Building
```bash
# Production build
npm run build

# Build for specific targets
npm run prod          # Full production build
npm run prod_node     # Node.js only build
```

### Testing
```bash
npm run test
```

## Architecture

### Monorepo Structure
- **`/electron/`** - Desktop application (Electron + TypeScript)
  - **`ts/main.mts`** - Main Electron process entry point
  - **`ts/mcp/servers/`** - MCP server implementations (Tools, KnowledgeBase, Terminal, Settings)
  - **`js/`** - Compiled JavaScript output
- **`/web/`** - Web application (React + TypeScript)
  - **`src/pages/`** - Application pages (Chat, Agent, Settings, Toolbox, etc.)
  - **`src/components/`** - Reusable UI components
  - **`src/common/`** - Shared utilities, AI providers, and services
- **`/common/`** - Shared code between electron and web
- **`/docker/`** - Container configurations for both electron and headless modes

### Key Technologies
- **TypeScript** throughout the entire stack
- **React 18.2.0** for web frontend with Ant Design components
- **Electron** for desktop application
- **Webpack** for building and bundling
- **Koa.js** for backend server
- **Socket.io** for real-time communication
- **LangChain** for AI/ML workflows
- **MCP SDK** for Model Context Protocol integration

### Build System
The project uses a centralized task management system via `task.mts` files:
- Root `/task.mts` orchestrates builds across modules
- Each module has its own build configuration
- Webpack handles bundling with environment-specific configs
- Cross-platform build support for Windows, macOS, and Linux

### MCP Integration
- Built-in MCP servers in `/electron/ts/mcp/servers/`
- **hyper_tools** - Core tool server with electron and web variants
- **KnowledgeBase** - RAG and document management
- **Terminal** - Terminal emulator functionality
- **Settings** - Configuration management
- **Task** - Scheduled task system

### Data Flow
- **WebDAV synchronization** for cross-device data sync
- **Socket.io** for real-time communication between frontend and backend
- **RAG system** with vector store integration using LangChain
- **Agent system** with scheduled task execution

## Key Files

### Configuration
- `/electron/ts/const.mts` - Constants and configuration
- `/web/src/common/config.ts` - Web app configuration
- `/electron/ts/mcp/config.mts` - MCP server configuration

### Entry Points
- `/electron/ts/main.mts` - Electron main process
- `/electron/ts/main_no_electron.mts` - Headless Node.js mode
- `/web/src/index.tsx` - React application entry

### Core Services
- `/electron/ts/websocket.mts` - WebSocket server implementation
- `/electron/ts/message_service.mts` - Message handling service
- `/web/src/common/ai/` - AI provider abstractions
- `/web/src/common/mcp.ts` - MCP client implementation

## Development Notes

- The project supports both Electron and web deployment from the same codebase
- TypeScript is configured with path mapping for cleaner imports
- MCP servers can be extended by adding new implementations in `/electron/ts/mcp/servers/`
- UI components follow Ant Design patterns with Tailwind CSS for styling
- Real-time features use Socket.io with proper fallbacks
- Build system automatically handles cross-platform differences

## Testing

Use `npm run test` to run the test suite. Tests are located in:
- `/electron/tests/` for Electron-specific tests
- `/web/tests/` for web application tests