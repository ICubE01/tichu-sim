# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tichu Sim** is a full-stack real-time multiplayer Tichu card game (deployed at https://tichu-sim.com). It uses Spring Boot WebSockets (STOMP) for game synchronization and React for the UI. Players authenticate with email/password or social login (Google, Kakao, Naver), manage their account, and play in rooms with in-game chat.

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

Spring Boot 4 / Java 21. Spring Data JPA + JDBC over MySQL, Flyway migrations, MapStruct mappers. Two communication layers:
- **REST API** — `/api/auth/**`, `/api/users/**`, `/api/rooms/**`, `/api/admin/**`
- **WebSocket (STOMP)** — all in-game real-time events and chat at `/api/ws`

#### Package layout
```
auth/                  ← Authentication
  jwt/                 ← Jwt, JwtService, JwtAuthenticationFilter (REST), JwtAuthenticationInterceptor (WS), JwtConfig
  social/              ← Social login orchestration (SocialAuthService, UserIdentity link/unlink, conflict exceptions)
    providers/         ← GoogleOidcProviderClient, KakaoOidcProviderClient, NaverOAuth2ProviderClient + registry, OidcStateStore
  SecurityConfig.java          ← Central Spring Security config
  RefreshTokenCookieFactory.java  ← Builds/expires the HttpOnly refresh-token cookie
users/                 ← User account CRUD, registration, password change (UserController, UserService, User, Role)
admin/                 ← Bot accounts + impersonation (AdminController: create bots, issue bot tokens)
chat/                  ← In-room chat (ChatController)
rooms/                 ← Room management (RoomController) + WS room-scoping channel interceptors
common/
  websocket/           ← WebSocketConfig + STOMP channel interceptors
games/
  common/              ← Generic abstract layer
    domain/            ← Game, AbstractGame, GameBuilder, GameName, GameRule, GameRuleWrapper
    services/          ← GameService, AbstractGameService
  tichu/               ← Tichu-specific implementation
    Tichu.java         ← Main game state (thread-safe, uses ReentrantLock)
    Round.java, Phase.java, ExchangePhase.java, Player.java, Team.java, TichuDeclaration.java
    TichuService.java          ← Orchestrates game events
    TichuEventHandler.java     ← Reacts to domain events
    TichuRule.java             ← Rule configuration
    cards/             ← Card hierarchy (StandardCard, SpecialCard variants)
    tricks/            ← Trick-type validators (Single, Pair, Straight, Bomb, …)
    controllers/       ← STOMP message handlers (Start, SetRule, PlayTrick, PlayBomb, Pass, Exchange, Get, Small/LargeTichu, SelectDragonReceiver)
    events/, mappers/, dtos/, exceptions/
```

#### Authentication
- **Email/password** — `POST /api/users` to register, `POST /api/auth/login` to obtain tokens.
- **Social login** — `GET /api/auth/social/{provider}/url` returns the provider authorization URL; the frontend callback page exchanges the code via `POST /api/auth/social/{provider}/login`. Logged-in users can additionally **connect/disconnect** a provider (`POST`/`DELETE /api/auth/social/{provider}`). Google and Kakao use OIDC; Naver uses OAuth2. Kakao's userinfo endpoint is overridden to the classic user API so email-verification flags are available. Social login requires a verified email (`EmailNotVerifiedException`) and guards against email/identity conflicts.
- **Tokens** — `JwtService` issues a short-lived **access token** (returned in the response body, held in memory by the frontend) and a **refresh token** stored in an `HttpOnly` cookie scoped to `/api/auth/refresh`. `POST /api/auth/refresh` rotates tokens; `DELETE /api/auth/refresh` logs out (clears the cookie). `GET /api/auth/issue/web-socket-token` mints a very short-lived token for the WS handshake.

