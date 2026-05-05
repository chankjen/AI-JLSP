# AI Document Pre-Validation Endpoint - Implementation Prompt

## VIBE-CODING PROMPT FOR GITHUB COPILOT

Copy and paste this entire prompt into GitHub Copilot Chat (or use as system instruction for Claude/GPT):

---

## 🎯 SYSTEM CONTEXT

You are a Senior AI/ML Legal Engineer building the **AI Document Pre-Validation Engine** for the AI-JLSP platform. This is a Critical Compliance Component embedded in Phase 1 MVP:

- **Compliance**: Constitution Art 47 (Fair Admin Action), DPA Sec 22 (Consent), DPA Sec 31 (Audit Trail), TPA Sec 51(3)
- **Tech Stack**: FastAPI, LangChain/LlamaIndex, sentence-transformers (Legal-BERT-KE), Qdrant vector DB, Redis
- **Data**: Kenya's Civil Procedure Rules, TPA objection requirements, DPA Sec 22 checklist
- **Output**: JSON response with AI confidence scoring, human-in-the-loop gate, immutable audit entry

---

## 📋 REQUIREMENTS: MVP VALIDATION ENDPOINT

**Goal**: Validate user-submitted legal documents against compliance checklists BEFORE filing/approval.

**Scope**:
1. **Intake**: PDF/Word document + metadata (document_type, filing_party, case_id)
2. **RAG Pipeline**: Query Legal-BERT-KE embeddings + Qdrant vectors for relevant rules/precedents
3. **Validation Checklist**: Map document against rule set (e.g., TPA Sec 51(3) requirements)
4. **Risk Scoring**: Return `validation_score` (0-1) + per-field confidence scores
5. **Human Override**: Flag high-risk/low-confidence items for human lawyer review
6. **Audit Trail**: Create immutable audit_log entry (SHA-256 hash chain)
7. **Consent Verification**: Verify user has given consent (DPA Sec 22) before AI processing

---

## 🔨 DETAILED SPEC

### 1. Endpoint Definition

```python
# POST /api/ai/validate-document
# Request Body:
{
  "document_id": "uuid",                    # Internal doc ID
  "document_type": "tax_objection|litigation_filing|conveyancing_contract",
  "document_text": "base64_encoded_pdf_or_txt",
  "filing_party": "advocate|citizen|tdr_officer",
  "case_id": "optional_case_uuid",
  "consent_token": "jwt_token_proving_consent"  # DPA Sec 22
}

# Response (200 OK):
{
  "validation_id": "uuid",
  "status": "approved|requires_review|rejected",
  "overall_confidence": 0.87,               # Legal-BERT confidence
  "validation_timestamp": "2026-05-04T...",
  
  # Per-field validation results
  "validation_results": [
    {
      "rule_id": "tpa_51_3_objection_grounds",
      "rule_name": "Objection must cite specific TPA section",
      "found": true,
      "confidence": 0.95,
      "evidence": "Document states 'Objection under TPA Sec 51(3)(a) - excessive assessment'",
      "recommendation": "PASS"
    },
    {
      "rule_id": "doc_formatting_margins",
      "rule_name": "Document must have 1-inch margins",
      "found": true,
      "confidence": 0.62,                   # ⚠️ Low confidence → flag for review
      "evidence": "OCR detected margins ~0.9-1.1 inches",
      "recommendation": "MANUAL_REVIEW"
    }
  ],
  
  # Risk assessment
  "risk_level": "low|medium|high|critical",
  "risk_factors": [
    "Low confidence on formatting",
    "Missing plaintiff signature block"
  ],
  
  # Human-in-the-loop gate (Art 47: mandatory if risk>medium or confidence<0.75)
  "requires_human_review": true,
  "recommended_reviewer_role": "litigation_counsel|dpo",
  "review_deadline_hours": 24,
  
  # Audit & provenance
  "audit_log_id": "uuid",
  "ai_model_version": "legal-bert-ke-v2.1",
  "processing_time_ms": 1240,
  
  # Consent tracking (DPA Sec 22)
  "consent_verified": true,
  "consent_timestamp": "2026-05-04T...",
  "consent_expiry": "2027-05-04T..."
}

# Response (403 Forbidden - No Consent):
{
  "error": "DPA_CONSENT_REQUIRED",
  "message": "Consent token invalid or expired",
  "consent_request_url": "/api/consent/request?type=ai_analysis&redirect_to=/validate-document"
}

# Response (400 Bad Request - Invalid Document):
{
  "error": "INVALID_DOCUMENT",
  "message": "Document could not be parsed. Please ensure PDF/Word format and <50MB size."
}
```

