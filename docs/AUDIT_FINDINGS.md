# Project audit findings checklist

Living backlog from the full project health audit. Microservices / FCM are out of scope.

Status: `open` | `fixed` | `deferred`

## Critical

| ID | Finding | Files | Status |
|----|---------|-------|--------|
| C1 | OAuth silent email auto-link (account takeover) | `src/auth/auth.service.ts` | fixed |
| C2 | Redis stream PEL stranded on PID restart (no XCLAIM) | stream consumers | fixed |
| C3 | Realtime consumer drops messages before Socket.IO ready (no ACK) | `realtime-stream-consumer.service.ts` | fixed |
| C4 | Invite accept: non-atomic addMember + markAccepted | `team-invitation.service.ts` | fixed |

## High

| ID | Finding | Files | Status |
|----|---------|-------|--------|
| H1 | GitHub OAuth missing verified-email check | `github.strategy.ts` | fixed |
| H2 | WebSocket JWT skips refresh-session validation | `realtime-socket-gateway.service.ts` | fixed |
| H3 | No rate limiting on auth/registration | throttler in AppModule + controllers | fixed |
| H4 | Socket CORS reads wrong config key | `realtime-socket-gateway.service.ts` | fixed |
| H5 | Invite create then SMTP failure leaves stuck pending invite | invitation service | fixed |
| H6 | Registration fails HTTP after user create if welcome mail fails | `users.service.ts` (best-effort) | fixed |
| H7 | Refresh consume before new session create | `auth.service.ts` | fixed |
| H8 | Redis password only on Cache RedisService | `create-redis-client.ts` | fixed |
| H9 | Attachment Cloudinary/DB ordering drift | `attachments.service.ts` | fixed |
| H10 | E2E broken (Jest ESM `file-type`) | `test/app.e2e-spec.ts` | fixed |

## Medium

| ID | Finding | Files | Status |
|----|---------|-------|--------|
| M1 | No unique pending invite; TOCTOU duplicates | migration partial unique index | fixed |
| M2 | Invite allowed for existing members; email case sensitivity | invitation + users | fixed |
| M3 | Prisma P2002 → opaque 500s | `prisma-exception.filter.ts` | fixed |
| M4 | Weak DTO max lengths | comment/task/login DTOs | fixed |
| M5 | No attachment MIME allowlist | `attachments.service.ts` | fixed |
| M6 | JWT strategy missing `session.userId === payload.sub` | `jwt.strategy.ts` | fixed |
| M7 | RealtimeService OnModuleDestroy / consumer backoff | realtime services | fixed |
| M8 | Unused CacheService / AuditLog schema-only / README drift | README clarified | fixed |
| M9 | No `.env.example`; compose missing Redis; seed not in setup docs | root, compose, README | fixed |

## Low

| ID | Finding | Files | Status |
|----|---------|-------|--------|
| L1 | Logging mix (console vs Logger) | auth, mail paths, redis | fixed |
| L2 | Swagger only on Comments | controllers | deferred |
| L3 | ParseUuidPipe unused | removed | fixed |
| L4 | Hello World AppController | `app.controller.ts` | deferred |
| L5 | Postman demo passwords | postman/ | deferred |
