---
name: streamflow-backend
description: >
  Skill for building and maintaining the Streamflow OTT platform backend — a Spring Boot 4.0.2 (Java 21) 
  video streaming API with PostgreSQL (Neon serverless), AWS S3 v2, FFmpeg HLS transcoding, multi-sheet 
  sprite generation, presigned URL security, async processing, and Docker/Render deployment. Use this skill 
  whenever working on the streamflow-be codebase, creating REST endpoints, JPA entities, S3 storage, 
  video processing pipelines, database schemas, Docker builds, or deploying to Render. Trigger on any 
  mention of "streamflow backend", "streamflow-be", "OTT backend", "Spring Boot streaming", "video 
  processing API", "HLS transcoding", "S3 upload", "sprite sheet generation", FFmpeg, or related tasks.
---

# Streamflow Backend Skill

## Overview

**Streamflow** backend (`streamflow-be/`) is a Spring Boot 4.0.2 + Java 21 API handling video upload,
FFmpeg HLS multi-resolution transcoding, multi-sheet sprite generation, content metadata, and secure S3 delivery.

**Port:** 8080 | **Deploy:** Docker → GHCR → Render | **DB:** PostgreSQL (Neon serverless)

---

## Tech Stack

| Layer       | Technology                                                                |
| ----------- | ------------------------------------------------------------------------- |
| Framework   | Spring Boot 4.0.2 (WebMVC, Data JPA, Validation)                          |
| Language    | Java 21                                                                   |
| Database    | PostgreSQL (Neon serverless) + HikariCP (5 max, tuned)                    |
| ORM         | Spring Data JPA / Hibernate (auto-update DDL)                             |
| Storage     | AWS S3 SDK v2 (2.25.58) + URL Connection Client                           |
| Transcoding | FFmpeg (system binary) — HLS multi-variant                                |
| Code Gen    | Lombok                                                                    |
| Testing     | H2 in-memory + Spring Boot Test                                           |
| Build       | Maven (wrapper included)                                                  |
| Container   | Docker (multi-stage: maven:3.9-temurin-21-alpine → temurin:21-jre-alpine) |
| CI/CD       | GitHub Actions → GHCR → Render webhook                                    |

---

## Project Structure

```
streamflow-be/
├── src/main/java/com/streamflow/
│   ├── StreamflowApplication.java           # Entry + @EnableAsync
│   ├── config/
│   │   ├── CorsConfig.java                  # CORS (configurable origins)
│   │   ├── S3Config.java                    # S3Client + S3Presigner beans
│   │   ├── DatabaseUrlEnvironmentPostProcessor.java  # DATABASE_URL → Spring props
│   │   └── DotEnvEnvironmentPostProcessor.java       # .env loader for dev
│   ├── controller/
│   │   ├── ContentController.java            # Content CRUD + video upload + processing
│   │   ├── MediaController.java              # Playback sessions + S3 URLs + HLS proxy
│   │   ├── HealthController.java             # Health check
│   │   └── DemoController.java               # Test endpoints
│   ├── dto/
│   │   ├── ContentDetailResponse, ContentSummaryResponse, CreateContentRequest
│   │   ├── PlaybackSessionRequest, PlaybackSessionResponse
│   │   ├── VideoUploadResponse, VideoProcessingResponse, UploadUrlResponse
│   │   ├── SpriteSheetResponse, SpriteSheetEntry, SpriteGenerationTriggeredResponse
│   │   └── HealthResponse
│   ├── entity/
│   │   ├── BaseEntity.java (UUID PK, createdAt, updatedAt, status)
│   │   ├── Content.java (title, description, contentType, releaseYear, posterUrl, publishStatus)
│   │   ├── VideoAsset.java (rawS3Key, manifestUrl, uploadStatus, processingStatus, multipart tracking)
│   │   ├── VideoVariant.java (resolution, bitrateKbps, codec, segmentPath)
│   │   ├── SpriteSheet.java (sheetIndex, startFrame, endFrame, s3Key, columns, rows, thumbWidth)
│   │   └── enums/ (ContentType, ProcessingStatus, PublishStatus, UploadStatus)
│   ├── repository/
│   │   ├── ContentRepository, VideoAssetRepository
│   │   ├── VideoVariantRepository, SpriteSheetRepository
│   ├── service/
│   │   ├── ContentService.java               # Content CRUD + asset upload
│   │   ├── VideoUploadService.java           # Upload orchestration
│   │   ├── HlsTranscodingService.java        # FFmpeg single-pass multi-variant HLS
│   │   ├── SpriteSheetService.java           # FFmpeg multi-sheet sprite generation
│   │   ├── VideoProcessingService.java       # Async processing orchestration
│   │   ├── PlaybackService.java              # Session creation + presigned URLs
│   │   └── S3StorageService.java             # S3 upload/download/presign/multipart
│   └── exception/
│       ├── GlobalExceptionHandler.java        # @RestControllerAdvice
│       ├── BadRequest, ResourceNotFound, Conflict, Forbidden
│       └── S3Upload, S3Storage, VideoProcessing, VideoUpload exceptions
├── src/main/resources/
│   ├── application.properties                 # All config (DB, S3, HLS, sprites, limits)
│   ├── META-INF/spring.factories              # Custom env processors
│   ├── VERSION
│   └── db/migration/V2__sprite_sheet_multiple_per_asset.sql
├── Dockerfile, .dockerignore, .env.example, pom.xml, mvnw
```

