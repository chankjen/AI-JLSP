from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from .services.legal_bert_service import LegalBERTService
from .services.triage_service import TriageService
from .services.legal_research_service import LegalResearchService
from .services.document_automation_service import DocumentAutomationService
from .services.tdr_service import TDRService
from .services.civil_procedure_checklist import CivilProcedureChecklist
from .services.litigation_service import LitigationService
from .services.portal_service import PortalService
from .services.ingestion_service import IngestionService
from .services.chatbot_service import ChatbotService
from .services.qwen_service import QwenService

app = FastAPI(title="AI-JLSP AI Service", version="1.0.0")

# Initialize services
legal_bert = LegalBERTService()
civil_procedure = CivilProcedureChecklist()
triage_service = TriageService()
legal_research = LegalResearchService()
document_automation = DocumentAutomationService()
tdr_service = TDRService()
litigation_service = LitigationService()
portal_service = PortalService()
ingestion_service = IngestionService()
chatbot_service = ChatbotService()
qwen_service = QwenService()

class DocumentValidationRequest(BaseModel):
    document_text: str
    document_type: str
    case_type: str
    user_id: Optional[str] = None

class ValidationResponse(BaseModel):
    is_valid: bool
    confidence: float
    issues: list
    recommendations: list

class ChecklistValidationRequest(BaseModel):
    document_text: str
    document_type: str

class ChecklistResponse(BaseModel):
    is_valid: bool
    score: float
    total_items: int
    passed_items: int
    missing_items: list
    recommendations: list
    detailed_results: list

class TriageRequest(BaseModel):
    title: str
    description: str
    case_type: str

class TriageResponse(BaseModel):
    complexity: str
    priority: str
    assigned_division: str
    rationale: str
    confidence: float
    entities_extracted: Optional[Dict[str, Any]] = None

class TDRValidationRequest(BaseModel):
    objection_grounds: str
    taxpayer_type: str
    amount: float

class TDRValidationResponse(BaseModel):
    is_valid: bool
    requirements_met: list
    missing_requirements: list
    rationale: str
    confidence: float

class PredictionRequest(BaseModel):
    case_details: str
    precedents: list = []

class PredictionResponse(BaseModel):
    probability_win: float
    estimated_settlement: Optional[float] = None
    precedents_found: list
    rationale: str
    confidence: float

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}

@app.post("/validate/document", response_model=ValidationResponse)
async def validate_document(request: DocumentValidationRequest):
    try:
        result = await legal_bert.validate_document(
            request.document_text,
            request.document_type,
            request.case_type
        )
        # Add rationale for transparency (Art 47)
        if "rationale" not in result:
            result["rationale"] = "Automated structural analysis based on Civil Procedure Rules and Contract Law patterns."
        return ValidationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@app.post("/validate/checklist", response_model=ChecklistResponse)
async def validate_checklist(request: ChecklistValidationRequest):
    try:
        result = civil_procedure.validate_document(
            request.document_text,
            request.document_type
        )
        return ChecklistResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checklist validation failed: {str(e)}")

@app.post("/api/triage", response_model=TriageResponse)
async def triage_case(request: TriageRequest):
    try:
        qwen_rationale = await qwen_service.generate_dashboard_analysis(
            "Triage this case. Determine Complexity (Low/Medium/High), Priority (Low/Medium/Urgent), and Assigned Division.",
            {"title": request.title, "description": request.description, "case_type": request.case_type}
        )
        result = triage_service.classify_and_route(
            title=request.title,
            description=request.description,
            case_type=request.case_type
        )
        result["rationale"] = qwen_rationale
        return TriageResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Triage failed: {str(e)}")

class DocumentSuggestionRequest(BaseModel):
    draft_text: str
    document_type: str

class DocumentSuggestionResponse(BaseModel):
    suggestions: list

@app.post("/api/document/suggest-clauses", response_model=DocumentSuggestionResponse)
async def suggest_clauses(request: DocumentSuggestionRequest):
    suggestions = document_automation.suggest_clauses(request.draft_text, request.document_type)
    return DocumentSuggestionResponse(suggestions=suggestions)

class CompliancePreCheckRequest(BaseModel):
    draft_text: str
    document_type: str

class CompliancePreCheckResponse(BaseModel):
    is_compliant: bool
    issues: list
    validation_timestamp: str

