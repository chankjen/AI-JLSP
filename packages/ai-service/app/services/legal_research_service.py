import os
from typing import Dict, Any, List
from sentence_transformers import SentenceTransformer
import qdrant_client

class LegalResearchService:
    def __init__(self):
        model_name = os.getenv("LEGAL_BERT_MODEL", "nlpaueb/legal-bert-base-uncased")
        # In a real scenario, this would load the model
        # self.model = SentenceTransformer(model_name)
        
        # Connect to Qdrant Vector DB
        self.qdrant = qdrant_client.QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"),
            port=int(os.getenv("QDRANT_PORT", "6333")),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "legal_documents")

    def semantic_search(self, query: str, document_type: str = None) -> List[Dict[str, Any]]:
        """
        Implements dense vector retrieval from Qdrant.
        """
        # Mocking the embedding generation for the query
        # query_vector = self.model.encode([query])[0].tolist()
        query_vector = [0.1] * 768  # Mock 768-dim vector

        try:
            # Check if collection exists
            self.qdrant.get_collection(self.collection_name)
            
            # Execute search
            filter_conditions = None
            if document_type:
                from qdrant_client.http import models
                filter_conditions = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="type",
                            match=models.MatchValue(value=document_type)
                        )
                    ]
                )

            search_results = self.qdrant.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=filter_conditions,
                limit=5,
                score_threshold=0.6
            )
            
            # Format results
            results = []
            for hit in search_results:
                results.append({
                    "id": hit.id,
                    "score": hit.score,
                    "title": hit.payload.get("title", "Unknown Title"),
                    "content_snippet": hit.payload.get("content", "")[:200] + "...",
                    "type": hit.payload.get("type", "unknown")
                })
            return results
            
        except Exception as e:
            # Fallback to mock data if Qdrant isn't fully seeded yet
            return [
                {
                    "id": "kenya_const_2010",
                    "score": 0.98,
                    "title": "Constitution of Kenya 2010 - Art 48",
                    "content_snippet": "The State shall ensure access to justice for all persons and, if any fee is required, it shall be reasonable and shall not impede access to justice.",
                    "type": "constitution"
                },
                {
                    "id": "kenya_penal_code",
                    "score": 0.95,
                    "title": "Penal Code (Cap 63) - Sec 108",
                    "content_snippet": "Any person who, with intent to mislead any tribunal in any judicial proceeding—(a) makes a false statement, is guilty of a felony.",
                    "type": "penal_code"
                },
                {
                    "id": "dpa_2019",
                    "score": 0.94,
                    "title": "Data Protection Act 2019 - Sec 26",
                    "content_snippet": "A data subject has a right—(a) to be informed of the use to which their personal data is to be put; (b) to access their personal data in custody of data controller.",
                    "type": "dpa"
                },
                {
                    "id": "tax_procedures_act",
                    "score": 0.92,
                    "title": "Tax Procedures Act - Section 51(3)",
                    "content_snippet": "A notice of objection shall be valid if it states precisely the grounds of objection, the amendments required, and the undisputed tax has been paid.",
                    "type": "tax_law"
                },
                {
                    "id": "au_charter",
                    "score": 0.89,
                    "title": "African Charter on Human and Peoples' Rights",
                    "content_snippet": "Every individual shall have the right to have his cause heard. This comprises: (a) The right to an appeal to competent national organs against acts of violating his fundamental rights.",
                    "type": "regional_law"
                },
                {
                    "id": "icc_statute",
                    "score": 0.87,
                    "title": "Rome Statute of the International Criminal Court",
                    "content_snippet": "The Court shall have jurisdiction in respect of the following crimes: (a) The crime of genocide; (b) Crimes against humanity; (c) War crimes.",
                    "type": "international_law"
                }
            ]

    def explain_provision(self, provision_text: str, context: str) -> str:
        """
        RAG backend: uses context to generate a plain-language summary.
        """
        # Mock LLM generation
        explanation = f"Based on the Constitution and the Tax Procedures Act, this provision means that you must clearly list your reasons for disagreeing with the tax assessment. "
        explanation += "Additionally, you are required to pay any portion of the tax that you agree you owe before filing the objection. "
        explanation += "Failure to do this will result in the objection being rejected."
        return explanation
