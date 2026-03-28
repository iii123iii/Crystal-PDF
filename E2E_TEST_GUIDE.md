# Crystal-PDF End-to-End Testing Guide

## Prerequisites

- Docker and Docker Compose installed
- Java 21 + Gradle (for local testing)
- Node.js 18+ (for frontend dev)
- Test PDF files (create sample.pdf, sample2.pdf in project root for testing)

---

## Test Plan 1: Backend & Docker

### 1.1 Start Docker Stack

```bash
# From project root
docker-compose up -d

# Verify services are running
docker ps
# Should see: postgres, backend, frontend/nginx containers

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

### 1.2 Verify Backend Is Running

```bash
# Check if backend is accessible
curl -s http://localhost:8080/actuator/health | jq

# Should respond with: {"status":"UP"}

# List available endpoints (Spring Boot actuator)
curl -s http://localhost:8080/actuator | jq '.links | map(.href)'
```

### 1.3 Test Database Connectivity

```bash
# Connect to database container
docker exec -it crystalpdf-postgres psql -U crystalpdf -d crystalpdf -c "SELECT 1;"

# Should return: "1"
```

### 1.4 Verify System Dependencies

```bash
# Check ghostscript (compression)
docker exec crystalpdf-backend ghostscript --version

# Check tesseract (OCR)
docker exec crystalpdf-backend tesseract --version

# Check libreoffice (Word->PDF)
docker exec crystalpdf-backend libreoffice --version

# Check QPDF
docker exec crystalpdf-backend qpdf --version
```

---

## Test Plan 2: Authentication & File Upload

### 2.1 Register User

```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }' \
  -v

# Should return 200 with user email in response
# Should set auth_token HTTP-only cookie (visible in -v output)
```

### 2.2 Login

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }' \
  -c cookies.txt \
  -v

# Save cookies for subsequent requests
```

### 2.3 Upload PDF

```bash
# Create a test PDF if needed
echo "Test PDF content" > test.txt
# (Use actual PDF file or create one via:)
# libreoffice --headless --convert-to pdf test.txt

curl -X POST http://localhost/api/documents/upload \
  -F "file=@sample.pdf" \
  -b cookies.txt \
  -v

# Should return 200 with DocumentResponse:
# {
#   "id": <number>,
#   "originalName": "sample.pdf",
#   "mimeType": "application/pdf",
#   "sizeBytes": <number>,
#   "createdAt": "<timestamp>"
# }

# Save the document ID for next tests
DOC_ID=<returned_id>
```

### 2.4 List User's Files

```bash
curl http://localhost/api/documents/my-files \
  -b cookies.txt

# Should return array of DocumentResponse objects
```

---

## Test Plan 3: Tool Endpoints

### 3.1 Test Compress Tool

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/compress \
  -H "Content-Type: application/json" \
  -d '{
    "level": "ebook",
    "sourcePassword": null
  }' \
  -b cookies.txt \
  -v

# Should return 200 with new DocumentResponse (compressed PDF)
# Name should be: "sample_compressed.pdf"
COMPRESSED_ID=<returned_id>
```

### 3.2 Test Split/Extract Pages

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/split \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [1, 3, 5],
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should extract pages 1, 3, 5
# Name should be: "sample_split.pdf"
```

### 3.3 Test Rotate Pages (NEW)

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/rotate \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [1, 2],
    "rotation": 90,
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should rotate pages 1-2 by 90 degrees
# Name should be: "sample_rotated.pdf"
```

### 3.4 Test Delete Pages (NEW)

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/delete-pages \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [2, 4],
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should DELETE pages 2 and 4, keep 1, 3, 5, etc.
# Name should be: "sample_deleted.pdf"
```

### 3.5 Test Reorder Pages (NEW)

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "pageOrder": [5, 3, 1, 2, 4],
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should reorder to: 5, 3, 1, 2, 4, ...
# Name should be: "sample_reordered.pdf"
```

### 3.6 Test OCR Tool

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "language": "eng",
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should OCR the document
# Takes longer (30-60s for multi-page PDFs)
# Name should be: "sample_ocr.pdf"
```

