# Crystal-PDF: Project Roadmap & Specification (V2 - Viewer & Auth Centric)

## Project Identity
- **Name:** Crystal-PDF
- **Architecture:** Stateful Split-architecture (Decoupled Backend & Frontend)
- **Frontend Stack:** React, Vite, Tailwind CSS, Zustand, React Router, PDF.js, SortableJS.
- **Backend Stack:** Java 21, Spring Boot 3, Gradle.
- **Data & Auth:** PostgreSQL, Spring Data JPA, Spring Security (JWT).
- **Core Processing:** Apache PDFBox, OpenPDF.
- **System Dependencies:** LibreOffice, Ghostscript, Tesseract OCR, QPDF, Python 3 (OpenCV).

## Phase 1: Database & Backend Auth Scaffold
- [x] Add PostgreSQL driver, Spring Data JPA, Spring Security, and JWT dependencies to `build.gradle`.
- [x] Configure `application.yml` for PostgreSQL connection and local file storage paths.
- [x] Create `User` entity, `UserRepository`, and Spring Security config (JWT Filter, Authentication Manager).
- [x] Implement `/api/auth/register` and `/api/auth/login` endpoints.

## Phase 2: File Persistence & Tracking
- [x] Create `Document` entity mapping files to their owner (`User`).
- [x] Implement a `StorageService` to handle saving/retrieving files to/from the local disk.
- [x] Implement protected endpoints: `/api/documents/upload`, `/api/documents/{id}/download`, and `/api/documents/my-files`.

## Phase 3: Frontend Auth & Routing
- [ ] Set up React Router in the frontend.
- [ ] Create Login and Register page components with Tailwind.
- [ ] Update Zustand store to handle JWT tokens and user session state.
- [ ] Create an `AuthGuard` wrapper component to protect internal dashboard routes.

## Phase 4: The Dashboard & History View
- [ ] Build the User Dashboard UI (landing page after login).
- [ ] Fetch and display a table/grid of the user's previously uploaded and processed files.
- [ ] Implement "Open in Workspace" and "Delete" actions for history items.

## Phase 5: The Central Viewer Workspace (The Core)
- [ ] Build the `Workspace` React component: A full-screen layout with a central PDF viewing area and a sticky tool sidebar.
- [ ] Integrate `PDF.js` to render the *active* document in the center of the screen.
- [ ] Implement Zustand state to track the `activeDocumentId` currently open in the viewer.

## Phase 6: Refactoring Tools - Operations on Active File
- [ ] **Backend:** Refactor existing tool logic (Merge, Split, Protect) to accept a `documentId`, process it from storage, and save the output as a *new* document linked to the user.
- [ ] **Frontend:** Build tool UI panels that slide out over the sidebar.
- [ ] Wire up the Split tool: Allow users to click pages rendered by PDF.js in the main viewer to select ranges for extraction.

## Phase 7: Advanced Conversions & OCR
- [ ] **Backend:** Adapt Document-to-PDF, PDF-to-Image, and Image-to-PDF logic to the new `StorageService` flow.
- [ ] **Backend:** Adapt OCR and Compression endpoints.
- [ ] **Frontend:** Add these tools to the Workspace sidebar, ensuring they visually update the active document or trigger a download/save prompt.

## Phase 8: Polish & Cleanup
- [ ] **Backend:** Ensure a scheduled task or cron job is in place to clean up orphaned temporary files, while keeping user-saved files intact.
- [ ] **Frontend:** Implement global toast notifications for all auth and document processing actions.
- [ ] Run `./gradlew build` and `npm run build` to ensure the refactored architecture compiles cleanly.

---
**Operating Rules for Claude:**
1. Always run `./gradlew build` and `npm run build` before marking a phase complete.
2. Ensure temporary files are completely deleted in the backend `finally` blocks to prevent memory/storage leaks.
3. Commit changes to Git at the end of every Phase.
