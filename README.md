# AI-JLSP Setup & Run Guide

## Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose (v2.0+)
- Node.js 18+
- Python 3.11+
- Git

### 1. Clone & Navigate
```bash
cd d:\AI-JLSP
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Generate encryption keys (Unix/Linux/WSL)
bash scripts/generate-keys.sh

# Or on Windows PowerShell:
# Manually set random JWT_SECRET and ENCRYPTION_KEY in .env
# Generate secure keys via: openssl rand -hex 32
```

### 3. Start Services (First Time)
```bash
# Build and start all services in the background
docker-compose -f docker-compose.yml up -d

# Watch logs for initialization
docker-compose logs -f

# Wait for all services to be healthy (2-3 minutes)
# Check status:
docker-compose ps
# All should show "healthy" or "Up"
```

### 4. Initialize Database
```bash
# The PostgreSQL init script runs automatically on first start
# To verify schema created:
docker-compose exec postgres psql -U postgres -d ai_jlsp -c "\dt"

# Expected output: audit_log, users, dpa_consent_records, breach_notifications, etc.
```

### 5. Run Frontend (Development)
```bash
# Terminal 1: Start backend + AI services (already running in docker-compose)
# Terminal 2: Run Next.js dev server
cd packages/frontend
npm install
npm run dev

# Frontend available at: http://localhost:3000
```

### 6. Access Dashboard
```
http://localhost:3000/en
```

---

## Full Local Development Setup

### Step 1: Install Dependencies
```bash
# Root monorepo dependencies
npm install

# Install workspaces
npm install --workspaces

# AI service dependencies
cd packages/ai-service
pip install -r requirements.txt
cd ../..
```

### Step 2: Start Docker Services
```bash
# Start PostgreSQL, Redis, Qdrant, backend, ai-service
docker-compose up -d

# Verify all healthy
docker-compose ps
```

### Step 3: Run All Services Locally (Optional)

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
# Backend on http://localhost:3001
```

**Terminal 2 - AI Service:**
```bash
cd packages/ai-service
python -m uvicorn app.main:app --reload --port 3002
# AI Service on http://localhost:3002
```

**Terminal 3 - Frontend:**
```bash
cd packages/frontend
npm run dev
# Frontend on http://localhost:3000
```

---

## Environment Variables Explained

```env
# Database (PostgreSQL)
DB_HOST=postgres               # Docker service name
DB_NAME=ai_jlsp               # Database name
DB_USER=postgres              # DB user
DB_PASSWORD=SECURE_PASSWORD   # ⚠️ Change for production
DB_SSL=true                   # Enable SSL

# Encryption (DPA Sec 26)
ENCRYPTION_KEY=<32-byte-hex>  # AES-256 key (script generates)
ENCRYPTION_ALGORITHM=aes-256-cbc

# JWT (Constitution Art 47)
JWT_SECRET=<32-byte-hex>      # HS256 signing key (script generates)
JWT_EXPIRY=86400              # 24 hours (adjust per sensitivity)
MFA_ENABLED=true              # Require MFA for sensitive ops

# Redis (Sessions & Cache)
REDIS_HOST=redis
REDIS_PORT=6379

# Qdrant (Vector DB for Legal-BERT-KE)
QDRANT_HOST=qdrant
QDRANT_API_KEY=<generate>     # Change in production

# DPA Compliance (Sec 25-43)
DPA_DATA_RETENTION_DAYS=2555   # 7 years (audit logs)
DATA_RESIDENCY=KE              # Kenya only
DPIA_THRESHOLD=10000           # Auto-trigger DPIA if >10K records/month

# Feature Flags (Phase 1 MVP)
FEATURE_ENABLE_AI_PRE_VALIDATION=true
FEATURE_ENABLE_DEADLINE_ENGINE=true
FEATURE_ENABLE_DPA_CONSENT_LAYER=true
```

---

## Common Commands

### Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f SERVICE_NAME   # e.g., backend, postgres
docker-compose logs -f                # all services

# Rebuild images
docker-compose build --no-cache

# Health check
docker-compose ps
```

### Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d ai_jlsp

# Run SQL commands
docker-compose exec postgres psql -U postgres -d ai_jlsp -c "SELECT * FROM users LIMIT 5;"

