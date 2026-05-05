from typing import Dict, List, Any
import re
from sentence_transformers import SentenceTransformer
import qdrant_client
from qdrant_client.http import models
import os

class LegalBERTService:
    def __init__(self):
        self.model = SentenceTransformer('sentence-transformers/legal-bert-base-uncased')
        self.qdrant = qdrant_client.QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"),
            port=int(os.getenv("QDRANT_PORT", "6333")),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "legal_documents")

    async def validate_document(self, document_text: str, document_type: str, case_type: str) -> Dict[str, Any]:
        # Generate embeddings for the document
        embeddings = self.model.encode([document_text])

        # Search for similar legal documents in vector database
        search_results = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=embeddings[0].tolist(),
            limit=5,
            score_threshold=0.7
        )

        # Analyze document against legal patterns
        issues = self._analyze_legal_patterns(document_text, document_type, case_type)
        recommendations = self._generate_recommendations(issues, search_results)

        # Calculate confidence score
        confidence = self._calculate_confidence(issues, search_results)

        return {
            "is_valid": len(issues) == 0,
            "confidence": confidence,
            "issues": issues,
            "recommendations": recommendations
        }

    def _analyze_legal_patterns(self, text: str, doc_type: str, case_type: str) -> List[Dict[str, Any]]:
        issues = []

        # Document structure checks
        if doc_type == "pleading":
            if not re.search(r"(?i)in the matter of", text):
                issues.append({
                    "type": "structure",
                    "severity": "high",
                    "description": "Missing 'In the matter of' clause",
                    "section": "Civil Procedure Rules Order 6"
                })

        if doc_type == "contract":
            if not re.search(r"(?i)witnesseth|whereas", text):
                issues.append({
                    "type": "structure",
                    "severity": "medium",
                    "description": "Missing recitals section",
                    "section": "Contract Law"
                })

        # Jurisdiction checks
        if case_type == "litigation":
            if not re.search(r"(?i)court|magistrate|high court", text):
                issues.append({
                    "type": "jurisdiction",
                    "severity": "high",
                    "description": "Unclear court jurisdiction",
                    "section": "Civil Procedure Rules Order 1"
                })

        # Signature requirements
        if not re.search(r"(?i)signed|executed|witness", text):
            issues.append({
                "type": "execution",
                "severity": "high",
                "description": "Missing execution clause",
                "section": "Law of Contract Act"
            })

        return issues

    def _generate_recommendations(self, issues: List[Dict], search_results: List) -> List[str]:
        recommendations = []

        for issue in issues:
            if issue["type"] == "structure":
                recommendations.append(f"Add proper {issue['description'].lower()} as required by {issue['section']}")
            elif issue["type"] == "jurisdiction":
                recommendations.append("Specify the court and jurisdiction clearly")
            elif issue["type"] == "execution":
                recommendations.append("Include proper execution and witnessing clauses")

        # Add AI-powered recommendations from similar documents
        if search_results:
            recommendations.append("Review similar successful documents for formatting guidance")

        return recommendations

    def _calculate_confidence(self, issues: List[Dict], search_results: List) -> float:
        base_confidence = 1.0

        # Reduce confidence based on issues
        for issue in issues:
            if issue["severity"] == "high":
                base_confidence -= 0.3
            elif issue["severity"] == "medium":
                base_confidence -= 0.15

        # Boost confidence with similar documents
        if search_results:
            base_confidence += min(len(search_results) * 0.1, 0.2)

        return max(0.0, min(1.0, base_confidence))
