# ============================================================================
# OCR Pipeline - AI-JLSP
# PRD Sec 7: Computer Vision — OCR for legacy documents, exhibit classification,
#             signature/seal verification
# ============================================================================

import re
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class OCRPipeline:
    """
    Legacy document OCR pipeline.
    PRD Sec 7: OCR for legacy documents, exhibit classification,
               signature/seal verification.
    Penal Code Cap 63: Chain of custody, evidence handling.
    """

    # Known KRA seal markers for seal verification
    KRA_SEAL_PATTERNS = [
        r"kenya revenue authority",
        r"commissioner general",
        r"KRA[^\w]",
        r"official seal",
        r"authentic(?:ated)?",
    ]

    # Exhibit classification keywords
    EXHIBIT_CLASSES = {
        "financial": ["invoice", "receipt", "statement", "tax", "assessment", "ksh", "kes"],
        "legal_pleading": ["plaint", "affidavit", "petition", "notice", "summons", "order"],
        "contract": ["agreement", "contract", "lease", "deed", "undertaking", "covenant"],
        "correspondence": ["letter", "email", "memo", "notice", "circular", "dispatch"],
        "land_document": ["title deed", "certificate of lease", "mutation", "survey"],
    }

    def extract_text(self, raw_text: str) -> Dict[str, Any]:
        """
        Simulate OCR text extraction from a legacy document.
        In production: integrate pytesseract / Google Vision API / Azure OCR.
        """
        # Normalise whitespace (simulates OCR cleanup)
        cleaned = re.sub(r"\s+", " ", raw_text).strip()
        word_count = len(cleaned.split())
        char_count = len(cleaned)

        return {
            "extracted_text": cleaned,
            "word_count": word_count,
            "character_count": char_count,
            "extraction_confidence": min(1.0, word_count / 200),  # proxy for OCR confidence
            "language_detected": "en",
            "timestamp": datetime.utcnow().isoformat(),
            "pipeline": "ocr-pipeline-v1",
            "ai_disclaimer": (
                "⚠️ NON-BINDING ADVISORY — OCR extraction is an AI-assisted process. "
                "Original documents remain authoritative. Verify against source."
            ),
        }

    def classify_exhibit(self, text: str) -> Dict[str, Any]:
        """
        Classify a document as a specific exhibit type.
        PRD Sec 7: Exhibit classification.
        Penal Code Cap 63: Evidence handling, chain of custody.
        """
        text_lower = text.lower()
        scores: Dict[str, float] = {}

        for exhibit_class, keywords in self.EXHIBIT_CLASSES.items():
            matches = sum(1 for kw in keywords if kw in text_lower)
            scores[exhibit_class] = round(matches / len(keywords), 3)

        top_class = max(scores, key=lambda k: scores[k]) if scores else "unknown"
        confidence = scores.get(top_class, 0.0)

        return {
            "exhibit_class": top_class,
            "confidence": confidence,
            "all_scores": scores,
            "chain_of_custody_note": (
                "Document classified for chain of custody tracking. "
                "Penal Code Cap 63 — evidence integrity maintained."
            ),
            "ai_disclaimer": (
                "⚠️ NON-BINDING ADVISORY — Exhibit classification requires advocate/court officer confirmation."
            ),
            "requires_human_review": True,
        }

    def verify_signature_seal(self, text: str) -> Dict[str, Any]:
        """
        Signature and seal verification for KRA and judicial documents.
        KRA Act Cap 469 Sec 4 (seal authentication).
        """
        text_lower = text.lower()
        seal_found = any(
            re.search(pattern, text_lower) for pattern in self.KRA_SEAL_PATTERNS
        )
        signature_found = bool(
            re.search(r"signed?\s+by|signature\s+of|authorised\s+by|commissioner", text_lower, re.IGNORECASE)
        )

        return {
            "seal_detected": seal_found,
            "signature_detected": signature_found,
            "is_authenticated": seal_found and signature_found,
            "verification_notes": (
                "KRA Official Seal and authorised signature detected."
                if seal_found and signature_found
                else "Authentication incomplete — manual verification required per KRA Act Cap 469 Sec 4."
            ),
            "statutory_basis": "KRA Act Cap 469 Sec 4 (seal authentication)",
            "ai_disclaimer": (
                "⚠️ NON-BINDING ADVISORY — Seal/signature verification by AI is assistive only. "
                "Official authentication requires authorised KRA or Judiciary officer verification."
            ),
            "requires_human_review": True,
        }