### 3.7 Test Merge Tool

```bash
# First, upload two PDFs
DOC1_ID=<first_pdf_id>
DOC2_ID=<second_pdf_id>

curl -X POST http://localhost/api/documents/$DOC1_ID/tools/merge \
  -H "Content-Type: application/json" \
  -d '{
    "otherDocumentIds": ['$DOC2_ID'],
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should merge DOC1 with DOC2
# Name should be: "sample_merged.pdf"
```

### 3.8 Test Sanitize Tool (NEW)

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/sanitize \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should remove all metadata
# Name should be: "sample_sanitized.pdf"
```

### 3.9 Test Flatten Annotations

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/flatten-annotations \
  -H "Content-Type: application/json" \
  -d '{
    "pages": {
      "1": {
        "strokes": [
          {
            "type": "pen",
            "color": "#FF0000",
            "width": 2.5,
            "opacity": 0.8,
            "points": [[0.1, 0.2], [0.3, 0.4]]
          }
        ],
        "texts": []
      }
    },
    "scale": 1.0,
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should flatten annotations to PDF
# Name should be: "sample_annotated.pdf"
```

---

## Test Plan 4: Frontend - UI & Staging

### 4.1 Open UI

```bash
# Navigate to http://localhost in browser
# Should see landing page

# Click "Sign In" or "Sign Up"
# Register: test@example.com / testpass123
```

### 4.2 Upload & View PDF

1. Go to "/dashboard" (My Files)
2. Click "Upload PDF"
3. Select `sample.pdf` from disk
4. Click "Open" on the uploaded file
5. Should see PDF rendered in viewer

### 4.3 Test Tool Chaining (Staging)

1. Open a PDF in workspace
2. Click "Compress" in left sidebar → floating toolbar appears
3. Select "eBook" quality
4. Click "Compress PDF"
5. Watch for toast: "Added "sample_compressed.pdf" to staging"
6. **Check staging queue in left sidebar:**
   - Should show 1 staged document
   - "sample_compressed.pdf" should be visible
   - Should have "Open" button and undo arrow (↑)
7. Click "Open" → loads the compressed PDF
8. Now click "Merge" tool → should offer to merge with other PDFs
9. Select another PDF and merge
10. Toast appears: "Added "sample_merged.pdf" to staging"
11. **Staging should now show 2 documents:**
    - Original compressed
    - New merged result (with undo arrow pointing to parent)

### 4.4 Test Undo Chain

1. With merged document open (from 4.3)
2. In left sidebar staging queue, find the merged document
3. Click the ↑ (undo) button
4. Document should be removed from staging
5. Original compressed document should be selected instead
6. Clicking "Open" should show the compressed (not merged) version

### 4.5 Test Visual Organizer

1. Open any PDF in workspace
2. Click grid icon (⊞) in header → Page Organizer opens
3. Should see grid of page thumbnails
4. Verify features:
   - [ ] Pages render as thumbnails
   - [ ] Drag page 3 to position 1 → reorder happens
   - [ ] Hover over page → see rotate (↻) and delete (🗑) buttons
   - [ ] Click rotate → shows rotation badge (90°, 180°, etc.)
   - [ ] Click delete → removes page from grid
   - [ ] "Select All" → all pages highlighted in blue
   - [ ] "Deselect All" → no pages highlighted
   - [ ] Multi-select (Shift+Click) → highlights multiple
   - [ ] Bottom action bar: "Rotate Selected" and "Delete Selected"
5. Click "Export PDF" → returns to workspace

### 4.6 Test Keyboard Shortcuts (in Visual Organizer)

1. In Page Organizer:
   - [ ] Press `j` → cursor moves to next page (if any)
   - [ ] Press `k` → cursor moves to previous page
   - [ ] Press `r` → rotates current page 90°
   - [ ] Press `d` → deletes current page
   - [ ] Press `Shift+A` → selects all pages
   - [ ] Press `Esc` → deselects all
2. Header should show keyboard hints: `j/k nav | r rotate | d delete | shift+a all`

### 4.7 Test Page Rotation (if backend implemented)

