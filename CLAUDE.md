# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Crystal-PDF

Full-stack PDF manipulation platform. Stateless Spring Boot REST API + React SPA, with JWT auth via HttpOnly cookies, file storage on disk, and PDF processing via server-side libraries.

## Commands

### Backend (Spring Boot 3 + Java 21 + Gradle)

```bash
# Prerequisites: set JAVA_HOME to Java 21
export JAVA_HOME="C:\Users\omrio\scoop\apps\openjdk21\21.0.2-13"  # Windows example

cd backend
./gradlew bootRun       # Run backend (port 8080)
./gradlew build         # Build
./gradlew test          # Run all tests (no DB required — unit tests only)
./gradlew test --tests "com.crystalpdf.backend.service.WatermarkServiceTest"  # Single test class
./gradlew test --tests "com.crystalpdf.backend.service.*"  # All service tests
./gradlew clean
```

### Testing Strategy

All tests are **unit tests** and run without any external services (no DB, no server needed).

**Backend test coverage** (`backend/src/test/`):
- `helper/PdfTestHelper` — Creates minimal valid PDFs in memory for use by all PDF tests
- `service/JwtServiceTest` — Token generation, extraction, validation, expiry
- `service/FileEncryptionServiceTest` — AES-GCM encrypt/decrypt round-trips
- `service/AuthServiceTest` — Register, login, changePassword, deleteAccount (all with Mockito mocks)
- `service/StorageServiceTest` — store (PDF validation, size limits, sanitize), load, delete (uses `@TempDir`)
- `service/MergeServiceTest` — Merge 2–3 PDFs, error cases
- `service/SplitServiceTest` — Extract pages, out-of-range handling
- `service/RotateServiceTest` — Rotate 90/180/270, multi-page, accumulation
- `service/DeletePagesServiceTest` — Delete pages, prevent deleting all pages
- `service/WatermarkServiceTest` — All 5 positions, rotation variants
- `service/PageNumberServiceTest` — All 6 positions, all 4 formats

**Frontend test coverage** (`frontend/src/`):
- `store/useAppStore.test.ts` — activeTool, auth (setAuth/clearAuth), theme toggle
- `store/useToastStore.test.ts` — addToast, removeToast, auto-dismiss after 6s
- `lib/api.test.ts` — apiFetch: successful responses, 401 handling, redirect suppression on /login
- `overlays/WatermarkOverlay.test.tsx` — Rendering, scaling, rotation negation, all positions
- `overlays/PageNumberOverlay.test.tsx` — All formats, startNumber offset, scaling, all positions

**Test setup files:**
- `frontend/vitest.config.ts` — Vitest config (jsdom environment, global APIs)
- `frontend/src/test/setup.ts` — Imports `@testing-library/jest-dom` matchers

### Frontend (React + Vite + TypeScript + Tailwind)

```bash
cd frontend
npm install
npm run dev             # Dev server (port 5173)
npm run build
npm run preview
npm test                # Run all tests (Vitest, no server needed)
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Open Vitest UI in browser
```

### Database (PostgreSQL)

```bash
docker-compose up postgres -d   # Start only DB (recommended for local dev)
```

DB: `crystalpdf` | User: `crystalpdf` | Password: `crystalpdf_secure_password` | Port: `5432`

### Full Stack (Docker Compose)

```bash
docker-compose up -d            # All services (postgres + backend + frontend/nginx)
docker-compose logs -f backend
docker-compose down
docker-compose down -v          # Also deletes DB volume
```

Frontend at `http://localhost` (Nginx). Backend accessible via Nginx reverse proxy.

---

## Architecture

### Backend Structure

```
com.crystalpdf.backend
├── config/         SecurityConfig (JWT filter, CORS, CSRF disabled), CorsConfig
├── controller/     AuthController, DocumentController, WorkspaceToolController,
│                   CompressController, MergeController, SplitController, etc.
├── service/        AuthService, JwtService, StorageService, and one service per tool
├── entity/         User, Document (JPA)
├── repository/     UserRepository, DocumentRepository (Spring Data JPA)
├── security/       JwtService (token gen/validate), JwtAuthFilter (per-request)
├── exception/      GlobalExceptionHandler
└── dto/            Request/response objects
```

