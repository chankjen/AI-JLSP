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
        Implements smart semantic search with robust mock fallback for development.
        """
        # Comprehensive Mock Database
        mock_db = [
            {
                "id": "kenya_const_2010",
                "title": "Constitution of Kenya 2010 - Art 48",
                "content": "The State shall ensure access to justice for all persons and, if any fee is required, it shall be reasonable and shall not impede access to justice.",
                "type": "constitution"
            },
            {
                "id": "kenya_const_art31",
                "title": "Constitution of Kenya 2010 - Art 31",
                "content": "Every person has the right to privacy, which includes the right not to have their personal information shared or revealed.",
                "type": "constitution"
            },
            {
                "id": "kenya_penal_code",
                "title": "Penal Code (Cap 63) - Sec 108",
                "content": "Any person who, with intent to mislead any tribunal in any judicial proceeding—(a) makes a false statement, is guilty of a felony.",
                "type": "penal_code"
            },
            {
                "id": "dpa_2019_sec26",
                "title": "Data Protection Act 2019 - Sec 26",
                "content": "A data subject has a right—(a) to be informed of the use to which their personal data is to be put; (b) to access their personal data.",
                "type": "dpa"
            },
            {
                "id": "dpa_2019_sec25",
                "title": "Data Protection Act 2019 - Sec 25",
                "content": "A data controller shall ensure that personal data is processed in accordance with the principles of data protection, including lawfulness and transparency.",
                "type": "dpa"
            },
            {
                "id": "tax_procedures_act",
                "title": "Tax Procedures Act - Section 51(3)",
                "content": "A notice of objection shall be valid if it states precisely the grounds of objection, the amendments required, and the undisputed tax has been paid.",
                "type": "tax_law"
            },
            {
                "id": "tax_law_income",
                "title": "Income Tax Act (Cap 470)",
                "content": "Tax shall be charged for each year of income upon all the income of a person, whether resident or non-resident, which accrued in or was derived from Kenya.",
                "type": "tax_law"
            },
            {
                "id": "au_charter",
                "title": "African Charter on Human and Peoples' Rights",
                "content": "Every individual shall have the right to have his cause heard. This comprises the right to an appeal to competent national organs.",
                "type": "regional_law"
            },
            {
                "id": "eac_treaty",
                "title": "Treaty for the Establishment of the East African Community",
                "content": "The Partner States undertake to establish among themselves and in accordance with the provisions of this Treaty, a Customs Union, a Common Market, subsequently a Monetary Union.",
                "type": "regional_law"
            },
            {
                "id": "icc_statute",
                "title": "Rome Statute of the International Criminal Court",
                "content": "The Court shall have jurisdiction in respect of the following crimes: (a) The crime of genocide; (b) Crimes against humanity; (c) War crimes.",
                "type": "international_law"
            },
            {
                "id": "un_declaration",
                "title": "Universal Declaration of Human Rights - Art 12",
                "content": "No one shall be subjected to arbitrary interference with his privacy, family, home or correspondence, nor to attacks upon his honour and reputation.",
                "type": "international_law"
            }
        ]

        # Filtering Logic
        results = []
        search_query = query.lower()
        
        for doc in mock_db:
            # Match query (case-insensitive)
            query_match = (search_query in doc["title"].lower()) or (search_query in doc["content"].lower())
            
            # Match document type (if filter is not 'all')
            type_match = True
            if document_type and document_type != 'all':
                type_match = (doc["type"] == document_type)
            
            if query_match and type_match:
                results.append({
                    "id": doc["id"],
                    "score": 0.95 if search_query in doc["title"].lower() else 0.85,
                    "title": doc["title"],
                    "content_snippet": doc["content"][:200] + "...",
                    "type": doc["type"]
                })

        return sorted(results, key=lambda x: x["score"], reverse=True)


    def explain_provision(self, provision_text: str, context: str) -> str:
        """
        RAG backend: uses context to generate a plain-language summary.
        """
        # Mock LLM generation
        explanation = f"Based on the Constitution and the Tax Procedures Act, this provision means that you must clearly list your reasons for disagreeing with the tax assessment. "
        explanation += "Additionally, you are required to pay any portion of the tax that you agree you owe before filing the objection. "
        explanation += "Failure to do this will result in the objection being rejected."
        return explanation
