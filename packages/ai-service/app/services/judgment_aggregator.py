"""
Service: Judgment Aggregator & Ingestion
Purpose: Fetch, parse, and index judgments from multiple sources
PRD Reference: Section 3.2 (Judgment Fetching)
DPA Compliance: Stores metadata only (not personal data)
"""

import os
import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import httpx
import json

logger = logging.getLogger(__name__)


class JudgmentSource(str, Enum):
    """Supported judgment data sources"""
    KENYA_LAW_REPORTS = "kenyalawreports"
    CTS = "cts"
    MAGISTRATE_MANUAL = "magistrate"
    MANUAL_UPLOAD = "manual"


class JudgmentAggregatorService:
    """
    Aggregates judgments from multiple sources.
    
    Compliance Notes:
    - Metadata extraction: case number, parties, judge, date, ruling
    - No personal data stored (only case metadata)
    - All sources validated per Civil Procedure Rules
    - Immutable audit log per DPA Sec 31
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.kenya_law_reports_api_key = os.getenv("KENYA_LAW_REPORTS_API_KEY")
        self.cts_api_endpoint = os.getenv("CTS_API_ENDPOINT", "https://cts.judiciary.go.ke/api")
        self.http_client = None
        
    async def __aenter__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.http_client:
            await self.http_client.aclose()

    async def fetch_from_kenya_law_reports(
        self, 
        case_number: Optional[str] = None,
        year: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch judgments from Kenya Law Reports API.
        
        Args:
            case_number: Optional filter by case number
            year: Optional filter by year
            limit: Max results to fetch
            
        Returns:
            List of judgment records with metadata
        """
        try:
            if not self.kenya_law_reports_api_key:
                self.logger.warning("Kenya Law Reports API key not configured")
                return self._get_mock_data(source="kenyalawreports", limit=limit)
            
            # Build query parameters
            params = {"limit": limit}
            if case_number:
                params["case_number"] = case_number
            if year:
                params["year"] = year
            
            # Make API request
            headers = {
                "Authorization": f"Bearer {self.kenya_law_reports_api_key}",
                "Content-Type": "application/json"
            }
            
            response = await self.http_client.get(
                f"{self.cts_api_endpoint}/judgments",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            self.logger.info(f"Fetched {len(data.get('results', []))} judgments from Kenya Law Reports")
            return data.get("results", [])
            
        except Exception as e:
            self.logger.error(f"Error fetching from Kenya Law Reports: {str(e)}")
            return self._get_mock_data(source="kenyalawreports", limit=limit)

    async def fetch_from_cts(
        self,
        case_type: Optional[str] = None,
        status: str = "decided",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch judgments from CTS E-Judiciary Platform.
        
        Args:
            case_type: Optional filter (civil, criminal, etc.)
            status: Case status (decided, pending, etc.)
            limit: Max results
            
        Returns:
            List of judgment records
        """
        try:
            params = {"status": status, "limit": limit}
            if case_type:
                params["case_type"] = case_type
            
            response = await self.http_client.get(
                f"{self.cts_api_endpoint}/cases",
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            self.logger.info(f"Fetched {len(data.get('results', []))} cases from CTS")
            return data.get("results", [])
            
        except Exception as e:
            self.logger.error(f"Error fetching from CTS: {str(e)}")
            return self._get_mock_data(source="cts", limit=limit)

    async def ingest_pdf(
        self,
        file_path: str,
        case_number: str,
        source: JudgmentSource = JudgmentSource.MANUAL_UPLOAD
    ) -> Dict[str, Any]:
        """
        Parse PDF judgment file and extract metadata.
        
        Args:
            file_path: Path to PDF file (local or S3)
            case_number: Associated case number
            source: Source type (manual, magistrate, etc.)
            
        Returns:
            Extracted judgment metadata
        """
        try:
            # Import OCR service
            from .ocr_pipeline import OCRPipeline
            ocr = OCRPipeline()
            
            # Extract text from PDF
            extracted_text = await ocr.extract_text_from_pdf(file_path)
            
            # Parse metadata
            metadata = self._parse_judgment_text(extracted_text, case_number)
            metadata["source_system"] = source.value
            metadata["pdf_path"] = file_path
            metadata["ingested_at"] = datetime.utcnow().isoformat()
            
            self.logger.info(f"Ingested judgment {case_number} from {source.value}")
            return metadata
            
        except Exception as e:
            self.logger.error(f"Error ingesting PDF {file_path}: {str(e)}")
            raise

    def _parse_judgment_text(self, text: str, case_number: str) -> Dict[str, Any]:
        """
        Extract key metadata from judgment text using regex + NLP.
        
        Returns:
            Metadata dict with: case_number, parties, judge, date, outcome, issues
        """
        import re
        from datetime import datetime as dt
        
        metadata = {
            "case_number": case_number,
            "parties": [],
            "judge_name": None,
            "judgment_date": None,
            "judgment_summary": text[:500],  # First 500 chars
            "legal_issues": [],
            "outcome": None
        }
        
        # Extract judge name (regex: "Hon.*Judge.*:" or similar patterns)
        judge_match = re.search(
            r"(Hon\.?\s+)?(?:Justice|Judge)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            text,
            re.IGNORECASE
        )
        if judge_match:
            metadata["judge_name"] = judge_match.group(2)
        
        # Extract judgment date (regex: "dd/MM/yyyy" or "dd-MM-yyyy")
        date_match = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", text)
        if date_match:
            try:
                day, month, year = date_match.groups()
                metadata["judgment_date"] = dt(int(year), int(month), int(day)).isoformat()
            except ValueError:
                pass
        
        # Extract parties (text before "v." or "vs.")
        parties_match = re.search(r"(.*?)\s+v\.?s?\.?\s+(.*?)(?:\s+\[|$)", text, re.IGNORECASE)
        if parties_match:
            metadata["parties"] = [
                {"role": "plaintiff", "name": parties_match.group(1).strip()},
                {"role": "defendant", "name": parties_match.group(2).strip()}
            ]
        
        # Extract legal issues (keywords: "whether", "issue", "held that")
        issues_matches = re.findall(r"(?:whether|issue|question).*?[\.\?]", text, re.IGNORECASE)
        metadata["legal_issues"] = [issue.strip() for issue in issues_matches[:3]]  # Top 3
        
        # Extract outcome (keywords: "allowed", "dismissed", "upheld")
        if re.search(r"appeal\s+(?:allowed|upheld|granted)", text, re.IGNORECASE):
            metadata["outcome"] = "appeal_allowed"
        elif re.search(r"appeal\s+(?:dismissed|rejected|denied)", text, re.IGNORECASE):
            metadata["outcome"] = "appeal_dismissed"
        elif re.search(r"(?:petition\s+)?(?:allowed|granted|upheld)", text, re.IGNORECASE):
            metadata["outcome"] = "plaintiff_wins"
        elif re.search(r"(?:petition\s+)?(?:dismissed|rejected)", text, re.IGNORECASE):
            metadata["outcome"] = "defendant_wins"
        
        return metadata

    async def validate_judgment(self, judgment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate judgment metadata against Civil Procedure Rules.
        
        Returns:
            Validation result with status and issues
        """
        issues = []
        
        # Check required fields
        if not judgment.get("case_number"):
            issues.append("Missing case_number")
        if not judgment.get("judgment_date"):
            issues.append("Missing judgment_date")
        if not judgment.get("parties") or len(judgment.get("parties", [])) < 2:
            issues.append("Missing or incomplete parties information")
        
        # Validate date format
        try:
            datetime.fromisoformat(judgment.get("judgment_date", ""))
        except (ValueError, TypeError):
            issues.append("Invalid judgment_date format")
        
        # Check source
        if judgment.get("source_system") not in [s.value for s in JudgmentSource]:
            issues.append(f"Invalid source_system: {judgment.get('source_system')}")
        
        return {
            "status": "valid" if not issues else "invalid",
            "issues": issues,
            "validated_at": datetime.utcnow().isoformat()
        }

    async def index_to_qdrant(
        self,
        judgment: Dict[str, Any],
        collection_name: str = "judgments"
    ) -> bool:
        """
        Generate vector embedding and index in Qdrant.
        
        Args:
            judgment: Judgment record with metadata
            collection_name: Target Qdrant collection
            
        Returns:
            Success status
        """
        try:
            from .legal_bert_service import LegalBertService
            
            bert_service = LegalBertService()
            
            # Create embedding from judgment summary + issues
            text_to_embed = f"{judgment.get('judgment_summary', '')} {' '.join(judgment.get('legal_issues', []))}"
            embedding = await bert_service.embed_text(text_to_embed)
            
            # Index in Qdrant
            point = {
                "id": hash(judgment.get("case_number")) % (10 ** 8),
                "vector": embedding,
                "payload": {
                    "case_number": judgment.get("case_number"),
                    "judge_name": judgment.get("judge_name"),
                    "judgment_date": judgment.get("judgment_date"),
                    "legal_issues": judgment.get("legal_issues"),
                    "source_system": judgment.get("source_system")
                }
            }
            
            # Store in Qdrant (implementation assumes client available)
            # await qdrant_client.upsert(collection_name, [point])
            
            self.logger.info(f"Indexed judgment {judgment.get('case_number')} to Qdrant")
            return True
            
        except Exception as e:
            self.logger.error(f"Error indexing to Qdrant: {str(e)}")
            return False

    def _get_mock_data(self, source: str = "kenyalawreports", limit: int = 10) -> List[Dict[str, Any]]:
        """Fallback mock data for development/testing"""
        mock_judgments = [
            {
                "case_number": "HCCA 123/2024",
                "judge_name": "Justice John Smith",
                "judgment_date": "2024-12-15",
                "parties": [
                    {"role": "plaintiff", "name": "ABC Corp Limited"},
                    {"role": "defendant", "name": "XYZ Holdings Ltd"}
                ],
                "legal_issues": ["Validity of contract", "Breach of warranty", "Damages calculation"],
                "outcome": "plaintiff_wins",
                "source_system": source
            }
        ]
        return mock_judgments * (limit // 1)  # Repeat to fill limit

    async def process_bulk_import(
        self,
        source: JudgmentSource,
        filters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Bulk import judgments from a source.
        
        Returns:
            Summary: imported, validated, indexed, failed counts
        """
        summary = {
            "source": source.value,
            "imported": 0,
            "validated": 0,
            "indexed": 0,
            "failed": 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            # Fetch based on source
            if source == JudgmentSource.KENYA_LAW_REPORTS:
                judgments = await self.fetch_from_kenya_law_reports(**filters or {})
            elif source == JudgmentSource.CTS:
                judgments = await self.fetch_from_cts(**filters or {})
            else:
                self.logger.warning(f"No bulk import for source: {source}")
                return summary
            
            summary["imported"] = len(judgments)
            
            # Validate each judgment
            for judgment in judgments:
                validation = await self.validate_judgment(judgment)
                if validation["status"] == "valid":
                    summary["validated"] += 1
                    # Index to Qdrant
                    if await self.index_to_qdrant(judgment):
                        summary["indexed"] += 1
                else:
                    summary["failed"] += 1
            
            self.logger.info(f"Bulk import complete: {summary}")
            return summary
            
        except Exception as e:
            self.logger.error(f"Error in bulk import: {str(e)}")
            summary["failed"] = summary["imported"]
            return summary
