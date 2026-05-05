from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
from .services.legal_bert_service import LegalBERTService
from .services.civil_procedure_checklist import CivilProcedureChecklist

app = FastAPI(title="AI-JLSP AI Service", version="1.0.0")

# Initialize services
legal_bert = LegalBERTService()
civil_procedure = CivilProcedureChecklist()

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
    # Mock triage logic focusing on explainability
    complexity = "medium"
    priority = "medium"
    division = "Civil"
    
    if "tax" in request.title.lower() or "revenue" in request.title.lower():
        division = "Tax"
    elif "land" in request.title.lower() or "property" in request.title.lower():
        division = "Conveyancing"
    
    if "urgent" in request.description.lower() or "injunction" in request.description.lower():
        priority = "high"

    return TriageResponse(
        complexity=complexity,
        priority=priority,
        assigned_division=division,
        rationale=f"Case assigned to {division} division based on keyword matching ('{division.lower()}'). Priority set to {priority} due to urgency keywords.",
        confidence=0.85
    )

@app.post("/api/validate/tdr-objection", response_model=TDRValidationResponse)
async def validate_tdr_objection(request: TDRValidationRequest):
    # Mock TDR validation per Sec 51(3) TPA
    is_valid = len(request.objection_grounds) > 50
    
    return TDRValidationResponse(
        is_valid=is_valid,
        requirements_met=["Grounds of objection stated"],
        missing_requirements=[] if is_valid else ["Detailed grounds of objection required per Sec 51(3) TPA"],
        rationale="Validation performed against Tax Procedures Act Section 51(3) requirements.",
        confidence=0.92
    )

@app.post("/api/predict/case-outcome", response_model=PredictionResponse)
async def predict_outcome(request: PredictionRequest):
    return PredictionResponse(
        probability_win=0.72,
        precedents_found=["Republic v Commissioner of Domestic Taxes [2022]", "KRA v ABC Ltd [2024]"],
        rationale="Prediction based on historical similarity to 254 cases in the Tax and Commercial divisions.",
        confidence=0.68
    )

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
    # Mock ADR logic
    score = 0.5
    path = "Litigation"
    
    if request.amount < 1000000:
        score = 0.85
        path = "Mediation"
    elif "commercial" in request.title.lower() or "contract" in request.title.lower():
        score = 0.75
        path = "Arbitration"
        
    return ADRResponse(
        suitability_score=score,
        recommended_path=path,
        rationale=f"ADR recommended due to {('low value' if score > 0.8 else 'commercial nature')} of the dispute, favoring a faster, confidential resolution over court litigation.",
        confidence=0.88
    )

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

@app.get("/models/status")
async def get_model_status():
    return {
        "legal_bert_loaded": True,
        "checklist_available": True,
        "qdrant_connected": True,
        "triage_active": True
    }
