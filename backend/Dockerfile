# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /app

# Copy wrapper first so dependency layer is cached independently of source
COPY gradlew gradlew.bat ./
COPY gradle ./gradle
RUN chmod +x gradlew

COPY build.gradle settings.gradle ./
# Pre-fetch dependencies (layer cached until build files change)
RUN ./gradlew dependencies --no-daemon -q || true

COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test


# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

# Install system processing tools required for PDF tools
# - ghostscript: PDF compression and processing
# - tesseract-ocr: Optical character recognition (OCR)
# - libreoffice-writer: Word/Office document to PDF conversion
# - qpdf: PDF optimization and manipulation
# - python3 + opencv: Image processing for PDF-to-Image conversion
RUN apt-get update && apt-get install -y --no-install-recommends \
        ghostscript \
        tesseract-ocr \
        libreoffice-writer \
        qpdf \
        python3 \
        python3-opencv \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-jar", "app.jar"]
