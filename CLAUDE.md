# CLAUDE.md

Guidance for AI assistants working in this repository. Read it fully before changing anything.

## Project overview

School visits tracker built for the Kurios Education technical challenge. Specialists sign in, register
the visits they make to schools, and consult, edit and soft-delete them.

- Monorepo: `backend/` (Django + Django REST Framework) and `frontend/` (React + Vite + TypeScript).
- Database: PostgreSQL (Docker) or SQLite (local convenience fallback), selected through `DATABASE_URL`.
- Authentication: Django session authentication. The API is protected; the Django admin uses the same users.
- Roles: `admin` (any user with `is_staff`, no specialist profile required) and `specialist` (any other user with a
  `Specialist` profile). Role logic lives in `apps/accounts/roles.py`; a user with neither role cannot use the API.
- Delivery plan and status: `docs/PLAN.md` (local working file, git-ignored, never published). User-facing documentation: `README.md`.

## Hard rules

These come directly from the repository owner and override any default behaviour.

1. **Never run `git commit`, `git push`, `git add`, `git stash`, `git reset`, `git checkout`, or any other command that
   changes git history or the index.** Only the owner does that. When a unit of work is ready, summarise
   what changed and suggest a commit message, then stop. Read-only commands (`git status`, `git diff`,
   `git log`) are fine.
2. **Everything is written in English**: code, identifiers, file and directory names, function and variable
   names, database tables and columns, API fields, commit messages (suggested ones too), and code comments.
   The only exceptions are the user-facing UI strings in the frontend and the Spanish documentation files
   (`README.md`, `docs/PLAN.md`). The README section "Uso de inteligencia artificial" keeps its Spanish title because
   the challenge requires it.
3. **Do not litter code with comments.** A comment must carry information the code cannot: a non-obvious
   reason, a trade-off, a constraint, a workaround. Never narrate what the next line does, never leave a comment per
   change, and never write section banners or docstrings that restate the function name.
4. **Every behaviour ships with tests**, in the same unit of work, on both backend and frontend.
5. **Keep the project runnable in two ways**: locally (everything installed) and with Docker
   (`docker compose up --build`). A change is not done if it breaks either.
6. **Seeds are the source of the initial data**: schools, teachers, specialists and a few sample visits.
   The seed command must be idempotent and documented.
7. **Documentation stays accurate.** Any change to setup, commands, environment variables, the data model or
   architecture updates `README.md` (and the Mermaid ER diagram when tables change) in the same unit of work.
8. **Small and clean beats big and unfinished.** Do not add features, abstractions or dependencies the
   requirements do not call for.

## Engineering principles

- **SOLID, applied with judgement.**
  - Single responsibility: models hold data and invariants, serializers validate and shape I/O, views orchestrate
    HTTP, services hold multi-step business operations, selectors/querysets hold reads.
  - Open/closed and dependency inversion: depend on small interfaces (permission classes, filter sets, hooks), not
    on concrete wiring; extend by adding classes, not by editing branching logic.
  - Do not create a layer or pattern before there is a second use for it.
- **Separation of concerns** across layers, and across the HTTP boundary: business rules are enforced in the
  backend; the frontend validates only for fast feedback and never replaces server validation.
- **DRY at the level of knowledge, not text.** Duplicating three lines is cheaper than a wrong abstraction.
- **Fail loudly at the edges** (validation, permissions, configuration), and trust internal code.
- **No secrets in the repository.** Configuration comes from environment variables; only `.env.example` files are committed.

## Backend conventions (Django + DRF)

Layout: `config/` (settings, root URLs, WSGI) and `apps/<name>/` for each domain app: `core` (shared
abstractions, health check), `accounts` (specialists and authentication), `directory` (schools and
teachers), `visits` (visits).

- Python 3.13, Django 5.2 LTS, DRF, django-filter. Format and lint with `ruff` (`ruff check .` and
  `ruff format .` must be clean).
- Add type hints to function signatures.
- **Models**
  - Explicit `Meta` with `ordering`, constraints and indexes for every column used to filter or sort.
  - Reference users with `settings.AUTH_USER_MODEL`.
  - Database constraints mirror business rules where the database can express them.
  - Singular PascalCase model names, snake_case columns, explicit `related_name`.
  - Inherit timestamps from the shared abstract model in `apps.core`.
- **Soft delete**: never `DELETE` a visit. Set `deleted_at`. The default manager excludes soft-deleted rows; a
  separate manager exposes all rows for the admin and seeds.
- **Migrations** are committed and generated, never hand-edited after being applied. One logical change per migration.
- **Serializers**: list `fields` explicitly (never `__all__`); keep cross-field and date rules in `validate_*` /
  `validate`; read-only fields for server-controlled data (`specialist`, timestamps).
- **Views**: thin `ViewSet`s/`APIView`s. No business logic in views. Authentication is required by default
  (`IsAuthenticated`); opening an endpoint must be an explicit `AllowAny` with a reason.
- **Queries**: use `select_related`/`prefetch_related` to avoid N+1; filter through `django-filter` `FilterSet`s.
- **Errors**: return DRF's standard error shape; use proper status codes (400, 401, 403, 404, 204 for delete).
- **Settings**: everything environment-dependent is read through `django-environ`; production-safe defaults
  (`DEBUG` off, no default secret key outside debug).
