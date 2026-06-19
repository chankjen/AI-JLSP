import os
import glob
import PyPDF2
import httpx
import hashlib
from qdrant_client import QdrantClient
from qdrant_client.http import models

OLLAMA_URL = "http://ai_jlsp_ollama:11434/api/embeddings"
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "qdrant_dev_key")
COLLECTION_NAME = "legal_knowledge"

def get_embedding(text: str) -> list:
    response = httpx.post(
        OLLAMA_URL,
        json={"model": "nomic-embed-text", "prompt": text},
        timeout=30.0
    )
    if response.status_code == 200:
        return response.json().get("embedding")
    else:
        print(f"Error getting embedding: {response.text}")
        return None

def chunk_text(text: str, max_words=200):
    words = text.split()
    for i in range(0, len(words), max_words):
        yield " ".join(words[i:i + max_words])

def process_pdfs(docs_dir: str):
    qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, api_key=QDRANT_API_KEY)
    
    # Ensure collection exists
    try:
        qdrant.get_collection(COLLECTION_NAME)
    except Exception:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE)
        )
    
    pdf_files = glob.glob(os.path.join(docs_dir, "*.pdf"))
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        print(f"Processing {filename}...")
        
        try:
            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                
                # Chunk and embed
                chunks = list(chunk_text(text))
                for idx, chunk in enumerate(chunks):
                    if len(chunk.strip()) < 50:
                        continue
                    
                    vector = get_embedding(chunk)
                    if not vector:
                        continue
                    
                    point_id = hashlib.md5(f"{filename}_{idx}".encode()).hexdigest()
                    
                    qdrant.upsert(
                        collection_name=COLLECTION_NAME,
                        points=[
                            models.PointStruct(
                                id=point_id,
                                vector=vector,
                                payload={
                                    "source": filename,
                                    "chunk_id": idx,
                                    "content": chunk
                                }
                            )
                        ]
                    )
            print(f"Successfully ingested {filename} ({len(chunks)} chunks).")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    docs_directory = "/app/docs"  # Will be mapped in docker or run relative
    if not os.path.exists(docs_directory):
        docs_directory = "../../docs" # fallback
    print(f"Starting ingestion from {docs_directory}...")
    process_pdfs(docs_directory)
