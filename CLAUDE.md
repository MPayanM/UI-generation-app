# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000 (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests (Vitest + jsdom)
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Reset and re-run all migrations (destructive)
```

Run a single test file:
```bash
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx
```

## Architecture

This is a Next.js 15 app (App Router) where users describe React components in a chat and Claude generates them with live preview.

### AI Generation Flow

1. The user sends a message via `ChatContext` (`src/lib/contexts/chat-context.tsx`), which calls `/api/chat` with the current message history and the serialized virtual file system.
2. `src/app/api/chat/route.ts` calls `getLanguageModel()` from `src/lib/provider.ts` — if `ANTHROPIC_API_KEY` is set it uses `claude-haiku-4-5` via the Vercel AI SDK; otherwise it falls back to `MockLanguageModel` which returns canned components.
3. The model streams back tool calls (`str_replace_editor`, `file_manager`) which are intercepted on the client by `onToolCall` in `ChatContext` and routed to `handleToolCall` in `FileSystemContext`.
4. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) applies the mutations to a `VirtualFileSystem` instance in React state, triggering re-renders.

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree of `FileNode` objects. No files are ever written to disk — the entire generated project lives in React state. The VFS is serialized to JSON when sent to the API and when persisted to the database (`Project.data` column).

The generated project always requires `/App.jsx` as its entry point. The preview (`PreviewFrame`) transpiles this in-browser using `@babel/standalone`.

### Auth & Persistence

- JWT sessions stored in an `httpOnly` cookie (`auth-token`), signed with `JWT_SECRET` (defaults to a dev secret).
- Anonymous users can generate components without signing in; `anon-work-tracker.ts` saves their work to `localStorage` so it can be claimed after sign-up.
- Authenticated users' projects are saved to SQLite via Prisma (`Project` model). `messages` and `data` columns are JSON strings.
- Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes only; `/api/chat` is open.

### Key Design Constraints

- All non-library imports inside generated components must use the `@/` alias (e.g. `@/components/Button`), not relative paths — this is enforced in the system prompt (`src/lib/prompts/generation.tsx`).
- Do not run `npm audit fix` — dependencies are intentionally pinned and `audit fix` can break version compatibility.
- The `turbopack.root` config key in `next.config.ts` is intentionally unrecognized by Next.js (produces a warning) but is required to prevent module resolution issues on some machines.