---

### 2. RAG Pipeline Architecture

**Key Principle**: Documents are validated against a **Knowledge Graph** built from:
- Civil Procedure Rules (CPR)
- TPA Sec 51 objection requirements (TPA Sec 51(3))
- DPA Sec 22 consent checklist  
- Work Procedure Manual sections (2.1.8.x, 6.1.8–6.1.9)
- Case law precedents from eKLR

**Vector DB (Qdrant)**: Pre-indexed Legal-BERT-KE embeddings of:
- Rule snippets (384-dim embeddings)
- Example documents (compliant vs non-compliant)
- Case summaries

**Retrieval Flow**:
1. Extract text from document → tokenize
2. Embed document using Legal-BERT-KE (sentence-transformers library)
3. Query Qdrant for semantically similar rules/examples
4. Re-rank results by relevance (BM25)
5. LangChain prompt chain: (context) + (extracted text) → validation checklist

---

### 3. Validation Rules Engine

**Rule Set** (store in PostgreSQL `validation_rules` table):

```json
{
  "rule_id": "tpa_51_3_objection_grounds",
  "rule_type": "mandatory_field",
  "document_types": ["tax_objection"],
  "rule_text": "Objection must cite specific TPA section & grounds",
  "validation_prompt": "Does document cite a specific TPA section (e.g., Sec 51(3)(a), Sec 6)? Extract: [CITATION]",
  "confidence_threshold": 0.80,
  "severity": "critical",
  "source": "TPA_SEC_51_3",
  "examples_compliant": [
    "Objection under TPA Sec 51(3)(a) - assessment excessive by KES 500,000",
    "Grounds: TPA Sec 6(1) - incorrect classification of income"
  ],
  "examples_noncompliant": [
    "We disagree with the assessment",
    "The assessment is wrong"
  ]
}
```

**Built-in Rule Categories**:
1. **Tax Disputes (TPA)**:
   - tpa_51_3_objection_grounds → Cite specific TPA section
   - tpa_51_grounds_jurisdiction → Valid objection within KRA authority
   - tpa_timeline_30days → Objection within 30 days of decision
   - tpa_supporting_documents → Invoices, receipts, emails attached

2. **Litigation (CPR)**:
   - cpr_case_caption_format → Case name + court + year
   - cpr_statement_of_facts → Clear factual narrative
   - cpr_prayer_relief → Specific reliefs requested
   - cpr_signature_counsel → Advocate signature + stamp
   - cpr_pleading_page_numbers → Pages consecutively numbered
   - cpr_annexures_referenced → All exhibits referenced in text

3. **DPA Compliance (Sec 22)**:
   - dpa_consent_explicit → Clear consent checkboxes
   - dpa_data_minimization → Only necessary fields requested
   - dpa_privacy_notice → Data protection terms displayed
   - dpa_retention_policy → Data retention period stated

4. **Conveyancing (Work Manual 6.1.8–6.1.9)**:
   - land_title_number_valid → LR number in correct format
   - land_survey_map_attached → Survey plan + OP number
   - stamp_duty_calculated → Stamp duty amount shown
   - contract_parties_qualified → All parties identified

---

### 4. LangChain Chain Implementation

