# Crystal-PDF: Project Roadmap & Specification

## Project Identity
- **Name:** Crystal-PDF
- **Architecture:** Split-architecture (Decoupled Backend & Frontend)
- **Frontend Stack:** React, Vite, Tailwind CSS, Zustand, PDF.js, SortableJS.
- **Backend Stack:** Java 21, Spring Boot 3, Gradle.
- **Core Processing:** Apache PDFBox, OpenPDF.
- **System Dependencies:** LibreOffice, Ghostscript, Tesseract OCR, QPDF, Python 3 (OpenCV).

## Phase 1: Project Initialization
- [ ] Create directory structure (`/backend`, `/frontend`).
- [ ] Setup `CLAUDE.md` with build, test, and run commands for both tiers.
- [ ] Initialize Git repository.

## Phase 2: Backend Scaffold (Spring Boot 3)
- [ ] Initialize Spring Boot 3 project with Java 21 and Gradle.
- [ ] Add dependencies: Spring Web, Spring Security (basic), Apache PDFBox, OpenPDF.
- [ ] Implement `/api/health` and configure CORS to accept requests from the Vite dev server.

## Phase 3: Frontend Scaffold (React + Vite + Tailwind)
- [ ] Initialize Vite + React + TypeScript project in `/frontend`.
- [ ] Install Tailwind CSS, PostCSS, Autoprefixer, and Lucide React icons.
- [ ] Configure Tailwind utility classes and theme variables.
- [ ] Create responsive Layout components (Sidebar, Header, Main Workspace).

## Phase 4: Multi-Tier Dockerization
- [ ] **Backend:** Create Dockerfile based on Ubuntu/Debian (JRE 21) installing `libreoffice`, `ghostscript`, `qpdf`, `tesseract-ocr`, and `python3`.
- [ ] **Frontend:** Create multi-stage Dockerfile (Node.js build -> Nginx serving static files).
- [ ] Create `docker-compose.yml` networking both tiers, optimized for a lightweight VPS environment.

## Phase 5: MVP - Merge Tool
- [ ] **Backend:** Implement `/api/v1/merge` POST endpoint using PDFBox.
- [ ] **Frontend:** Build a React "Merge" view with a drag-and-drop file uploader zone.
- [ ] Implement frontend logic to handle `FormData` submission and trigger the merged file download.

## Phase 6: Global State & Visual Workspace
- [ ] **Frontend:** Implement **Zustand** store for global file and UI state management.
- [ ] **Frontend:** Integrate **localforage/IndexedDB** to persist PDF Blobs locally across sessions.
- [ ] **Backend/Frontend:** Implement `/api/v1/split` and build a visual workspace using PDF.js to render Tailwind-styled thumbnails for page selection.

## Phase 7: Security (Protect/Unlock)
- [ ] **Backend:** Implement PDFBox encryption (`StandardProtectionPolicy`).
- [ ] **Backend:** Implement decryption (credential stripping).
- [ ] **Frontend:** Create "Protect" and "Unlock" React components with secure password input fields and validation states.

## Phase 8: Advanced Conversions
- [ ] **Backend:** Implement Document-to-PDF (Word, Excel) executing `libreoffice --headless`.
- [ ] **Backend:** Implement PDF-to-Image (PNG/JPG ZIP) using PDFBox `PDFRenderer`.
- [ ] **Backend:** Implement Image-to-PDF (scaling images to A4).
- [ ] **Frontend:** Build conversion UI components with Tailwind-styled drag-and-drop zones and strict MIME-type filtering.

## Phase 9: Optimization & OCR
- [ ] **Backend:** Implement `/api/v1/compress` (executing `qpdf` and `ghostscript` via ProcessBuilder).
- [ ] **Backend:** Implement `/api/v1/ocr` (executing `tesseract` via ProcessBuilder).
- [ ] **Frontend:** Build complex UI controls (range sliders for compression, dropdowns for OCR languages).

## Phase 10: Final Polish & Branding
- [ ] **Backend:** Global `@ControllerAdvice` for clean error JSON responses and temporary file cleanup in `finally` blocks.
- [ ] **Frontend:** Implement a global toast notification system for success/error feedback.
- [ ] Final UI audit: Ensure the Tailwind design is cohesive and all references strictly say "Crystal-PDF".

---
**Operating Rules for Claude:**
1. Always run `./gradlew build` and `npm run build` before marking a phase complete.
2. Ensure temporary files are completely deleted in the backend `finally` blocks to prevent memory/storage leaks.
3. Commit changes to Git at the end of every Phase.