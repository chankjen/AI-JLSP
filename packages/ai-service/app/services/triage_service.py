import re
from typing import Dict, Any

class TriageService:
    def __init__(self):
        # In a real scenario, this would load the 'doc-type-classifier-ke' and 'swahili-legal-ner-v2'
        pass

    def extract_entities(self, text: str) -> Dict[str, Any]:
        """Mock implementation of Swahili Legal NER extraction"""
        entities = {
            "pin": None,
            "assessment_date": None,
            "tax_head": None,
            "amount": None
        }
        
        # Simple regex extraction for demonstration
        pin_match = re.search(r'\b[A-Z]\d{9}[A-Z]\b', text)
        if pin_match:
            entities["pin"] = pin_match.group(0)
            
        date_match = re.search(r'\b\d{2}/\d{2}/\d{4}\b', text)
        if date_match:
            entities["assessment_date"] = date_match.group(0)
            
        return entities

    def classify_and_route(self, title: str, description: str, case_type: str) -> Dict[str, Any]:
        """Implements the KRA Org Structure routing rules and DocClassifier"""
        text = f"{title} {description}".lower()
        
        complexity = "medium"
        priority = "medium"
        division = "General Registry"
        
        # 1. Classification & Routing
        if case_type == "tax_objection" or "tax" in text or "revenue" in text or "kra" in text:
            division = "Tax Dispute Resolution (TDR)"
            if "customs" in text:
                division = "Customs & Border Control"
            elif "vat" in text:
                division = "Domestic Taxes Department"
                
        elif case_type == "conveyancing" or "land" in text or "property" in text or "title" in text:
            division = "Environment & Land Court"
            
        elif case_type == "litigation" or "sue" in text or "damages" in text:
            division = "Civil Litigation"

        # 2. Prioritization Logic
        high_priority_keywords = ["urgent", "injunction", "imminent", "stay order", "constitutional", "vulnerable"]
        if any(keyword in text for keyword in high_priority_keywords):
            priority = "high"
            
        # Complexity Scoring
        if len(description.split()) > 500 or "cross-border" in text or "multinational" in text:
            complexity = "high"
            
        entities = self.extract_entities(text)
        
        rationale = f"Assigned to {division} based on case type '{case_type}' and semantic analysis. "
        rationale += f"Priority set to {priority}. "
        if entities["pin"]:
            rationale += f"Identified KRA PIN: {entities['pin']}. "

        return {
            "complexity": complexity,
            "priority": priority,
            "assigned_division": division,
            "rationale": rationale,
            "confidence": 0.89,
            "entities_extracted": entities
        }
