# LLM-REconstruction3d-Visualization

> An interactive 3D knowledge graph and workspace manager for visualizing Claude Code configurations and AI development workflows.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.161-049ef4?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Overview

LLM-REconstruction3d-Visualization is a full-stack web application that renders your Claude Code configuration as an immersive, interactive 3D scene. It reads your local `~/.claude` workspace — skills, MCPs, plugins, hooks, rules, agents, and memory — and maps them into an orbital knowledge graph with real-time interaction, physics-based layouts, and post-processing visual effects.

A second view, the **Workspace Session Manager**, lets you compose AI workflow sessions through drag-and-drop: pull modules from a palette onto a 3D canvas, get AI-powered recommendations, and track session status from draft through completion.

Built with a cyberpunk aesthetic (neon colors, bloom effects, particle fields), it targets Claude Code power users who want a spatial overview of complex configurations.

## Features

- **3D Knowledge Graph** — Center node (Claude Code core) surrounded by seven category orbits (Skills, MCPs, Plugins, Hooks, Rules, Agents, Memory) with hover/click interactions and attention-flow highlighting
- **Multiple Layout Algorithms** — Switch between orbital, force-directed, circular, grid, and hierarchical layouts powered by D3-force-3d physics simulation
- **Hooks Layer Visualization** — Dedicated visual layer for PreToolUse, PostToolUse, and Stop hooks
- **Workspace Session Manager** — Drag-and-drop module palette with HTML5 → 3D raycast bridging; create, edit, and delete sessions with status tracking (drafting → ready → running → completed/failed)
- **AI-Powered Recommendations** — Chat interface that scores and suggests modules based on natural language input
- **Role-Based Auth** — Three demo accounts (Admin, Developer, Viewer) with session persistence via Zustand + localStorage
- **Internationalization** — Full English and Chinese UI coverage with a live language toggle
- **Post-Processing Effects** — Bloom, tone mapping, particle fields, and custom GLSL shaders via `@react-three/postprocessing`
- **Static Export + Docker** — Deployable as a static site or containerized via the included multi-stage Dockerfile

## Requirements

- Node.js 18+ (v20 recommended)
- npm 8+

## Installation

```bash
git clone https://github.com/Arxchibobo/LLM-REconstruction3d-Visualization.git
cd LLM-REconstruction3d-Visualization

npm install

cp .env.example .env.local
```

## Usage

### Development

```bash
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build   # Generates static export to ./out/
npm run start
```

### Docker

```bash
docker build -t llm-viz .
docker run -p 8080:8080 llm-viz
```

### Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/v3` |
| `/login` | Authentication |
| `/v3` | 3D Knowledge Graph (main view) |
| `/workspace` | Session Manager |

### Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| Bobo | bobo123 | Admin |
| Admin | admin123 | Admin |
| Guest | guest | Viewer |

## Configuration

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
# API authentication key (development only)
CLAUDE_CONFIG_API_KEY=dev-only-key
NEXT_PUBLIC_CLAUDE_CONFIG_API_KEY=dev-only-key

# Optional: override the default Claude config path
# CLAUDE_CONFIG_PATH=/path/to/.claude
# NEXT_PUBLIC_CLAUDE_CONFIG_PATH=/path/to/.claude
```

By default the app reads your Claude workspace from `~/.claude` (settings, rules, agents, skills directories). Set `CLAUDE_CONFIG_PATH` to point at a different directory.

## Dependencies

| Category | Libraries |
|----------|-----------|
| Framework | Next.js 14.2, React 18.2, TypeScript 5.3 |
| 3D Rendering | Three.js 0.161, React Three Fiber 8.15, @react-three/drei 9.95 |
| Post-processing | @react-three/postprocessing 2.16 |
| Physics / Layout | d3-force 3.0, d3-force-3d 3.0.5 |
| State | Zustand 4.5 |
| Animation | Framer Motion 11.0 |
| UI Primitives | Radix UI, Lucide React |
| Styling | Tailwind CSS 3.4 |
| Data Parsing | gray-matter 4.0, remark, unified 11.0 |
| Server State | TanStack React Query 5.17 |

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── v3/                 # 3D Knowledge Graph page
│   ├── workspace/          # Session Manager page
│   ├── login/              # Auth page
│   └── api/                # Backend: claude-config, skills, chat
├── components/
│   ├── scene/              # Three.js scene components (graph, nodes, camera)
│   ├── workspace-scene/    # Workspace 3D canvas components
│   ├── workspace-ui/       # Workspace panels and chat UI
│   └── ui-v3/              # Knowledge graph UI panels
├── stores/                 # Zustand stores (auth, knowledge, workspace, i18n, settings)
├── services/               # Business logic (config loading, markdown parsing)
├── adapters/               # Data source adapters (strategy pattern)
├── utils/                  # Layout algorithms, shaders, color palette, raycast utils
├── types/                  # TypeScript type definitions
└── i18n/                   # Translation strings (EN / ZH)
```

## License

MIT — see [LICENSE](./LICENSE).
