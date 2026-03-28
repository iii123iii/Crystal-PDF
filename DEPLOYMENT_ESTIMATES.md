# Crystal-PDF Deployment Estimates

Resource requirements for running on Ubuntu server. Estimates account for PDF processing tools (Ghostscript, Tesseract OCR, LibreOffice, QPDF, Python+OpenCV) which are CPU/memory-intensive.

---

## Quick Reference

| Tier | CPU | RAM | Storage | Users | Concurrent PDFs |
|------|-----|-----|---------|-------|-----------------|
| **Development** | 2 cores | 4 GB | 50 GB | 1-5 | 1 |
| **Small** | 4 cores | 8 GB | 100 GB | 10-50 | 2-3 |
| **Medium** | 8 cores | 16 GB | 500 GB | 50-200 | 5-8 |
| **Large** | 16+ cores | 32+ GB | 1-2 TB | 200+ | 10+ |

---

## Detailed Analysis

### 1. Frontend (React SPA + Nginx)

**Memory:** 50-100 MB
- Nginx reverse proxy: 10-20 MB
- SPA assets cached: 20-30 MB
- Connection buffers: 20-50 MB

**CPU:** 0.1-0.5 cores (mostly idle)
- Serves static files
- Reverse proxy to backend
- SSL/TLS termination (if HTTPS)

**Storage:** 50-100 MB
- React build artifacts: 3-5 MB
- Nginx config: <1 MB
- Logs (rotate): 10-50 MB

---

### 2. Backend (Spring Boot 3 + Java 21)

**Memory:** 512 MB - 2 GB (per instance)
- JVM heap: 256-512 MB minimum (configured via `MaxRAMPercentage=75%` in Dockerfile)
- G1GC overhead: 50-100 MB
- Spring framework: 100-150 MB
- Active connections/threads: 100-200 MB

**CPU per concurrent operation:**
- REST API (lightweight): 0.1-0.2 cores
- PDF reading (PDFBox, PDFTextStripper): 0.3-0.5 cores
- Annotation flattening: 0.5-1 core
- Redaction (content stream parsing): 0.5-1 core

**Storage:** 1-5 GB
- Application JAR: 50-100 MB
- Temporary files during processing: 500 MB - 2 GB (cleaned up)
- Logs: 100-500 MB (rotated)

---

### 3. PostgreSQL Database

**Memory:** 256 MB - 2 GB
- Shared buffers: 256 MB (25% of RAM, minimum)
- Effective cache size: 500 MB - 1 GB
- Work memory: 64 MB per operation

**CPU:** 0.1-0.5 cores
- Read-heavy (documents, users, metadata)
- Lightweight write operations
- No complex aggregations

**Storage:**
- Base tables: 10-50 MB (user, document metadata)
- Per 1000 PDFs: +5-10 MB
- **Typical:** 100-500 MB for 10,000 documents
- Backups (3x retention): 300-1500 MB

---

### 4. PDF Processing Tools (The Heavy Lifters)

#### Ghostscript (Compression)
- **Memory per operation:** 200-500 MB (small PDFs) to 1-2 GB (large PDFs)
- **CPU per operation:** 1-2 cores (I/O-bound)
- **Time:** 5-30 seconds per PDF
- **Concurrency:** 1-2 simultaneous operations recommended

#### Tesseract OCR
- **Memory per operation:** 300-800 MB
- **CPU per operation:** 2-4 cores (CPU-bound)
- **Time:** 30 seconds - 5 minutes (depends on PDF size/complexity)
- **Concurrency:** 1-2 simultaneous operations (highly CPU-intensive)

#### LibreOffice Headless (Word→PDF)
- **Memory per operation:** 500 MB - 1.5 GB
- **CPU per operation:** 1-2 cores (I/O-bound)
- **Time:** 5-15 seconds
- **Concurrency:** 1 operation at a time (avoid parallel)