- **Tests** (`pytest-django`, `factory-boy`)
  - Live next to each app in `apps/<name>/tests/`, named `test_*.py`.
  - Use factories, not fixtures files.
  - Test endpoints through `APIClient` (status code, payload, permissions, validation errors) and test model/
    queryset behaviour directly.
  - One behaviour per test with a descriptive name.
  - Cover the unhappy paths (unauthenticated, forbidden, invalid input, soft-deleted record).
- Management commands live in `apps/<name>/management/commands/`, stay idempotent and print what they did.
- **API documentation** (`drf-spectacular`, served at `/api/docs/`): every endpoint needs `@extend_schema` with a
  tag and a summary, and APIViews need an explicit request/response. Error responses are added by the hook in
  `apps/core/schema.py`. `python manage.py spectacular --validate --fail-on-warn` must stay clean; a test enforces it
  and checks the documented operations match the API.

## Frontend conventions (React + Vite + TypeScript)

Layout: `src/app` (root component, providers, routing), `src/api` (HTTP client and endpoint functions),
`src/features/<name>` (components, hooks, types and tests of one feature), `src/components` (shared presentational
components), `src/styles` (SASS variables and globals), `src/test` (test utilities).

- TypeScript in strict mode. No `any` (the linter forbids it); prefer `unknown` and narrow. Use `import type`.
- Function components and hooks only. Named exports; one component per file; file name equals component name.
- **Data fetching goes through TanStack Query** (queries and mutations in feature hooks, never in
  components). Component-local UI state uses `useState`; share state via context only when props would
  drill more than two levels.
- Components render and handle events. Data fetching, mapping and rules live in hooks and in `src/api`.
- The API layer owns the wire format. Map snake_case payloads to the camelCase types used by the UI at that boundary.
- Do not use `useEffect` to derive state or to fetch data.
- **Forms**: controlled inputs, a label for every field, field-level error messages from both client-side and
  server-side validation, disabled submit while pending.
- **Accessibility**: semantic elements first, then ARIA; keyboard-operable; visible focus; `role="status"` /
  `role="alert"` for async feedback.
- **Styling**: SASS with CSS Modules (`Component.module.scss`), design tokens in `src/styles/_variables.scss`. No inline styles for
  anything other than dynamic values.
- **All user-facing text is Spanish**, including validation and error messages. The backend sends stable error codes
  and the frontend translates them in one place (`src/api/errors.ts`); never show backend English messages to users.
- Routes that need a session sit behind an auth guard; the API client sends cookies and the CSRF token.
- **Configuration**: build-time values via `import.meta.env.VITE_*`. The API is always called through the relative
  `/api` path (Vite proxy in development, nginx proxy in Docker), so no CORS configuration is needed.
- **Tests** (Vitest + Testing Library)
  - Colocated as `*.test.ts(x)`.
  - Query by role and accessible name, drive with `user-event`, assert on what the user sees.
  - Mock the network boundary (`fetch`), never internal modules or hooks.
  - Every component, hook and API function ships with tests, including loading, error and empty states.
- `npm run lint`, `npm run format:check`, `npm run typecheck` and `npm test` must all pass.

## Visual design brief (frontend)

The goal is a sober internal tool that does not look AI-generated. Decide visuals from this brief; do not fall back to
generic defaults.

- **Character:** plain administrative tool, medium density, tables for tabular data, content-first. No marketing tone.
- **Color:** cool neutrals plus one accent (the blue in `_variables.scss`). Red and green only for error and success states.
  No gradients.
- **Type:** the system font stack, two weights, a short size scale. Sentence case everywhere.
- **Shape:** small radius, 1px borders instead of shadows, one subtle shadow at most for overlays. Content max width about
  1100px, spacing on a 4px scale.
- **Never:** gradients, glassmorphism, emoji or icons inside colored circles, three identical cards in a row as a hero,
  decorative animation, placeholder or marketing copy ("supercharge your...").
- **Motion:** only short (about 150ms) transitions on hover and focus.
- **Copy:** specific, domain-aware Spanish (visits, schools, teachers), written for the people who actually use the app.
- **Accessibility:** AA contrast, visible focus ring, labels on every control, semantic elements before ARIA.
- Define every color, spacing value and radius as a token in `src/styles/_variables.scss`; components never hardcode them.
- Review the rendered result (screenshots) before calling a screen done.

## Docker

- `docker compose up --build` starts `db` (PostgreSQL), `backend` (gunicorn, runs migrations and the seed on start) and
  `frontend` (nginx serving the build and proxying `/api`, `/admin`, `/static` to the backend).
- Every environment variable has a working default in `docker-compose.yml`; `.env.example` documents them.
- Keep images small and deterministic: pinned base images, lockfiles, `npm ci`, no secrets baked in.

## Commands

Backend (from `backend/`, with the virtualenv active):

```
python manage.py migrate
python manage.py seed_data
python manage.py runserver
pytest
ruff check . && ruff format --check .
```

Frontend (from `frontend/`):

```
npm install
npm run dev
npm test
npm run lint && npm run format:check && npm run typecheck
npm run build
```

Docker (from the repository root):

```
docker compose up --build
docker compose exec backend pytest
docker compose down -v
```

## Definition of done

A unit of work is done when: the behaviour works end to end, tests for it exist and pass, linters and type checks are
clean, documentation is updated, both run modes still work, and the owner has been given a summary and a suggested
commit message (the owner commits).