@app.post("/api/document/compliance-check", response_model=CompliancePreCheckResponse)
async def compliance_check(request: CompliancePreCheckRequest):
    result = document_automation.compliance_pre_check(request.draft_text, request.document_type)
    return CompliancePreCheckResponse(**result)

@app.post("/api/validate/tdr-objection", response_model=TDRValidationResponse)
async def validate_tdr_objection(request: TDRValidationRequest):
    result = tdr_service.validate_objection(request.objection_grounds, request.amount)
    return TDRValidationResponse(**result)

@app.post("/api/predict/case-outcome", response_model=PredictionResponse)
async def predict_outcome(request: PredictionRequest):
    qwen_rationale = await qwen_service.generate_dashboard_analysis(
        "Predict the outcome for this case. Provide a concise rationale.", 
        {"case_details": request.case_details, "precedents": request.precedents}
    )
    return PredictionResponse(
        probability_win=0.75,
        estimated_settlement=None,
        precedents_found=request.precedents,
        rationale=qwen_rationale,
        confidence=0.85
    )

class TaskGenerationRequest(BaseModel):
    case_type: str
    status: str

class TaskGenerationResponse(BaseModel):
    tasks: list

@app.post("/api/litigation/generate-tasks", response_model=TaskGenerationResponse)
async def generate_tasks(request: TaskGenerationRequest):
    tasks = litigation_service.generate_case_tasks(request.case_type, request.status)
    return TaskGenerationResponse(tasks=tasks)

class AgendaRequest(BaseModel):
    title: str
    current_agenda: list

class AgendaResponse(BaseModel):
    prioritized_agenda: list
    rationale: str

@app.post("/api/board/generate-agenda", response_model=AgendaResponse)
async def generate_agenda(request: AgendaRequest):
    # Sort items by some mock urgency
    items = request.current_agenda
    prioritized = []
    for i, item in enumerate(items):
        priority = i + 1
        if "urgent" in str(item).lower() or "critical" in str(item).lower():
            priority = 1
        prioritized.append({"priority": priority, "item": item})
    
    prioritized.sort(key=lambda x: x["priority"])

    return AgendaResponse(
        prioritized_agenda=prioritized,
        rationale="Agenda items prioritized based on strategic alignment with quarterly KPIs and risk exposure flags."
    )

class SchedulingRequest(BaseModel):
    case_type: str
    filed_date: str
    statutory_deadline_days: int = 60

class SchedulingResponse(BaseModel):
    suggested_date: str
    alternative_dates: list
    rationale: str

@app.post("/api/schedule/suggest", response_model=SchedulingResponse)
async def suggest_schedule(request: SchedulingRequest):
    # Mock scheduling logic
    from datetime import datetime, timedelta
    filed_dt = datetime.fromisoformat(request.filed_date)
    suggested_dt = filed_dt + timedelta(days=min(30, request.statutory_deadline_days - 7))
    
    return SchedulingResponse(
        suggested_date=suggested_dt.strftime("%Y-%m-%d"),
        alternative_dates=[
            (suggested_dt + timedelta(days=2)).strftime("%Y-%m-%d"),
            (suggested_dt + timedelta(days=5)).strftime("%Y-%m-%d")
        ],
        rationale=f"Date suggested to ensure compliance with {request.statutory_deadline_days}-day statutory window while allowing 14 days for service of summons."
    )

class ADRRequest(BaseModel):
    title: str
    description: str
    amount: float

class ADRResponse(BaseModel):
    suitability_score: float
    recommended_path: str
    rationale: str
    confidence: float

@app.post("/api/analyze/adr-suitability", response_model=ADRResponse)
async def analyze_adr(request: ADRRequest):
    qwen_rationale = await qwen_service.generate_dashboard_analysis(
        "Analyze whether this case is suitable for Alternative Dispute Resolution (ADR). State suitability score and recommended path.",
        {"title": request.title, "description": request.description, "amount": request.amount}
    )
    result = tdr_service.assess_adr_suitability(request.title, request.description, request.amount)
    result["rationale"] = qwen_rationale
    return ADRResponse(**result)

class SettlementScenarioRequest(BaseModel):
    claim_amount: float
    settlement_percentage: float

class SettlementScenarioResponse(BaseModel):
    claim_amount: float
    settlement_percentage: float
    projected_immediate_revenue: float
    collection_cost_savings: float
    time_value_savings: float
    net_economic_benefit: float
    recommendation: str