#### QPDF (Optimization)
- **Memory per operation:** 100-300 MB
- **CPU per operation:** 0.5-1 core
- **Time:** 1-5 seconds
- **Concurrency:** 3-4 simultaneous operations

#### Python + OpenCV (Image processing)
- **Memory per operation:** 200-600 MB
- **CPU per operation:** 1-2 cores
- **Time:** 5-20 seconds
- **Concurrency:** 2-3 simultaneous operations

---

## Deployment Tiers

### Development (Local Testing)

```
CPU:     2 cores (Intel i5/AMD Ryzen 5)
RAM:     4 GB
Storage: 50 GB SSD
```

**Use case:** Solo development, testing features.

**Services:**
- Backend (1 instance): 512 MB JVM
- PostgreSQL (1 instance): 256 MB
- Frontend: <100 MB

**Limitation:** Only 1 concurrent PDF operation. Ghostscript/OCR will block other requests.

---

### Small Production (10-50 Users)

```
CPU:     4 cores (e.g., AWS t3.medium, DigitalOcean 4GB droplet)
RAM:     8 GB
Storage: 100 GB SSD
```

**Allocation:**
- Backend: 4 GB JVM (2-3 concurrent requests)
- PostgreSQL: 1 GB (256 MB shared buffers)
- OS/tools/headroom: 2-3 GB

**Handling:**
- 2-3 simultaneous PDF operations
- 10-50 active users (~5-10 concurrent sessions)

**Bottleneck:** Ghostscript/OCR blocks on sequential operations. Consider queue.

**Example:** Single DigitalOcean $24/month droplet (4GB/2vCPU) handles this.

---

### Medium Production (50-200 Users)

```
CPU:     8 cores (e.g., AWS t3.large, DigitalOcean 16GB)
RAM:     16 GB
Storage: 500 GB SSD + 1 TB backup
```

**Allocation:**
- Backend (2 instances): 3-4 GB each
- PostgreSQL (1 instance): 4 GB (1 GB shared buffers)
- OS/tools: 4-5 GB

**Handling:**
- 5-8 simultaneous PDF operations (with job queue)
- 50-200 concurrent users
- Load balancer distributes requests

**Setup:**
```yaml
Frontend:    1 Nginx instance (100 MB)
Backend:     2 Spring Boot instances (4 GB each)
Database:    1 PostgreSQL instance (4 GB)
Job Queue:   Redis or database-backed (1 GB)
Storage:     500 GB SSD (home), 500 GB backup
```

**Cost:** ~$100-150/month (DigitalOcean App Platform or AWS RDS + EC2).

---

### Large Production (200+ Users)

```
CPU:     16+ cores (AWS c5.4xlarge, etc.)
RAM:     32+ GB
Storage: 1-2 TB SSD + 2 TB backup
```

**Architecture:**
- **Frontend:** Load-balanced Nginx × 2 (failover)
- **Backend:** Autoscaling 4-8 instances (each 2-3 GB JVM)
- **Database:** PostgreSQL Primary + Read Replica (8 GB each)
- **Job Queue:** Dedicated Redis cluster (2-4 GB)
- **Storage:** S3/object store or NAS (1-2 TB, replicated)

**Handling:**
- 10-20+ concurrent PDF operations (distributed across workers)
- 200+ concurrent users
- Session affinity not required (stateless API)

**Cost:** $500-1000+/month (managed database, multiple compute nodes, backup/DR).

---

## Resource Allocation for Each Service

### Backend Container Limits (docker-compose)

```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 2g        # Small: 1g, Medium: 2g, Large: 4g per instance
      reservations:
        memory: 1g
        cpus: 1.0         # Small: 1.0, Medium: 2.0, Large: 4.0
```

### PostgreSQL Container

```yaml
postgres:
  deploy:
    resources:
      limits:
        memory: 2g        # Small: 512m, Medium: 2g, Large: 4g
      reservations:
        memory: 1g
```

### Frontend (Nginx)

```yaml
frontend:
  deploy:
    resources:
      limits:
        memory: 256m      # Rarely goes above 100 MB
```