# Backup
docker-compose exec postgres pg_dump -U postgres ai_jlsp > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres ai_jlsp < backup.sql
```

### Frontend
```bash
cd packages/frontend

# Development
npm run dev                    # Hot reload on http://localhost:3000

# Production build
npm run build
npm run start                  # Runs optimized build

# Linting
npm run lint                   # Check code quality

# Type checking
npx tsc --noEmit
```

### Backend
```bash
cd packages/backend

# Development
npm run dev                    # ts-node with auto-reload

# Build
npm run build                  # Compile TypeScript to dist/

# Start
npm start                      # Run compiled app

# Database migration
npm run migrate                # Apply schema changes

# Seed data
npm run seed                   # Populate test data
```

### AI Service
```bash
cd packages/ai-service

# Development
uvicorn app.main:app --reload --port 3002

# Production
gunicorn -w 2 -b 0.0.0.0:3002 app.main:app

# Test
pytest

# Format code
black app && isort app
```

---

## Testing Compliance

### 1. RBAC Enforcement
```bash
# Test 1: Citizen tries to access admin panel (should fail)
CITIZEN_TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -d '{"email":"citizen@example.com","password":"pwd"}' | jq -r '.accessToken')

curl -H "Authorization: Bearer $CITIZEN_TOKEN" \
  http://localhost:3001/api/admin/users
# Expected: 403 Forbidden

# Test 2: TDR Officer can approve TDR cases
TDR_TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -d '{"email":"tdr@kra.go.ke","password":"pwd"}' | jq -r '.accessToken')

curl -X POST -H "Authorization: Bearer $TDR_TOKEN" \
  http://localhost:3001/api/tax-disputes/123/approve
# Expected: 200 OK
```

### 2. Audit Trail Immutability
```bash
# Verify hash chain integrity
docker-compose exec postgres psql -U postgres -d ai_jlsp -c \
  "SELECT id, hash_value, previous_hash_value FROM audit_log ORDER BY timestamp LIMIT 5;"

# Attempt to modify (should fail)
docker-compose exec postgres psql -U postgres -d ai_jlsp -c \
  "UPDATE audit_log SET hash_value='fake' WHERE id='test';"
# Expected: zero rows affected
```

### 3. Consent Verification
```bash
# Create consent record
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"consentType":"ai_analysis","given":true}' \
  http://localhost:3001/api/consent

# Verify stored
docker-compose exec postgres psql -U postgres -d ai_jlsp -c \
  "SELECT * FROM dpa_consent_records WHERE user_id='...';"
```

### 4. Encryption at Rest
```bash
# Verify encrypted fields
docker-compose exec postgres psql -U postgres -d ai_jlsp -c \
  "SELECT encrypted FROM audit_log LIMIT 1;"
# Expected: t (true)

# Attempt to read plaintext password (should fail)
docker-compose exec postgres psql -U postgres -d ai_jlsp -c \
  "SELECT password_hash FROM users LIMIT 1;"
# Expected: binary/encrypted data, not plaintext
```

---

## Troubleshooting

### Services Not Healthy
```bash
# Check logs
docker-compose logs -f postgres    # Check database errors
docker-compose logs -f backend     # Check API errors

# Common issues:
# 1. Port already in use: Change in docker-compose.yml ports
# 2. Database not initialized: docker-compose down && up
# 3. Insufficient disk: Check docker volume size
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Check connection from backend
docker-compose exec backend npm run test -- connection

# Reset database
docker-compose down -v              # Remove volumes
docker-compose up -d postgres       # Restart fresh
```

### JWT Authentication Failing
```bash
# Verify JWT_SECRET is set
docker-compose exec backend env | grep JWT_SECRET

# Generate new keys
bash scripts/generate-keys.sh

# Restart with new keys
docker-compose restart backend
```

### Redis Cache Miss
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Verify session stored
KEYS session:*

# Flush cache if needed
FLUSHDB

# Exit
exit
```

---

## Performance Optimization

