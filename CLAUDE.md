# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tichu Sim** is a full-stack real-time multiplayer Tichu card game (deployed at https://tichu-sim.com). It uses Spring Boot WebSockets (STOMP) for game synchronization and React for the UI.

## Commands

### Backend (Java / Maven)
```bash
./mvnw clean test          # Run all backend tests
./mvnw clean package       # Full build (includes tests)
./mvnw clean package -DskipTests  # Build without tests
```
Tests require a MySQL 8 instance. In CI this is provided as a service; locally use Docker Compose.

### Frontend (Node / npm)
```bash
cd frontend
npm ci                     # Install locked dependencies
npm run dev                # Dev server with HMR + API proxy to localhost:8080
npm run build              # TypeScript compile + Vite bundle
npm run type-check         # tsc --noEmit (no emit, type errors only)
npm run lint               # ESLint
npm run preview            # Preview the production build locally
```

### Local full stack
```bash
docker compose up          # Starts MySQL + backend + frontend + Certbot
```
Requires a `.env` file — see Environment Variables below.

## Architecture

### Backend (`src/main/java/com/icube/sim/tichu/`)

The backend is a Spring Boot 4 / Java 21 application with two communication layers:
- **REST API** — authentication (`/api/auth/**`) and room management (`/api/rooms/**`)
- **WebSocket (STOMP)** — all in-game real-time events at `/api/ws`

#### Extensible game framework
```
games/common/          ← Generic abstract layer
  domain/AbstractGame, GameRule, GameBuilder
  service/GameService
games/tichu/           ← Tichu-specific implementation
  Tichu.java           ← Main game state (thread-safe, uses ReentrantLock)
  Round.java, Phase.java
  TichuService.java    ← Orchestrates game events
  TichuRule.java       ← Rule configuration
  cards/               ← Card hierarchy (StandardCard, SpecialCard variants)
  tricks/              ← 10+ trick-type validators (Single, Pair, Straight, Bomb, …)
  controllers/         ← 8 STOMP message handlers (SetRule, Start, PlayTrick, …)
  mappers/             ← MapStruct compile-time mappers
  dtos/                ← DTOs for all WebSocket messages
```

#### WebSocket message flow
1. Client sends to `/app/{roomId}/{action}` (e.g. `/app/abc12/play-trick`)
2. `JwtAuthenticationInterceptor` validates the JWT on every SUBSCRIBE/SEND
3. `DestinationGuardInterceptor` validates roomId ownership
4. Controller handles the message → calls `TichuService` → publishes events
5. Events broadcast to `/topic/{roomId}` (room-wide) or `/user/{username}/queue` (personal)

#### Room scoping
`RoomMessageInterceptor` ensures users only receive messages for rooms they belong to.

### Frontend (`frontend/src/`)

React 19 + TypeScript 5 SPA. Key patterns:

- **`useAuth.tsx`** — `AuthContext` with login/logout/token-refresh (JWT access token 10 min, refresh 2 hr)
- **`useAxios.tsx`** — Axios wrapper that auto-refreshes tokens on 401
- **`useStomp.tsx`** — Class-based STOMP client wrapper (subscription lifecycle, reconnection)
- **`useRoom.tsx`** — Room state hook

The frontend **mirrors the backend game domain** for offline/pre-validation:
```
games/tichu/domain/    ← TichuGame, Card, Player, Team, Trick, TichuRule
games/tichu/dtos/      ← Message types matching backend DTOs
games/tichu/mappers/   ← Convert server DTOs ↔ frontend domain models
```

Game page hierarchy: `App (router)` → `HomePage` → `RoomDetailPage` → `TichuPage`

### Security
- Stateless JWT; access token 10 min, refresh 2 hr, WebSocket token 1 min (short-lived for WS handshake)
- CORS origin controlled via `CORS_ALLOWED_ORIGIN` env var
- `SecurityConfig.java` is the central Spring Security configuration

### Database
- MySQL 8, schema managed by **Flyway** (`src/main/resources/db/migration/`)
- New migrations must follow `V{n}__description.sql` naming

## Environment Variables

Required for local dev (create a `.env` in the project root):
```
JWT_SECRET=
DATASOURCE_URL=jdbc:mysql://localhost:3306/tichu?createDatabaseIfNotExist=true
DATASOURCE_USERNAME=
DATASOURCE_PASSWORD=
CORS_ALLOWED_ORIGIN=http://localhost:5173
```

## CI/CD

GitHub Actions runs on every PR and push to `main`:
1. **Check** — `mvn clean test` (with MySQL service) + `npm run build`
2. **Publish** — Docker images pushed to GitHub Container Registry
3. **Deploy** — SSH into AWS Lightsail, pull images, restart via docker-compose

Reusable workflows live in `.github/workflows/reusable-*.yaml`.

## PR Conventions

### Title
- Sentence case, imperative verb: "Add X", "Fix X", "Enhance X", "Refactor X", "Use X", "Move X", "Remove X", "Schedule X"
- Backticks for code identifiers: `` Remove `DATASOURCE_PASSWORD` env ``
- `[Tichu]` prefix for game-specific changes: `[Tichu] Fix Dog unable to be played`

### Branch name
Pattern: `category/short-description` (kebab-case)

| Category | When to use |
|---|---|
| `feature/` | New user-facing feature |
| `bugfix/` | Bug fix |
| `fix/` | Minor / frontend-only fix |
| `enhance/` | Improvement to existing feature |
| `refactor/` | Internal restructuring |
| `chore/` | Housekeeping (moving, renaming) |
| `deploy/` | CI/CD and deployment changes |

Game-specific changes add a sub-path: `bugfix/tichu/cannot-play-dog`, `enhance/tichu/show-exit-order`

### Body
Organize by stack, then by change category. Omit sections with no changes. Small/obvious PRs may have no body.

When the body exceeds ~15–20 lines, add a `## Summary` section at the top with 2–4 bullet points describing what changed from an end user's perspective (what they can now do, or what broke and is now fixed).

```
## General          ← cross-cutting changes
- ...

## Backend
### Features        ← or: Bugfix | Enhancement | Refactor | Chore
- `ClassName.method` description

## Frontend
### Features
- `Component.tsx` description
```