---

## Storage Breakdown

### Per 1,000 PDFs (1 GB average size)

| Item | Storage |
|------|---------|
| Original uploads | 1 TB |
| Processed copies (redaction, annotation, split) | 2-3 TB |
| Database metadata | 10 MB |
| Logs | 100-500 MB |
| **Total** | **3-4 TB** |

### Retention Policy

- **Hot storage (SSD):** 30 days of active PDFs = 100 GB - 1 TB
- **Archive (HDD/Object store):** 90+ days = 500 GB - 2 TB
- **Backups (3x retention):** 500 GB - 2 TB

---

## Performance Tuning

### PostgreSQL (postgresql.conf)

```ini
# For 8 GB RAM system
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 32MB
maintenance_work_mem = 512MB
random_page_cost = 1.1
```

### JVM (Spring Boot)

```bash
# Add to docker-compose or systemd service
JAVA_OPTS="-XX:+UseG1GC \
           -XX:MaxGCPauseMillis=200 \
           -XX:+UnlockDiagnosticVMOptions \
           -XX:G1SummarizeRSetStatsPeriod=1 \
           -XX:ParallelGCThreads=4 \
           -XX:ConcGCThreads=2"
```

### Process Limits (ulimits)

```bash
# /etc/security/limits.conf
postgres soft memlock unlimited
postgres hard memlock unlimited
postgres soft nofile 65535
postgres hard nofile 65535
```

---

## Monitoring Recommendations

### Critical Metrics

- **CPU:** Alert if >80% for >5 minutes
- **RAM:** Alert if >85% free space
- **Disk:** Alert if <20% free
- **Database:** Slow query log, lock contention
- **Backend:** Request latency, error rate, heap usage
- **Process jobs:** Queue depth, processing time

### Example Prometheus Setup

```yaml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:9090']  # Spring Actuator metrics
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']  # postgres_exporter
```

---

## Deployment Checklist

- [ ] **CPU:** Verify core count matches tier
- [ ] **RAM:** Set container limits in docker-compose
- [ ] **Storage:** Mount separate volume for `/storage` (PDFs)
- [ ] **Backup:** Daily DB snapshots + weekly full storage backup
- [ ] **Logs:** Rotate logs (logrotate, docker log-driver)
- [ ] **Security:** Firewall rules, HTTPS (Let's Encrypt), DB password
- [ ] **Monitoring:** CPU/RAM/Disk alerts
- [ ] **Load testing:** Simulate concurrent PDF operations before production
- [ ] **Job queue:** Add Redis/database queue for long operations (OCR, compression)

---

## Example Ubuntu Server Setup (Medium Tier)

### DigitalOcean/Linode/Vultr Config

```bash
# OS: Ubuntu 22.04 LTS
# Instance: 8 GB RAM, 4 vCPU
# Root disk: 160 GB SSD
# Extra volume: 500 GB for /storage

# 1. Install Docker + Compose
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. Mount extra volume for PDFs
sudo mkdir -p /mnt/storage
sudo mkfs.ext4 /dev/sdb
sudo mount /dev/sdb /mnt/storage
# Add to /etc/fstab for persistence

# 3. Clone repo
git clone https://github.com/iii123iii/Crystal-PDF.git
cd Crystal-PDF

# 4. Adjust docker-compose limits, start
docker-compose up -d

# 5. Monitor
docker stats --no-stream
```

---

## Summary

| Size | CPU | RAM | Storage | Cost (USD/mo) |
|------|-----|-----|---------|---------------|
| Dev | 2 | 4 GB | 50 GB | $0 (local) |
| Small | 4 | 8 GB | 100 GB | $20-30 |
| Medium | 8 | 16 GB | 500 GB | $100-150 |
| Large | 16+ | 32+ GB | 1-2 TB | $500+ |

**Recommendation:** Start with **Small** tier on DigitalOcean Droplet ($24/mo basic) or AWS t3.medium. Add job queue (Redis) before scaling to Large.
