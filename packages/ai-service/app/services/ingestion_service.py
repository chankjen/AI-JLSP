import os
from typing import List, Dict, Any
import qdrant_client
from qdrant_client.http import models

class IngestionService:
    def __init__(self):
        self.qdrant = qdrant_client.QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"),
            port=int(os.getenv("QDRANT_PORT", "6333")),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "legal_documents")

    def ingest_precedent(self, title: str, content: str, doc_type: str, metadata: Dict[str, Any]):
        """
        Embeds and indexes a single legal precedent into Qdrant.
        """
        # Mock embedding generation (768-dim vector)
        vector = [0.05] * 768 
        
        point_id = hashlib.md5(f"{title}{doc_type}".encode()).hexdigest()
        
        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "title": title,
                        "content": content,
                        "type": doc_type,
                        **metadata
                    }
                )
            ]
        )
        return point_id

    def bulk_ingest_eklr(self, records: List[Dict[str, Any]]):
        """
        Handles bulk ingestion of parsed eKLR records.
        """
        success_count = 0
        for record in records:
            try:
                self.ingest_precedent(
                    title=record['title'],
                    content=record['content'],
                    doc_type='case_law',
                    metadata={
                        "court": record.get('court'),
                        "year": record.get('year'),
                        "citation": record.get('citation')
                    }
                )
                success_count += 1
            except Exception as e:
                print(f"Failed to ingest record {record.get('title')}: {e}")
                
        return success_count

import hashlib
