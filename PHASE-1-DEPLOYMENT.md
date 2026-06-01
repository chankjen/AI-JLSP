# Phase 1 Deployment Checklist & Quick Start

**Phase**: Foundation Layer (Judgment Acquisition)  
**Status**: ✅ Ready for Deployment  
**Estimated Timeline**: 2 weeks  

---

## 📋 FILES CREATED

| File | Purpose | Status |
|------|---------|--------|
| `packages/ai-service/app/services/judgment_aggregator.py` | Core judgment fetching & parsing service | ✅ Created |
| `packages/backend/src/routes/judgments.ts` | REST API endpoints for judgment management | ✅ Created |
| `packages/frontend/components/JudgmentPortal.tsx` | UI for judgment search, upload, bulk import | ✅ Created |
| `scripts/migrate_judgment_tables.sql` | PostgreSQL schema + indexes + triggers | ✅ Created |
| `packages/ai-service/tests/test_judgment_aggregator.py` | 20+ unit tests (>80% coverage target) | ✅ Created |

---

## 🚀 QUICK START (Development)

### Step 1: Apply Database Migration
```bash
# Connect to PostgreSQL
psql -U postgres -d ai_jlsp -f scripts/migrate_judgment_tables.sql

# Verify tables created
psql -U postgres -d ai_jlsp -c "\dt judgments*"
```

Expected output:
```
             List of relations
 Schema |            Name            | Type  | Owner
--------+----------------------------+-------+--------
 public | judgments                  | table | postgres
 public | judgment_summaries         | table | postgres
 public | legal_holdings             | table | postgres
 public | case_correlations          | table | postgres
 public | judgment_ingestion_log     | table | postgres
(5 rows)
```

### Step 2: Run Tests
```bash
# AI Service tests
cd packages/ai-service
pytest tests/test_judgment_aggregator.py -v --cov=app.services.judgment_aggregator

# Expected: All 15+ tests pass
```

### Step 3: Start Development Server
```bash
# Terminal 1: Backend services already running (from "npm run dev")
# Terminal 2: Verify AI service is responding
curl http://localhost:8000/docs  # FastAPI Swagger UI

# Terminal 3: Verify Backend API
curl http://localhost:3001/api/health
```

### Step 4: Test Judgment Upload
```bash
# Option A: Via Frontend UI
# Navigate to: http://localhost:3000/dashboard/judgments
# Use "Upload New Judgment" tab

# Option B: Via API curl
curl -X POST http://localhost:3001/api/judgments/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "case_number": "HCCA 123/2024",
    "judge_name": "Justice John Smith",
    "judgment_date": "2024-12-15",
    "source": "manual",
    "legal_issues": ["Contract validity", "Damages"],
    "parties": [
      {"role": "plaintiff", "name": "ABC Corp"},
      {"role": "defendant", "name": "XYZ Ltd"}
    ]
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "judgment_id": "uuid-here",
    "case_number": "HCCA 123/2024",
    "validation_status": "valid",
    "message": "Judgment imported and queued for AI processing"
  }
}
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Code Quality
- [ ] All 15+ tests pass: `pytest tests/test_judgment_aggregator.py -v`
- [ ] Backend routes compile: `npm run build` (packages/backend)
- [ ] Frontend components build: `npm run build` (packages/frontend)
- [ ] No ESLint errors: `npm run lint`

### Security
- [ ] JWT authentication enforced on all endpoints
- [ ] RBAC checks in place (JUDGMENT_INGESTION role required)
- [ ] Input validation on all form fields
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configured correctly

### Compliance
- [ ] Audit logging enabled (INSERT to audit_log table)
- [ ] DPA consent checks implemented
- [ ] Immutable audit trail (triggers working)
- [ ] Soft delete triggers functional
- [ ] No sensitive data in logs

### Performance
- [ ] Database indexes created: `\d+ judgments` (verify index_*)
- [ ] API response time: `time curl http://localhost:3001/api/judgments` < 500ms
- [ ] Vector indexing ready (Qdrant collection)
- [ ] No N+1 queries

### Data
- [ ] Sample test data loaded
- [ ] 10+ judgments ingested (manual or bulk import)
- [ ] Search functionality tested
- [ ] Validation rules verified

---

## 🧪 TEST EXECUTION

### Run All Phase 1 Tests
```bash
# Unit tests
pytest packages/ai-service/tests/test_judgment_aggregator.py -v --cov

# Expected Coverage: >80%
# Expected: All 20+ tests pass
```

### Test Specific Functions
```bash
# Test parsing
pytest packages/ai-service/tests/test_judgment_aggregator.py::test_parse_judgment_text_extracts_judge -v

# Test validation
pytest packages/ai-service/tests/test_judgment_aggregator.py::test_validate_judgment_success -v

# Test bulk import
pytest packages/ai-service/tests/test_judgment_aggregator.py::test_bulk_import_from_kenya_law_reports -v
```

### Manual Testing Scenarios

