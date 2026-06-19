import os
from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)

class QwenService:
    """
    Qwen Integration Service using an OpenAI-compatible Cloud API (e.g., Together AI or DashScope).
    """

    def __init__(self):
        # Default to local Ollama instance
        self.api_key = os.getenv("QWEN_API_KEY", "ollama")
        self.base_url = os.getenv("QWEN_API_BASE", "http://ai_jlsp_ollama:11434/v1")
        self.model_name = os.getenv("QWEN_MODEL_NAME", "qwen2.5:1.5b")
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )
        
        # Setup Qdrant for RAG
        import qdrant_client
        self.qdrant = qdrant_client.QdrantClient(
            host=os.getenv("QDRANT_HOST", "qdrant"),
            port=int(os.getenv("QDRANT_PORT", "6333")),
            api_key=os.getenv("QDRANT_API_KEY", "qdrant_dev_key")
        )
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "legal_knowledge")
        
        self.dashboard_system_prompt = """You are a highly efficient Legal Data Analyst Assistant for the Kenya Judiciary.
Adhere strictly to the following constraints:
1. Conciseness & Formatting (UI Constraints): Be extremely brief. Do not use conversational filler (e.g., do not say 'Here is the data' or 'Certainly'). Format responses cleanly using Markdown, employing bullet points, bold text for key metrics, and tables for comparisons.
2. Data Integrity & Anti-Hallucination: Base your answers STRICTLY on the provided data context. If the data to answer the prompt is not in the context, explicitly state 'Data not available' and do not hallucinate an answer. Never expose or infer Personally Identifiable Information (PII) unless it is explicitly provided in the secure context.
3. Scope & Role Restrictions: Act strictly as a data analyst. Refuse to answer questions unrelated to the dashboard's specific domain. When suggesting insights, focus strictly on actionable metrics (e.g., 'Metric X changed by Y% due to Z')."""

        self.chat_system_prompt = """You are an active, helpful Legal Assistant for the AI-JLSP platform in Kenya. 
You provide accurate, conversational, and context-aware responses to user queries based on the provided context.
Maintain a professional legal tone but be accessible. Keep responses concise unless asked for detailed explanations."""

    async def _get_rag_context(self, query: str) -> str:
        """Retrieves relevant context from Qdrant using Ollama embeddings."""
        try:
            import httpx
            # Get embedding from Ollama
            response = httpx.post(
                "http://ai_jlsp_ollama:11434/api/embeddings",
                json={"model": "nomic-embed-text", "prompt": query},
                timeout=10.0
            )
            embedding = response.json().get("embedding")
            
            if not embedding:
                return ""

            # Search Qdrant
            search_result = self.qdrant.search(
                collection_name=self.collection_name,
                query_vector=embedding,
                limit=3
            )
            
            contexts = [hit.payload.get("content", "") for hit in search_result if hit.score > 0.5]
            return "\n\n".join(contexts)
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")
            return ""

    async def generate_chat_response(self, query: str, context: dict = None) -> str:
        """
        Generates an active chat response based on user query and optional context.
        """
        if self.api_key == "mock-api-key":
            return self._mock_qwen_response(query, "chat")

        try:
            rag_context = await self._get_rag_context(query)
            
            messages = [
                {"role": "system", "content": self.chat_system_prompt}
            ]
            
            if rag_context:
                messages.append({"role": "system", "content": f"Relevant Document Knowledge:\n{rag_context}"})
                
            if context:
                messages.append({"role": "system", "content": f"User Context Data: {context}"})
                
            messages.append({"role": "user", "content": query})

            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.3,
                max_tokens=500
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Qwen chat generation error: {e}")
            return "I am currently unable to process your request due to an AI service connection issue."

    async def generate_dashboard_analysis(self, prompt: str, context_data: dict) -> str:
        """
        Generates concise, markdown-formatted insights for dashboards based on structured data.
        """
        if self.api_key == "mock-api-key":
            return self._mock_qwen_response(prompt, "dashboard", context_data)

        try:
            messages = [
                {"role": "system", "content": self.dashboard_system_prompt},
                {"role": "user", "content": f"Context Data:\n{context_data}\n\nTask: {prompt}"}
            ]

            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.1, # Low temperature for factual analysis
                max_tokens=300
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Qwen dashboard generation error: {e}")
            return "Data not available (Error connecting to Qwen API)."

    async def generate_proactive_guidance(self, activity_state: dict) -> str:
        """
        Generates a proactive, contextual toast notification guidance based on user activity.
        """
        try:
            messages = [
                {"role": "system", "content": "You are a subtle, helpful UI assistant. Given the user's current context in the AI-JLSP app, generate a very brief, friendly 1-sentence proactive tip or guidance message. Keep it strictly under 15 words."},
                {"role": "user", "content": f"User is on route: {activity_state.get('pathname')}. Recent action: {activity_state.get('last_action')}."}
            ]

            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=50
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Qwen proactive guidance error: {e}")
            return "Need help? Feel free to ask the AI assistant!"

    def _mock_qwen_response(self, query: str, intent: str, context: dict = None) -> str:
        """Fallback mock response when API keys are not provided."""
        if intent == "dashboard":
            if "prediction" in query.lower() or "outcome" in query.lower():
                return "**Outcome Prediction:**\n- **Probability of Win:** 84%\n- **Rationale:** Based on similar High Court precedents, structural alignment is strong."
            if "triage" in query.lower() or "classify" in query.lower():
                return "- **Complexity:** High\n- **Priority:** Urgent\n- **Rationale:** Includes constitutional questions."
            return "Data not available (Mock Response)."
        else:
            return f"[Qwen Active Chat Mock] I've processed your query: '{query}'. Provide an API key to enable real inference."
