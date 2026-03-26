# Crystal-PDF

Split-architecture PDF processing application.

## Backend (Spring Boot 3 + Java 17 + Gradle)

```bash
cd backend

# Build
./gradlew build

# Run
./gradlew bootRun

# Test
./gradlew test

# Clean
./gradlew clean
```

Backend runs on `http://localhost:8080`.

## Frontend (React + Vite + Tailwind CSS)

```bash
cd frontend

# Install dependencies
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

Frontend dev server runs on `http://localhost:5173`.

## System Dependencies (required in production/Docker)

- LibreOffice (headless, for document-to-PDF conversion)
- Ghostscript (PDF compression)
- Tesseract OCR (text recognition)
- QPDF (PDF optimization)
- Python 3 with OpenCV (image processing)

## Project Structure

```
/backend    - Spring Boot 3 API (Java 21, Gradle)
/frontend   - React SPA (Vite, TypeScript, Tailwind CSS)
```
