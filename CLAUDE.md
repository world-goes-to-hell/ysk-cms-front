# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development (runs admin app by default)
npm run dev              # Admin app on port 5173
npm run dev:admin        # Admin app on port 5173
npm run dev:user         # User app on port 5174

# Build
npm run build            # Build all workspaces
npm run build:admin      # Build admin app only
npm run build:user       # Build user app only

# Lint & Format
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
```

## Project Architecture

### Monorepo Structure (npm workspaces)

```
ysk-cms-front/
├── apps/
│   ├── admin/          # Admin CMS application (Element Plus UI)
│   └── user/           # User-facing application
└── packages/
    └── shared/         # Shared types, utilities, API client
```

### Key Architectural Patterns

**Dynamic Routing from Menu Data:**
- Admin app generates routes dynamically from backend menu API
- `router/dynamicRoutes.ts` converts `MenuItem[]` to Vue Router routes
- Menu items can specify `componentPath` for the view component
- `relatedRoutes` JSON field defines additional routes (detail, form pages)

**Pinia Stores (Admin):**
- `auth.ts` - Authentication state, login/logout, token management
- `menu.ts` - Menu tree data, expansion state, site code switching
- `theme.ts` - Dark/light mode, blue light filter levels

**API Layer:**
- `api/index.ts` - Axios instance with JWT interceptors and token refresh
- Automatic token refresh on 401 with request queue management
- Backend API base: `VITE_API_BASE_URL` (default: http://localhost:8080/api)

### Import Aliases

- `@` → `./src` (per-app)
- `@ysk-cms/shared` → shared package
- `@ysk-cms/shared/types` → shared types
- `@ysk-cms/shared/api` → shared API client
- `@ysk-cms/shared/utils` → shared utilities

## Tech Stack

- Vue 3.5 + TypeScript 5.9 + Vite 7
- Pinia (state management)
- Vue Router 4
- Element Plus (admin UI components)
- Axios (HTTP client)

## Conventions

- 대답은 항상 한국어로 대답해줘
- git 커밋 시에는 항상 한글로 설명을 작성해

## Backend Integration

Backend project location: `C:\DEV\WORKSPACE\JAVA\ysk_cms`

API endpoints follow pattern: `/api/sites/{siteCode}/...`
- Auth: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`
- Menus: `/api/sites/{siteCode}/menus/tree`
- Board Types: `/api/sites/{siteCode}/board-types`
- Boards: `/api/sites/{siteCode}/boards`