```python
# Pseudocode (implement in Python/LangChain)

class DocumentValidationChain:
    def __init__(self):
        self.legal_bert = SentenceTransformer("sentence-transformers/legal-bert-ke")
        self.qdrant = QdrantClient("http://qdrant:6333")
        self.llm = OpenAI(model="gpt-4")  # or local Ollama
        self.redis = redis.Redis(host="redis")
        
    async def validate_document(self, document_request):
        # 1. Verify consent (DPA Sec 22)
        if not await self.verify_consent(document_request.consent_token):
            raise DPAConsentError("Consent token invalid or expired")
        
        # 2. Parse & extract text from document
        document_text = await self.extract_text_from_pdf(
            document_request.document_text,
            document_request.document_type
        )
        
        # 3. Embed document using Legal-BERT-KE
        doc_embedding = self.legal_bert.encode(document_text)
        
        # 4. Retrieve relevant rules from Qdrant (semantic search)
        relevant_rules = await self.qdrant.search(
            collection_name="validation_rules",
            query_vector=doc_embedding,
            limit=10,
            score_threshold=0.70
        )
        
        # 5. Load document-type-specific checklist
        rules = await self.load_rules_for_type(document_request.document_type)
        
        # 6. For each rule, call LangChain validation chain
        validation_results = []
        for rule in rules:
            result = await self.validate_rule_chain(
                rule=rule,
                document_text=document_text,
                relevant_context=relevant_rules
            )
            validation_results.append(result)
        
        # 7. Aggregate confidence scores
        overall_confidence = np.mean([r.confidence for r in validation_results])
        
        # 8. Determine risk level & human review requirement (Art 47)
        risk_assessment = self.assess_risk(validation_results, overall_confidence)
        
        # 9. Create immutable audit log entry (SHA-256 hash chain)
        audit_entry = await self.create_audit_entry(
            user_id=document_request.user_id,
            document_id=document_request.document_id,
            validation_results=validation_results,
            confidence=overall_confidence
        )
        
        # 10. Cache result in Redis (TTL: 365 days)
        await self.cache_validation_result(
            document_request.document_id,
            risk_assessment,
            ttl=31536000
        )
        
        return ValidationResponse(
            validation_id=audit_entry.id,
            status=risk_assessment.status,
            overall_confidence=overall_confidence,
            validation_results=validation_results,
            requires_human_review=risk_assessment.requires_review,
            audit_log_id=audit_entry.id
        )
    
    async def validate_rule_chain(self, rule, document_text, relevant_context):
        """
        LangChain chain: Given rule + document + context, determine if rule satisfied
        with confidence score.
        """
        prompt = PromptTemplate(
            input_variables=["rule_text", "document_text", "examples"],
            template="""
            You are a Kenyan legal compliance expert validating a document.
            
            RULE: {rule_text}
            SEVERITY: {severity}
            
            DOCUMENT EXCERPT:
            {document_text}
            
            RELEVANT CASE LAW & EXAMPLES:
            {examples}
            
            TASK: Determine if this document satisfies the rule.
            OUTPUT JSON:
            {{
              "found": bool,
              "confidence": float (0-1),
              "evidence": "quotes from document supporting decision",
              "explanation": "brief legal reasoning"
            }}
            
            RESPOND ONLY WITH VALID JSON.
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        result = await chain.invoke({
            "rule_text": rule.rule_text,
            "severity": rule.severity,
            "document_text": document_text[:2000],  # Truncate for token efficiency
            "examples": "\n".join([e for e in rule.examples_compliant[:3]])
        })
        
        return RuleValidationResult(
            rule_id=rule.rule_id,
            rule_name=rule.rule_text,
            found=result["found"],
            confidence=result["confidence"],
            evidence=result["evidence"],
            recommendation="PASS" if result["confidence"] > 0.80 else "MANUAL_REVIEW"
        )

    async def assess_risk(self, validation_results, overall_confidence):
        """
        Constitution Art 47: Human-in-the-loop mandatory for:
        - Risk level: high/critical
        - Overall confidence: <0.75  
        - Any "CRITICAL" severity rule marked FAIL
        """
        critical_failures = [
            r for r in validation_results 
            if r.severity == "critical" and r.recommendation == "MANUAL_REVIEW"
        ]
        
        risk_level = "low"
        if overall_confidence < 0.60 or critical_failures:
            risk_level = "critical"
        elif overall_confidence < 0.75 or any(r.confidence < 0.70 for r in validation_results):
            risk_level = "high"
        elif any(r.confidence < 0.80 for r in validation_results):
            risk_level = "medium"
        
        requires_human_review = (
            risk_level in ["high", "critical"] or 
            overall_confidence < 0.75  or 
            len(critical_failures) > 0
        )
        
        return RiskAssessment(
            risk_level=risk_level,
            requires_human_review=requires_human_review,
            recommended_reviewer_role="litigation_counsel" if risk_level == "high" else "dpo" if risk_level == "critical" else None,
            status="approved" if risk_level == "low" else "requires_review" if risk_level in ["medium", "high"] else "rejected"
        )
    
    async def create_audit_entry(self, user_id, document_id, validation_results, confidence):
        """
        DPA Sec 31: Immutable audit entry with SHA-256 hash chain
        """
        prev_log = await postgres.query(
            "SELECT hash_value FROM audit_log ORDER BY timestamp DESC LIMIT 1"
        )
        prev_hash = prev_log[0].hash_value if prev_log else "0" * 64
        
        current_data = json.dumps({
            "user_id": str(user_id),
            "document_id": str(document_id),
            "confidence": confidence,
            "validation_results": [r.to_dict() for r in validation_results],
            "timestamp": datetime.utcnow().isoformat()
        })
        
        hash_value = hashlib.sha256(
            f"{prev_hash}{current_data}".encode()
        ).hexdigest()
        
        audit_entry = await postgres.execute(
            """
            INSERT INTO audit_log 
            (user_id, action_type, module_id, resource_type, resource_id, 
             status, details, hash_value, previous_hash_value, data_residency)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, hash_value
            """,
            [
                user_id, "ai_validation", "ai_validation", 
                "document", document_id, "success", 
                current_data, hash_value, prev_hash, "KE"
            ]
        )
        
        return audit_entry

    async def verify_consent(self, consent_token):
        """
        DPA Sec 22: Verify user has given explicit consent for AI processing
        """
        # Decode JWT token
        try:
            payload = jwt.decode(consent_token, CONSENT_SECRET, algorithms=["HS256"])
        except:
            return False
        
        # Check DPA consent record
        consent_record = await postgres.query(
            """
            SELECT * FROM dpa_consent_records 
            WHERE user_id = $1 
            AND consent_type = 'ai_analysis'
            AND consent_given = true
            AND withdrawn_at IS NULL
            AND (consent_expiry IS NULL OR consent_expiry > NOW())
            """,
            [payload["sub"]]
        )
        
        return len(consent_record) > 0
```