#### WebSocket message flow
1. Client sends to `/app/rooms/{roomId}/...`, e.g. `/app/rooms/abc12/game/tichu/play-trick` or `/app/rooms/abc12/chat`.
2. Inbound channel interceptor chain (`WebSocketConfig`):
   `JwtAuthenticationInterceptor` (validates JWT) → `DestinationCheckInitializeInterceptor` → `RoomInboundChannelInterceptor` (room membership) → `UserInboundChannelInterceptor` (guards `/user/{userId}/**` destinations) → `DestinationGuardInterceptor`.
3. Controller handles the message → calls `TichuService` → publishes domain events.
4. Events broadcast to `/topic/rooms/{roomId}/...` (room-wide) or `/user/{userId}/queue/...` (personal). `RoomOutboundChannelInterceptor` filters outbound messages so users only receive events for rooms they belong to.

#### Admin & impersonation
`/api/admin/**` requires the `ADMIN` role. Admins can create **bot** user accounts and issue bot access tokens; the frontend `AdminPage` uses these to impersonate a bot (shown via `ImpersonationOverlay`) for testing multiplayer games solo.

### Frontend (`frontend/src/`)

React 19 + TypeScript 5 SPA (Vite). Key hooks:

- **`useAuth.tsx`** — `AuthContext`: login/logout, social login, token refresh, `reloadUser`, and bot `impersonateBot`. Access token kept in memory; refresh on window load via the cookie.
- **`useAxios.tsx`** — Axios wrapper that auto-refreshes the access token on 401.
- **`useStomp.tsx`** — Class-based STOMP client wrapper (subscription lifecycle, reconnection).
- **`useRoom.tsx`** — Room state hook.

Pages / routing (`App.tsx`): unauthenticated users see `LoginPage` / `SignupPage`; social OAuth callbacks route to `SocialCallbackPage` (`/auth/callback/{google,naver,kakao}`). Authenticated users get `HomePage`, `RoomDetailPage` (`/rooms/:roomId`), `AccountPage` + `ChangePasswordPage`, and `InitNamePage` (set display name after first social login). `AdminPage` is lazy-loaded and gated on `role === 'ADMIN'`.

The frontend **mirrors the backend game domain** for offline/pre-validation:
```
games/tichu/domain/    ← TichuGame, Card, Cards, Player, Team, Trick, TichuRule, TichuDeclaration
games/tichu/dtos/      ← Message types matching backend DTOs
games/tichu/mappers/   ← Convert server DTOs ↔ frontend domain models
```

### Database
- MySQL 8, schema managed by **Flyway** (`src/main/resources/db/migration/`).
- Tables: `users` (nullable password for social-only accounts, role, timestamps) and `user_identities` (links a user to a social provider subject).
- New migrations must follow `V{n}__description.sql` naming.

## Configuration

Spring config lives in `src/main/resources/application.yaml`. Notable token / room settings:
- Access token: 10 min · Refresh token: 7 days · WebSocket token: 5 s · Bot access token: 2 hr
- Room expiry: 1 hr out of game, 6 hr in game · Room id length: 5

## Environment Variables

Required for local dev (create a `.env` in the project root; see `.env.example`):
```
JWT_SECRET=
DATASOURCE_URL=jdbc:mysql://localhost:3306/tichu?createDatabaseIfNotExist=true
DATASOURCE_USERNAME=
DATASOURCE_PASSWORD=
WEB_ORIGIN=http://localhost:5173      # CORS origin + OAuth redirect base
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

## CI/CD

GitHub Actions runs on every PR and push to `main`:
1. **Check** — `mvn clean test` (with MySQL service) + `npm run build`
2. **Publish** — Docker images pushed to GitHub Container Registry
3. **Deploy** — SSH into AWS Lightsail, pull images, restart via docker-compose

Reusable workflows live in `.github/workflows/reusable-*.yaml`.

## Code Style

- Always use braces for `if` statements, even for single-line bodies.

## Commit Conventions

- Do not include a `Co-Authored-By` trailer in commit messages.

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
