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

# Install system processing tools
RUN apt-get update && apt-get install -y --no-install-recommends \
        libreoffice-writer \
        libreoffice-calc \
        ghostscript \
        qpdf \
        tesseract-ocr \
        python3 \
        python3-opencv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