1. In Visual Organizer, click rotate button on a page
2. Page thumbnail rotates visually (90° increments)
3. Click "Export PDF"
4. Download the PDF
5. Open in external PDF viewer → pages should be rotated

### 4.8 Test Page Deletion

1. In Visual Organizer, click delete button on a page
2. Page disappears from grid
3. Page count decreases
4. Click "Export PDF"
5. Verify downloaded PDF has one fewer page

### 4.9 Test Annotation

1. In workspace, click "Annotate" in sidebar
2. Floating annotation toolbar should appear above PDF
3. [ ] Select pen tool → cursor should change
4. [ ] Draw on page → strokes should appear
5. [ ] Select highlighter → draw yellow highlight
6. [ ] Click "Save to PDF" → adds to staging
7. Check staging queue for annotated document

---

## Test Plan 5: Error Handling

### 5.1 Wrong Password

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/compress \
  -H "Content-Type: application/json" \
  -d '{
    "level": "ebook",
    "sourcePassword": "wrongpassword"
  }' \
  -b cookies.txt

# Should return 400 or 403 with error message about password
```

### 5.2 Invalid Page Numbers

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/split \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [999],
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should return 400 with error: "Page 999 exceeds document length"
```

### 5.3 Invalid Rotation

```bash
curl -X POST http://localhost/api/documents/$DOC_ID/tools/rotate \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [1],
    "rotation": 45,
    "sourcePassword": null
  }' \
  -b cookies.txt

# Should return 400: "Rotation must be 90, 180, or 270"
```

---

## Test Plan 6: Full User Journey

### Scenario: Prepare a Multi-Page PDF for Printing

**User Goal:** Take a scanned PDF, straighten rotated pages, compress for email, and add annotations

**Steps:**

1. ✅ Upload `scanned.pdf` (10 pages, some rotated)
2. ✅ Open in workspace
3. ✅ Click "Page Organizer" grid icon
4. ✅ Use keyboard: `j/k` to navigate to page 3
5. ✅ Press `r` to rotate it 90°
6. ✅ Find page 7, click delete button
7. ✅ Click "Export PDF" → download "scanned_reordered.pdf"
8. ✅ Back in workspace, click "Compress" tool
9. ✅ Select "Screen" quality (smallest file)
10. ✅ Click "Compress PDF" → added to staging
11. ✅ In staging, see "scanned_reordered_compressed.pdf"
12. ✅ Click "Open" → loads compressed version
13. ✅ Click "Annotate" tool
14. ✅ Draw signature on page 1
15. ✅ Click "Save to PDF" → "scanned_reordered_compressed_annotated.pdf" added to staging
16. ✅ Download from staging queue
17. ✅ Verify file size is < 1MB, and contains annotations

**Expected Result:** User successfully processed a multi-stage pipeline without manually downloading/re-uploading between steps.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check logs: `docker-compose logs backend`. Verify Java 21 available. |
| Tesseract not found | Ensure tesseract-ocr is installed in Docker. Check: `docker exec crystalpdf-backend tesseract --version` |
| Ghostscript errors | Verify ghostscript is installed and accessible in Docker |
| Database connection fails | Verify postgres is running and healthy: `docker-compose ps` |
| Frontend shows 401 errors | Ensure you're logged in. Check HTTP-only cookies are being sent. |
| Staging appears empty | Hard refresh browser (Ctrl+Shift+R). Check console for JS errors. |
| Page thumbnails don't load | Verify PDF.js worker is available at `/pdf.worker.min.js`. Check browser console. |

---

## Success Criteria

- [ ] All 8 new backend endpoints (rotate, delete, reorder, extract, sanitize, + existing) work
- [ ] All tools appear in floating toolbar and complete without error
- [ ] Staging queue shows documents and allows chaining
- [ ] Undo button works (reverts to parent document)
- [ ] Visual Organizer renders pages and allows manipulation
- [ ] Vim-style keyboard shortcuts work (j/k/r/d/shift+a/esc)
- [ ] Page rotations/deletions persist through export
- [ ] Full multi-tool pipeline works without manual file handling
- [ ] Docker stack starts cleanly and all services are healthy

