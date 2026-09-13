# Pacientes (demo)

A small patient-management web app, originally built for a single doctor to
replace a spreadsheet of patients and their consultation history. **This
repository is a public portfolio demo**, derived from a private production
app: no login, no real backend, and no real patient data — everything you
see is fictional and reset on demand.

Try it: search patients, open one, add/edit a consultation, create a new
patient. Use "Restablecer datos" (top of the patient list) to discard any
changes and restore the original demo dataset.

## Why this version is different from the real app

The production version of this app is a private, single-user tool that
handles real medical records. It has:

- Supabase Auth (email/password login), no public signup.
- PostgreSQL Row Level Security so a doctor only ever sees their own
  patients.
- A real Postgres schema (`patients`, `consultations`) with indexes,
  triggers, and search via `pg_trgm`/`unaccent`.

None of that belongs in a public repo, so this demo strips it out:

- No login — the app opens straight to the patient list.
- No backend — `src/app/core/demo-data.store.ts` is a small in-memory /
  `localStorage`-backed store standing in for Supabase, seeded with a
  handful of fictional patients.
- No real credentials, project URLs, or infrastructure of any kind.

Everything else — the Angular architecture, forms, validation, age
calculation, Spanish (Argentina) locale/date formatting — is the same code
that runs in production.

## Stack

- **Angular 22** (standalone components, signals, native `@if`/`@for`),
  strict TypeScript.
- Reactive Forms, typed and non-nullable.
- Vitest for unit tests.
- No runtime dependencies beyond Angular itself (no Supabase client in this
  build).

## Running locally

```bash
npm install
npm start          # http://localhost:4200
npm test
npm run build       # production build → dist/pacientes-pablo-app/browser
```

## Deploying this demo yourself

This repo ships a `wrangler.jsonc` for deploying the static build to
Cloudflare Workers (static assets), under its own Worker name
(`pacientes-demo`) — unrelated to the production deployment:

```bash
npm run build
npm run deploy
```

Any static host works equally well (Netlify, Vercel, GitHub Pages, etc.) —
the output in `dist/pacientes-pablo-app/browser` is a plain static SPA.

## License

MIT — see [LICENSE](./LICENSE).