---

### 5. Data Preparation: Pre-Load Validation Rules into Qdrant

**Initial Setup Script** (Run on first deployment):

```python
# scripts/seed_validation_rules.py

import json
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

def seed_validation_rules():
    client = QdrantClient("http://qdrant:6333")
    model = SentenceTransformer("sentence-transformers/legal-bert-ke")
    
    # 1. Load rules from database
    rules = [
        {
            "rule_id": "tpa_51_3_objection_grounds",
            "rule_text": "Objection must cite specific TPA section (e.g., Sec 51(3)(a) or Sec 6). Assessment exceeding stated grounds invalid.",
            "document_type": "tax_objection",
            "source": "TPA_SEC_51_3"
        },
        # ... (20+ rules across TPA, CPR, DPA, Conveyancing)
    ]
    
    # 2. Embed each rule using Legal-BERT-KE
    embeddings = model.encode([r["rule_text"] for r in rules])
    
    # 3. Create/recreate Qdrant collection
    client.recreate_collection(
        collection_name="validation_rules",
        vectors_config={"size": 384, "distance": "Cosine"}
    )
    
    # 4. Upload to Qdrant with metadata
    points = [
        Point(
            id=i,
            vector=embeddings[i].tolist(),
            payload={
                "rule_id": r["rule_id"],
                "rule_text": r["rule_text"],
                "document_type": r["document_type"],
                "source": r["source"]
            }
        )
        for i, r in enumerate(rules)
    ]
    
    client.upsert(collection_name="validation_rules", points=points)
    print(f"✓ Seeded {len(rules)} validation rules into Qdrant")

# Similarly, pre-load example compliant/non-compliant documents:
def seed_document_examples():
    compliant_docs = [
        "Objection under TPA Sec 51(3)(a) - assessment exceeded statutory maximum",
        "Statement of facts: Taxpayer incurred KES 2M in vehicle expenses..." 
    ]
    non_compliant_docs = [
        "We disagree with the assessment",
        "The KRA is unfair"
    ]
    
    # Embed and upload...
```

---

### 6. Error Handling & Retry Logic

```python
# Resilience patterns
class DocumentValidationError(Exception):
    pass

class DPAConsentError(DocumentValidationError):
    pass  # Must be hanlded → redirect to consent flow

class HighConfidenceThresholdError(DocumentValidationError):
    pass  # Risk level critical → require human escalation

# Retry decorator (for Qdrant/LLM timeouts)
@retry(max_attempts=3, backoff_ms=500)
async def validate_rule_chain_with_retry(...):
    pass
```

