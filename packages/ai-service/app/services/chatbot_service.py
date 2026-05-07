import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from .legal_research_service import LegalResearchService
from .litigation_service import LitigationService
from .document_automation_service import DocumentAutomationService
from .ocr_pipeline import OCRPipeline

logger = logging.getLogger(__name__)

class ChatbotService:
    """
    AI-JLSP Unified Chatbot Service.
    Addresses user queries on cases, legal advice, proceedings, and judgment profiling.
    Handles multi-modal analysis (docs, CSV, URLs, Audio, Video, etc.).
    """

    def __init__(self):
        self.legal_research = LegalResearchService()
        self.litigation = LitigationService()
        self.doc_automation = DocumentAutomationService()
        self.ocr = OCRPipeline()

    async def process_query(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process a text query and return a structured response.
        """
        # Simple intent classification
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["predict", "outcome", "win", "lose", "settle"]):
            return await self._handle_prediction_query(query, context)
        elif any(word in query_lower for word in ["summarize", "summary", "details"]):
            return await self._handle_summary_query(query, context)
        elif any(word in query_lower for word in ["research", "precedent", "case law", "judgement"]):
            return await self._handle_research_query(query, context)
        elif any(word in query_lower for word in ["compliance", "legal", "rules", "regulations"]):
            return await self._handle_compliance_query(query, context)
        elif any(word in query_lower for word in ["profile", "judgement", "judgment", "pattern"]):
            return await self._handle_judgement_profiling(query, context)
        else:
            # General legal advice/guidance
            return await self._handle_general_query(query, context)

    async def analyze_file(self, file_content: str, file_type: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze multi-modal files (PDF, CSV, Excel, Audio, Video, URL).
        """
        file_type = file_type.lower()
        
        if file_type in ["pdf", "doc", "docx", "txt", "photo", "jpg", "png"]:
            return self._analyze_document(file_content, file_type)
        elif file_type in ["csv", "xlsx", "xls"]:
            return self._analyze_data_file(file_content, file_type)
        elif file_type in ["mp3", "wav", "m4a", "mp4", "avi", "mov"]:
            return self._analyze_media_file(file_content, file_type)
        elif file_type == "url":
            return await self._analyze_url(file_content)
        else:
            return {
                "error": f"Unsupported file type: {file_type}",
                "status": "error"
            }

    def _analyze_document(self, content: str, file_type: str) -> Dict[str, Any]:
        ocr_result = self.ocr.extract_text(content)
        classification = self.ocr.classify_exhibit(ocr_result["extracted_text"])
        compliance = self.doc_automation.compliance_pre_check(ocr_result["extracted_text"], classification["exhibit_class"])
        
        # Evidence credibility (mock logic)
        credibility_score = 0.85 if ocr_result["extraction_confidence"] > 0.5 else 0.4
        if "signature_detected" in self.ocr.verify_signature_seal(ocr_result["extracted_text"]):
            credibility_score += 0.1

        return {
            "type": "document_analysis",
            "extracted_text": ocr_result["extracted_text"],
            "classification": classification["exhibit_class"],
            "compliance": compliance,
            "credibility_score": min(1.0, credibility_score),
            "summary": self._generate_summary(ocr_result["extracted_text"]),
            "timestamp": datetime.utcnow().isoformat()
        }

    def _analyze_data_file(self, content: str, file_type: str) -> Dict[str, Any]:
        # Mock logic for CSV/Excel analysis
        rows = content.split("\n")
        headers = rows[0].split(",") if rows else []
        
        return {
            "type": "data_analysis",
            "file_type": file_type,
            "columns": headers,
            "row_count": len(rows) - 1,
            "analysis": f"Analyzed {file_type} file containing legal transaction records. Data appears consistent with statutory filing requirements.",
            "compliance_check": "Compliant with Sec 51(3) reporting standards.",
            "timestamp": datetime.utcnow().isoformat()
        }

    def _analyze_media_file(self, content: str, file_type: str) -> Dict[str, Any]:
        # Mock transcription for audio/video
        return {
            "type": "media_analysis",
            "file_type": file_type,
            "transcription": "Transcribing audio/video content... [MOCK] 'The defendant was present at the scene and admitted to the oversight in the tax returns.'",
            "credibility_score": 0.78,
            "key_entities": ["Defendant", "Tax Returns", "Scene of Incident"],
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _analyze_url(self, url: str) -> Dict[str, Any]:
        # Mock URL analysis
        return {
            "type": "url_analysis",
            "url": url,
            "title": "Legal Bulletin - Judicial Review",
            "summary": "This URL contains relevant case law updates regarding administrative action and judicial review under Article 47.",
            "relevance_score": 0.92,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _handle_prediction_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        # Use LitigationService for prediction
        case_title = context.get("case_title", "General Case") if context else "General Case"
        case_details = context.get("case_details", query) if context else query
        case_type = context.get("case_type", "Civil") if context else "Civil"
        
        prediction = self.litigation.predict_case_outcome(case_title, case_details, case_type)
        return {
            "intent": "prediction",
            "response": f"Based on historical precedents and current case details, the predicted outcome is as follows: {prediction['rationale']}",
            "data": prediction,
            "ai_disclaimer": "⚠️ NON-BINDING ADVISORY — Predictions are probabilistic and for guidance only."
        }

    async def _handle_summary_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        case_details = context.get("case_details", query) if context else query
        summary = self._generate_summary(case_details)
        return {
            "intent": "summary",
            "response": f"Here is a summary of the case: {summary}",
            "summary": summary
        }

    async def _handle_research_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        results = self.legal_research.semantic_search(query)
        return {
            "intent": "research",
            "response": f"I found {len(results)} relevant legal precedents for your query.",
            "results": results[:3] # Return top 3
        }

    async def _handle_compliance_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        # Mock compliance response
        return {
            "intent": "compliance",
            "response": "The matter appears to be in compliance with the Civil Procedure Rules 2010. However, ensure all affidavits are sworn before a Commissioner for Oaths.",
            "statutes": ["Civil Procedure Act Cap 21", "Evidence Act Cap 80"]
        }

    async def _handle_general_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "intent": "general",
            "response": "I am your AI-JLSP legal assistant. I can help you analyze cases, predict outcomes, and check legal compliance. How can I assist you today?"
        }

    async def _handle_judgement_profiling(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        results = self.legal_research.semantic_search(query)
        # Mock profiling logic
        profiles = []
        for res in results[:2]:
            profiles.append({
                "case_name": res.get("title", "Unknown Case"),
                "outcome": "Settled" if "settle" in str(res).lower() else "Judgment for Plaintiff",
                "key_ratio": "The court held that administrative action must be fair and transparent per Art 47.",
                "relevance": "95%"
            })
            
        return {
            "intent": "judgement_profiling",
            "response": f"I've profiled {len(profiles)} similar judgements from eKLR. Here are the common patterns:",
            "profiles": profiles
        }

    def _generate_summary(self, text: str) -> str:
        # Simple extractive summary logic
        sentences = re.split(r'\. |\n', text)
        if len(sentences) <= 3:
            return text
        return ". ".join(sentences[:3]) + "..."