---

## Database Schema

### Entities & Relationships

```
Content (1) ──── (1) VideoAsset (1) ──── (N) VideoVariant
                           │
                           └──── (N) SpriteSheet
```

### Key Enums

- **ContentType:** MOVIE, SERIES
- **PublishStatus:** DRAFT, PUBLISHED
- **UploadStatus:** PENDING → MULTIPART_INITIATED → UPLOADING → COMPLETED/FAILED/CANCELLED
- **ProcessingStatus:** NONE → QUEUED → PROCESSING → COMPLETED/FAILED

### VideoAsset State Machine

`markUploadStarted()` → `markMultipartInitiated(uploadId, totalParts)` → `incrementUploadedParts()` → `markUploadCompleted(rawS3Key)` → `markProcessingQueued()` → `markProcessingStarted()` → `markProcessingCompleted(manifestUrl)`

---

## Video Processing Pipeline

### HLS Transcoding (HlsTranscodingService)

- **Strategy:** Single-pass FFmpeg with `filter_complex` + `split` (decodes source once)
- **Presets:** 360p (640x360, 800kbps) + 720p (1280x720, 2800kbps) — h264, ultrafast
- **Segment Duration:** 10s (configurable)
- **Output:** master.m3u8 + variant playlists + .ts segments → S3 (16 concurrent uploads)

### Sprite Sheet Generation (SpriteSheetService)

- **Tool:** FFmpeg frame extraction
- **Config:** 10s intervals, 160x90px thumbs, 10x10 grid, 100 frames/sheet, max 100K frames
- **Multi-sheet:** Multiple PNG sheets per video → only needed sheet loaded by frontend
- **Migration:** V2 converted from single-sheet to multi-sheet schema

### S3 Storage Architecture

```
images/*          → posters, thumbnails
videos/*          → raw uploaded videos
hls/{assetId}/    → master.m3u8 + {resolution}/playlist.m3u8 + .ts segments
sprites/*         → sprite sheet PNG images
```

- **Limits:** 2GB max file, 100MB threshold for presigned multipart, 15-60 min URL expiry
- **MinIO compatible** via endpoint override + path-style access

---

## API Endpoints

### ContentController (`/api/content`)

| Method | Path                                   | Description                           |
| ------ | -------------------------------------- | ------------------------------------- |
| GET    | /api/content                           | List all content                      |
| GET    | /api/content/{id}                      | Content detail                        |
| POST   | /api/content                           | Create content (validated)            |
| POST   | /api/content/{id}/assets               | Upload poster + thumbnail (multipart) |
| POST   | /api/content/{id}/video                | Upload video → async HLS transcode    |
| GET    | /api/content/{id}/video/status         | Upload + processing status            |
| POST   | /api/content/{id}/video/retry          | Retry failed upload                   |
| DELETE | /api/content/{id}/video                | Cancel upload                         |
| POST   | /api/content/{id}/video/process        | Trigger sprite generation             |
| GET    | /api/content/{id}/video/process/status | Sprite processing status              |

### MediaController (`/api/media`)

| Method | Path                               | Description                                 |
| ------ | ---------------------------------- | ------------------------------------------- |
| GET    | /api/media/url?key=&exp=           | Presigned S3 URL                            |
| POST   | /api/media/playback/sessions       | Create playback session (HLS + sprite URLs) |
| GET    | /api/media/playback/stream/{id}/\* | Proxy HLS manifests/segments from S3        |

---

## Environment Variables

```env
# Database (Render-style URL auto-mapped)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# AWS S3
STREAMFLOW_AWS_S3_REGION=ap-south-1
STREAMFLOW_AWS_S3_BUCKET=streamflow-netflix-demo
STREAMFLOW_AWS_S3_ACCESS_KEY_ID=
STREAMFLOW_AWS_S3_SECRET_ACCESS_KEY=

# Optional
PORT=8080
STREAMFLOW_API_BASE_URL=http://localhost:8080
STREAMFLOW_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
STREAMFLOW_AWS_S3_ENDPOINT_OVERRIDE=    # MinIO
STREAMFLOW_AWS_S3_PATH_STYLE_ACCESS=    # MinIO
```

---

## Build & Deploy

```bash
./mvnw spring-boot:run          # Local dev
./mvnw clean package -DskipTests # Build JAR
docker build -t streamflow-be .  # Docker build
docker run -p 8080:8080 --env-file .env streamflow-be
```

**CI/CD:** Push main → GitHub Actions → Docker build → GHCR push → Render deploy webhook

---

## Development Guidelines

- **Entities:** Extend BaseEntity (UUID, timestamps). Use Lombok. Lazy fetch for relations.
- **Services:** @Service + @Transactional. S3 via S3StorageService. Async via @Async.
- **Testing:** H2 in-memory + @WebMvcTest + @DataJpaTest. Mock S3StorageService.
- **FFmpeg:** Must be installed on runtime. Docker image should include it.
- **Performance:** Single-pass FFmpeg, 16-thread S3 uploads, HikariCP tuned for Neon, presigned URL offloading.