### Database Indexes (Already Applied)
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename IN ('audit_log', 'users', 'access_logs');
```

### Redis Caching
- Sessions: 24-hour TTL
- Consent records: 7-day TTL
- RBAC permissions: 1-hour TTL

### AI Model Caching
- Legal-BERT-KE cached locally (50MB)
- Embeddings cached in Qdrant (vector DB)

### Query Performance
```bash
# Check slow queries
docker-compose exec postgres psql -U postgres -d ai_jlsp -c \
  "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## Deployment to Production

### 1. Security Checklist
- [ ] Change all passwords (DB_PASSWORD, REDIS_PASSWORD, QDRANT_API_KEY)
- [ ] Generate new JWT_SECRET & ENCRYPTION_KEY
- [ ] Enable TLS 1.3 reverse proxy (nginx/HAProxy)
- [ ] Set NODE_ENV=production for all services
- [ ] Enable MFA_ENABLED=true
- [ ] Configure external backup location
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Configure email for DPA breach notifications

### 2. Infrastructure (Kubernetes Manifests)
```bash
# Manifests in infrastructure/k8s/
kubectl apply -f infrastructure/k8s/postgres-statefulset.yaml
kubectl apply -f infrastructure/k8s/redis-deployment.yaml
kubectl apply -f infrastructure/k8s/qdrant-deployment.yaml
kubectl apply -f infrastructure/k8s/backend-deployment.yaml
kubectl apply -f infrastructure/k8s/ai-service-deployment.yaml
kubectl apply -f infrastructure/k8s/frontend-deployment.yaml
```

### 3. Data Sovereignty (Kenya-Hosted)
- All data in PostgreSQL within Kenyan data center
- No cross-border transfer (DPA Sec 50)
- Verify: `SELECT DISTINCT data_residency FROM audit_log;` → 'KE' only

### 4. Monitoring & Alerts
```bash
# Monitor key metrics
docker stats
docker-compose exec postgres mysqld_safe | grep uptime

# Set alerts for:
# - Audit log table size >10GB
# - RBAC violations >10/hour
# - Failed auth attempts >5/user
# - Low disk space (<10%)
```

---

## Support & Documentation

- **PRD**: Product requirements & user personas → `PRD.md`
- **TRD**: Technical architecture & compliance → `TRD.md`
- **RBAC Matrix**: Role-action-module definitions → `RBAC-POLICY.md`
- **Compliance**: DPA & Constitutional mappings → `COMPLIANCE.md`
- **API Docs**: (Generated) `http://localhost:3001/api-docs`
- **Frontend Docs**: Storybook (future) `http://localhost:6006`

---

## Quick Reference: Key Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/auth/signup` | POST | Register new user | None |
| `/auth/login` | POST | Login + JWT token | Email/Password |
| `/api/my-data` | GET | Download own records (Art 50, DPA Sec 30) | JWT |
| `/api/cases` | GET | List cases (RBAC filtered) | JWT |
| `/api/ai-validation/submit` | POST | AI pre-validation checklist | JWT |
| `/api/consent` | POST/GET | Manage data consent (DPA Sec 22) | JWT |
| `/admin/audit-logs` | GET | View audit trail (DPO only) | JWT + DPO role |
| `/admin/compliance/dpia` | GET | DPIA dashboard (DPO/Admin) | JWT |
| `/health` | GET | Service health check | None |

---

## Example: First User Signup

```bash
# 1. Sign up as Citizen
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "citizen",
    "consent": true
  }'

# 2. Login (requires MFA if enabled)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'

# 3. Enter MFA code if required
TOKEN=$(curl -X POST http://localhost:3001/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","mfaCode":"123456"}' | jq -r '.accessToken')

# 4. Access protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/my-cases

# 5. Download your data (exercises DPA Sec 30 right)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/export-my-data?format=json
```

---

## Success Criteria

✅ All services healthy: `docker-compose ps` → all UP  
✅ Frontend loads: http://localhost:3000/en  
✅ Backend responds: `curl http://localhost:3001/health`  
✅ AI service ready: `curl http://localhost:3002/health`  
✅ Database schema created: audit_log, users, etc.  
✅ JWT authentication working: Login → receive token  
✅ RBAC enforced: Citizens can't access admin endpoints  
✅ Audit trail immutable: Hash chain intact  
✅ DPA consent tracked: consent records created on signup  

**🚀 Phase 1 MVP ready for testing!**
