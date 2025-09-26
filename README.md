# OT Approval Form

A mobile-first public OT request portal built with Next.js App Router. Employees can submit overtime requests without logging in,
attach geolocation/photo proof, and managers can approve through emailed tokens. The project includes mock APIs, in-memory
persistence, and geofence evaluation to support a consolidated MVP workflow.

## Features

- **Single-page OT request form** with company/job autocomplete, automatic document number generation, and real-time OT hour
  calculation with 15-minute rounding.
- **Proof capture module** for start/end of OT sessions that compresses images client-side, collects GPS coordinates, displays a
  draggable Leaflet map, and enforces consent requirements.
- **Manager approval experience** accessible from secure token links, allowing approve/reject/request info actions with audit
  logging hooks.
- **Result summary view** showing location accuracy, geofence status, and document links after approval.
- **Responsive PWA-ready layout** using Tailwind CSS, sticky mobile submit bar, and installable manifest/icons.
- **Mock backend APIs** (FastAPI-style Next.js routes) for autocomplete, OT request creation, evidence upload, document retrieval,
  and approval token validation backed by an in-memory data store.

## Tech Stack

- Next.js 14 (App Router) with TypeScript and SWR
- Tailwind CSS 3 with custom theme and mobile-first design
- React Hook Form + Zod for schema validation
- Leaflet + React Leaflet for mini-map previews
- In-memory mock database utilities with geofence helpers and audit trail scaffolding

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

> [!NOTE]
> The repository ships with an `.npmrc` that enables `--force` installs. Codespaces occasionally leaves stale files inside
> `node_modules/next/dist`, and forcing the reinstall allows `npm install` to succeed without manual cleanup. The warning that
> the recommended protections are disabled is expected in that environment.

The application runs at [http://localhost:3000](http://localhost:3000). Autocomplete APIs and approval routes are served via
Next.js App Route handlers under `/api/public/*` and `/api/approve/*`.

### Build & Lint

```bash
npm run lint
npm run build
```

The lint command uses the project ESLint configuration, while the build command performs production compilation, linting, and type checking.

## Project Structure

- `app/` – Application routes for the public form, approval action sheet, and result summary.
- `components/` – Reusable UI components (autocomplete, sticky submit bar, proof capture, Leaflet map, bottom nav).
- `lib/` – Shared types, mock data store, geofence utilities, hooks, and hashing/document utilities.
- `app/api/` – Route handlers emulating the backend endpoints defined in the consolidated spec.
- `public/` – Manifest, icons, and static assets.
- `tailwind.config.ts` – Tailwind theme customization aligned with the bright brand palette.

## Screenshots

![Mobile OT request form](browser:/invocations/bduyilnh/artifacts/artifacts/ot-form-mobile.png)

