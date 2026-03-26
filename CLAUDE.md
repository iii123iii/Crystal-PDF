# Crystal-PDF

Split-architecture PDF processing application.

## Backend (Spring Boot 3 + Java 21 + Gradle)

### Prerequisites
Set `JAVA_HOME` to Java 21:
```bash
export JAVA_HOME="/path/to/openjdk21"  # e.g., C:\Users\omrio\scoop\apps\openjdk21\21.0.2-13 on Windows
```

### PostgreSQL Database (Local Development)
For local development, you have two options:

**Option 1: Docker (recommended)**
```bash
docker-compose up postgres -d
```
This starts a PostgreSQL container at `localhost:5432` with:
- Database: `crystalpdf`
- Username: `crystalpdf`
- Password: `crystalpdf_secure_password`

**Option 2: Manual PostgreSQL Installation**
Install PostgreSQL 16+ locally, then create the database:
```sql
CREATE DATABASE crystalpdf;
```
Update `backend/src/main/resources/application.yml` with your connection details if using non-default credentials.

### Build & Run Backend
```bash
cd backend

# Build
./gradlew build

# Run (Spring will auto-create tables via JPA)
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

## Docker Compose (Full Stack)

Run the entire application (PostgreSQL + Backend + Frontend) in containers:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Remove volumes (careful: deletes database)
docker-compose down -v
```

Frontend will be available at `http://localhost` (Nginx reverse proxy).

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
