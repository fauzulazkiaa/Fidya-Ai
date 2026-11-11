# Fidya web

Next.js 16 frontend for Fidya. Setup, environment variables, and how this app talks to the API are in the [root README](../README.md).

```bash
cd web
cp .env.example .env.local
npm ci
npm run dev
```

`npm run lint` runs ESLint. `npm run seo-auto` is a separate script that calls an LLM to rewrite SEO copy; it is not part of the app server.

`prisma/schema.prisma` is not imported by `src/`. Product data is loaded through `src/hooks/use-api.ts`, which calls `/api/v1` on the FastAPI backend.
