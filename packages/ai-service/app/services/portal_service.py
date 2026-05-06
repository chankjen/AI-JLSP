from typing import Dict, Any, List

class PortalService:
    def __init__(self):
        # Swahili translation dictionary (Mock)
        self.swahili_map = {
            "case": "kesi",
            "hearing": "kusikizwa",
            "judgment": "hukumu",
            "objection": "pingamizi",
            "tax": "ushuru",
            "lawyer": "wakili",
            "court": "mahakama"
        }

    def provide_guidance(self, query: str) -> str:
        """
        RAG-based citizen guidance bot logic.
        """
        query_lower = query.lower()
        if "file" in query_lower and "tax" in query_lower:
            return "To file a tax objection, you need your KRA PIN, the assessment number, and a detailed statement of your grounds. You must file within 30 days of receiving the assessment."
        if "hearing" in query_lower:
            return "You can check your next hearing date in the 'My Cases' section of your dashboard. You will also receive an SMS notification 48 hours before the hearing."
        
        return "I can help you with filing cases, checking status, or understanding legal procedures. What would you like to know?"

    def translate_to_swahili(self, text: str) -> str:
        """
        Translates legal terms to Swahili for multi-lingual support (DPA Sec 3).
        """
        words = text.lower().split()
        translated = []
        for word in words:
            translated.append(self.swahili_map.get(word, word))
        return " ".join(translated)