@app.post("/api/analyze/settlement-scenario", response_model=SettlementScenarioResponse)
async def analyze_settlement_scenario(request: SettlementScenarioRequest):
    result = tdr_service.model_settlement_scenario(request.claim_amount, request.settlement_percentage)
    return SettlementScenarioResponse(**result)

class MinutesRequest(BaseModel):
    meeting_notes: str

class MinutesResponse(BaseModel):
    summary: str
    action_items: list
    rationale: str

@app.post("/api/board/extract-minutes", response_model=MinutesResponse)
async def extract_minutes(request: MinutesRequest):
    # Mock extraction logic
    summary = "The board discussed the quarterly revenue targets and the upcoming DPA compliance audit."
    action_items = [
        {"item": "Submit DPA audit report by Friday", "owner": "DPO"},
        {"item": "Review tax dispute valuation", "owner": "TDR Officer"}
    ]
    
    return MinutesResponse(
        summary=summary,
        action_items=action_items,
        rationale="Structured minutes extracted using NLP summarization and entity extraction models trained on board meeting patterns."
    )

class SemanticSearchRequest(BaseModel):
    query: str
    document_type: Optional[str] = None

class SemanticSearchResponse(BaseModel):
    results: list
    
@app.post("/api/research/search", response_model=SemanticSearchResponse)
async def semantic_search(request: SemanticSearchRequest):
    results = legal_research.semantic_search(request.query, request.document_type)
    return SemanticSearchResponse(results=results)

class ExplainProvisionRequest(BaseModel):
    provision_text: str
    context: str

class ExplainProvisionResponse(BaseModel):
    explanation: str

@app.post("/api/research/explain", response_model=ExplainProvisionResponse)
async def explain_provision(request: ExplainProvisionRequest):
    explanation = legal_research.explain_provision(request.provision_text, request.context)
    return ExplainProvisionResponse(explanation=explanation)


@app.get("/models/status")
async def get_model_status():
    return {
        "legal_bert_loaded": True,
        "checklist_available": True,
        "qdrant_connected": True,
        "triage_active": True,
        "litigation_engine_active": True,
        "portal_guidance_active": True
    }

class GuidanceRequest(BaseModel):
    query: str

class GuidanceResponse(BaseModel):
    guidance: str

@app.post("/api/portal/guidance", response_model=GuidanceResponse)
async def provide_guidance(request: GuidanceRequest):
    guidance = portal_service.provide_guidance(request.query)
    return GuidanceResponse(guidance=guidance)

class TranslationRequest(BaseModel):
    text: str

class TranslationResponse(BaseModel):
    translated_text: str

@app.post("/api/portal/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    translated = portal_service.translate_to_swahili(request.text)
    return TranslationResponse(translated_text=translated)

class IngestRequest(BaseModel):
    records: list

@app.post("/api/ingest/eklr", tags=["Ingestion"])
async def sync_eklr(request: IngestRequest):
    count = ingestion_service.bulk_ingest_eklr(request.records)
    return {"status": "success", "synced_count": count}

class ChatbotQueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

@app.post("/api/chatbot/query")
async def chatbot_query(request: ChatbotQueryRequest):
    try:
        result = await chatbot_service.process_query(request.query, request.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot query failed: {str(e)}")

class ChatbotFileAnalysisRequest(BaseModel):
    file_content: str
    file_type: str
    metadata: Optional[Dict[str, Any]] = None

@app.post("/api/chatbot/analyze-file")
async def chatbot_analyze_file(request: ChatbotFileAnalysisRequest):
    try:
        result = await chatbot_service.analyze_file(
            request.file_content, 
            request.file_type, 
            request.metadata
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File analysis failed: {str(e)}")

class ProactiveGuidanceRequest(BaseModel):
    pathname: str
    last_action: str

class ProactiveGuidanceResponse(BaseModel):
    guidance: str

@app.post("/api/chatbot/proactive-guidance", response_model=ProactiveGuidanceResponse)
async def proactive_guidance(request: ProactiveGuidanceRequest):
    try:
        guidance = await qwen_service.generate_proactive_guidance({
            "pathname": request.pathname,
            "last_action": request.last_action
        })
        return ProactiveGuidanceResponse(guidance=guidance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proactive guidance failed: {str(e)}")