---

### 7. Testing Scenarios

```python
# test_ai_validation.py

async def test_tax_objection_valid():
    """Test valid TPA Sec 51(3) objection → APPROVED"""
    response = await client.post("/api/ai/validate-document", json={
        "document_type": "tax_objection",
        "document_text": base64_encode(VALID_TPA_OBJECTION),
        "consent_token": VALID_CONSENT_JWT
    })
    assert response.status_code == 200
    assert response.json()["overall_confidence"] >= 0.80
    assert response.json()["status"] == "approved"

async def test_low_confidence_requires_review():
    """Test ambiguous document → REQUIRES_REVIEW + human gate"""
    response = await client.post("/api/ai/validate-document", json={
        "document_type": "tax_objection",
        "document_text": base64_encode(AMBIGUOUS_OBJECTION),
        "consent_token": VALID_CONSENT_JWT
    })
    assert response.json()["requires_human_review"] == True
    assert response.json()["overall_confidence"] < 0.75

async def test_no_consent_denied():
    """Test no consent → 403 Forbidden"""
    response = await client.post("/api/ai/validate-document", json={
        "document_type": "tax_objection",
        "document_text": base64_encode(VALID_OBJECTION),
        "consent_token": INVALID_CONSENT_JWT
    })
    assert response.status_code == 403
    assert "DPA_CONSENT_REQUIRED" in response.json()["error"]

async def test_audit_trail_immutable():
    """Test audit entry created + hash chain valid"""
    response = await client.post("/api/ai/validate-document", json=...)
    audit_id = response.json()["audit_log_id"]
    
    audit_entry = await postgres.query(
        "SELECT hash_value, previous_hash_value FROM audit_log WHERE id = $1",
        [audit_id]
    )
    
    # Verify hash integrity
    verify_hash_chain(audit_entry)  # Should not raise
```

---

## 🚀 IMPLEMENTATION CHECKLIST

- [ ] Create FastAPI endpoint `/api/ai/validate-document` (async)
- [ ] Integrate Legal-BERT-KE via sentence-transformers
- [ ] Setup Qdrant collection + seed validation rules (20+ rules)
- [ ] Implement LangChain validation chain (rule → LLM → confidence score)
- [ ] Add DPA Sec 22 consent verification (JWT token)
- [ ] Create immutable audit log entry (SHA-256 hash chain)
- [ ] Implement risk assessment (Constitution Art 47: human-in-the-loop gate)
- [ ] Add Redis caching (validation results, ~365d TTL)
- [ ] Error handling + DPA consent flow redirect
- [ ] Unit tests (valid doc, low confidence, no consent, audit trail)
- [ ] Integration test (end-to-end with real PDFs)
- [ ] Load testing (concurrent validations, confidence scoring latency <2s)
- [ ] Documentation (API spec, Legal-BERT-KE model card, rule definitions)

---

## 🔐 COMPLIANCE GATES

✅ **Constitution Art 47** (Fair Admin Action):  
- All AI recommendations marked with confidence score  
- Human override mandatory if confidence <0.75  
- Audit trail captures human reviewer ID + reasoning  

✅ **DPA Sec 22** (Explicit Consent for AI Processing):  
- Validation requires valid consent token  
- Consent_verified flag in API response  
- Redirect to consent flow if invalid  

✅ **DPA Sec 31** (Immutable Audit Trail):  
- SHA-256 hash chain prevents tampering  
- Audit entries immutable (no update/delete)  
- 7-year retention enforced  

✅ **TPA Sec 51(3)** (Objection Compliance):  
- Validates citation of specific TPA section  
- Checks supporting documents attached  
- Deadline (30 days) calculation included  

---

## 📞 QUESTIONS FOR HUMAN REVIEW

If unclear during implementation:
1. **Legal**: Which eKLR precedents should be prioritized in rule retrieval?
2. **UX**: Should document type auto-detected or user-selected?
3. **Performance**: Acceptable latency for confidence scoring? (Target: <2s)
4. **Compliance**: Should validation results be permanently stored or only audit entries?

---

**This prompt is ready for immediate coding! Paste into Copilot Chat and iterate.**