**Key backend behaviors:**
- `StorageService.store()` validates PDF magic bytes (`%PDF`) before saving, generates UUID filenames, stores at `{STORAGE_PATH}/{userId}/{uuid}.pdf`, creates `Document` record in DB.
- All tool endpoints are under `WorkspaceToolController` at `/api/documents/{id}/tools/{tool}`. Each tool loads the original file, processes it, and creates a new `Document` record (does not mutate the original).
- `AnnotationFlattenService` takes normalized (0–1) coordinates from the frontend and uses PDFBox to bake pen/highlight/text annotations into a new PDF.
- Compression uses Ghostscript via `ProcessBuilder` with a timeout.
- `GlobalExceptionHandler` maps domain exceptions to HTTP status codes.

### Frontend Structure

**Pages:** `LoginPage`, `RegisterPage`, `WorkspacePage` (main editor)

**State (Zustand):**
- `useAppStore`: active tool, current document ID, user email — persisted to localStorage
- `useToastStore`: toast notifications

**PDF Viewer:**
- `PdfViewer` integrates PDF.js; renders pages, handles zoom, stores current password for encrypted PDFs
- `PageThumbnailStrip`: collapsible right panel with page thumbnails
- `WorkspaceToolPanel`: sliding panel for tool options (split, compress, OCR, protect, etc.)

**Annotation system:**
- `useAnnotations` hook stores strokes and text boxes per page in memory, using normalized (0–1) coordinates
- `AnnotationCanvas` renders on top of the PDF page
- `FloatingAnnotateBar` controls tool/color/stroke width
- On save: POST to `/api/documents/{id}/tools/flatten-annotations` with page data and scale

**API layer:** All calls go through `apiFetch()` in `src/lib/api.ts`, which auto-redirects to `/login` on 401. `credentials: 'include'` is set on all requests (needed for HttpOnly cookie auth).

**AuthGuard:** Wraps protected routes; redirects unauthenticated users to `/login`.

### Auth Flow

1. Login/register → backend sets HttpOnly `auth_token` cookie (JWT, 24h expiry)
2. `JwtAuthFilter` validates the cookie on every request
3. Frontend never reads the token directly; auth state is inferred from API response success/failure
4. Only user email is stored in Zustand (display only)

### Password-Protected PDFs

- PDF.js prompts for password; it's stored in component state
- Passed to all backend tool endpoints as `sourcePassword` in request body
- Backend loads the encrypted PDF with the supplied password before processing

### Environment Variables (Backend)

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/crystalpdf` | PostgreSQL connection |
| `DB_USERNAME` | `postgres` | DB username |
| `DB_PASSWORD` | `postgres` | DB password |
| `STORAGE_PATH` | `./storage` | Disk path for uploaded PDFs |
| `JWT_SECRET` | (dev default in yml) | Base64-encoded JWT signing key |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins (e.g., `https://example.com,https://api.example.com`) |

### Security Features

**Rate Limiting:**
- Login/register endpoints limited to 10 attempts per 15 minutes per IP
- `RateLimitFilter` tracks attempts in-memory; for production, integrate Redis and external rate-limiting service
- Checks `X-Forwarded-For` header for proxied requests

**Default Credentials:**
- Auto-generated admin user: email=`admin@example.com`, password=`AdminChangeMe123!`
- **MUST be changed immediately after first deployment**
- No auto-reset mechanism (prevents privilege escalation if password is forgotten)

**CORS:**
- Origins configurable via `CORS_ALLOWED_ORIGINS` env var
- Supports multiple origins (comma-separated)
- Credentials flag enabled for cookie-based auth

**Request Cancellation (Frontend):**
- Use `createAbortController()` utility to cancel pending API requests on component unmount
- Prevents memory leaks and state updates on unmounted components

**Error Boundaries (Frontend):**
- `ErrorBoundary` component catches React errors and prevents app crashes
- Shows user-friendly error message with retry button
- Wrap critical components or use at app root level

### System Dependencies (required in production/Docker)

- LibreOffice headless — Word/doc-to-PDF conversion
- Ghostscript — PDF compression
- Tesseract OCR — text recognition
- QPDF — PDF optimization
- Python 3 + OpenCV — image processing