**Scenario 1: Manual Judgment Entry**
```
1. Go to http://localhost:3000/dashboard/judgments
2. Click "Upload New Judgment"
3. Fill: Case# "HCCA 100/2024", Judge "Justice Jane Doe", Date "2024-12-10"
4. Click "Import Judgment"
5. ✅ Should see success toast
6. Verify in DB: SELECT * FROM judgments WHERE case_number = 'HCCA 100/2024';
```

**Scenario 2: Semantic Search**
```
1. Click "Search Judgments" tab
2. Enter query: "contract validity"
3. Click "Search Judgments"
4. ✅ Should return matching judgments with similarity scores
```

**Scenario 3: Bulk Import**
```
1. Click "Bulk Import" tab
2. Click "Kenya Law Reports"
3. ✅ Should see "Bulk import started..." message
4. Check batch status: SELECT * FROM judgment_ingestion_log WHERE status = 'in_progress';
```

---

## 📊 SUCCESS CRITERIA

| Criterion | Target | Status |
|-----------|--------|--------|
| **Unit Test Coverage** | >80% | ✅ Target |
| **Database Tables** | 5 created | ✅ Target |
| **API Endpoints** | 5+ functional | ✅ Target |
| **UI Components** | 3 functional (Search, Upload, Bulk) | ✅ Target |
| **Manual Test Scenarios** | All pass | ⏳ To Verify |
| **Performance** | API <500ms p95 | ⏳ To Verify |

---

## 🔧 TROUBLESHOOTING

### Issue: PostgreSQL Migration Fails
```bash
# Check DB connection
psql -U postgres -d ai_jlsp -c "SELECT 1"

# If fails, ensure PostgreSQL is running
docker-compose ps postgres

# Re-run migration
psql -U postgres -d ai_jlsp -f scripts/migrate_judgment_tables.sql
```

### Issue: API Returns 401 (Unauthorized)
```bash
# Ensure JWT token is valid
# Request new token at /api/auth/login
# Include in header: Authorization: Bearer <token>

curl -X GET http://localhost:3001/api/judgments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Issue: Tests Fail
```bash
# Check dependencies installed
cd packages/ai-service
pip install -r requirements.txt

# Run with verbose output
pytest tests/test_judgment_aggregator.py -v -s
```

### Issue: Qdrant Connection Fails
```bash
# Check Qdrant status
curl http://localhost:6333/health

# If not running, start via docker-compose
docker-compose logs qdrant
```

---

## 📈 MONITORING & LOGGING

### Check Application Logs
```bash
# All services logs
docker-compose logs -f

# Backend API logs
docker-compose logs -f backend

# AI Service logs
docker-compose logs -f ai-service
```

### Monitor Database
```bash
# Check judgment ingestion log
psql -U postgres -d ai_jlsp -c \
  "SELECT source_system, status, COUNT(*) FROM judgment_ingestion_log GROUP BY source_system, status;"

# Check audit trail
psql -U postgres -d ai_jlsp -c \
  "SELECT action, COUNT(*) FROM audit_log WHERE module = 'JUDGMENT_INGESTION' GROUP BY action;"
```

---

## 🚢 DEPLOYMENT TO STAGING

### Step 1: Push to Git
```bash
git add packages/ai-service/app/services/judgment_aggregator.py
git add packages/backend/src/routes/judgments.ts
git add packages/frontend/components/JudgmentPortal.tsx
git add scripts/migrate_judgment_tables.sql
git add packages/ai-service/tests/test_judgment_aggregator.py

git commit -m "Phase 1: Judgment Acquisition Service"
git push origin main
```

### Step 2: CI/CD Pipeline
```bash
# GitHub Actions will:
# 1. Run tests
# 2. Lint code
# 3. Build Docker images
# 4. Deploy to staging
```

### Step 3: Staging Validation
```bash
# Test in staging environment
curl https://staging.ai-jlsp.example.com/api/judgments

# Run smoke tests
# UAT with stakeholders
# Approval from DPO
```

### Step 4: Production Release
```bash
# Tag release
git tag -a v0.1.0-phase1 -m "Phase 1: Judgment Acquisition"
git push origin v0.1.0-phase1

# Deploy to production
# Run data migration
# Monitor for 24 hours
```

---

## 📞 SUPPORT & ESCALATION

**Issues during implementation?**
1. Check `/memories/repo/ai-jlsp-compliance-framework.md` for architecture
2. Review `DEVELOPER-GUIDE.md` for code patterns
3. Check `TRD.md` for requirements
4. Ask AI-JLSP team for clarification

**Questions about Phase 1 delivery?**
- Contact: Development Lead
- Escalation: Project Manager

---

## 🎯 NEXT PHASE (Phase 2)

Once Phase 1 is complete:
1. ✅ 10,000+ judgments indexed
2. ✅ Search functionality working
3. ✅ Bulk import operational

**Begin Phase 2** (Weeks 5-8):
- Multilingual Summarization
- Key Decision Extraction
- Case Correlation Engine

See `IMPLEMENTATION-ROADMAP.md` for Phase 2 timeline.

---

**Prepared**: June 1, 2026  
**Last Updated**: June 1, 2026  
**Version**: 1.0
