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

@app.get("/models/status")
async def get_model_status():
    return {
        "legal_bert_loaded": True,
        "checklist_available": True,
        "qdrant_connected": True
    }
