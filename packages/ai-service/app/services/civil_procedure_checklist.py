# AI-JLSP Civil Procedure Checklist Service
# Compliance: Civil Procedure Rules (Kenya)

class CivilProcedureChecklist:
    def __init__(self):
        self.checklists = {
            "plaint": [
                "Statement of claim",
                "Verification of facts",
                "List of witnesses",
                "Witness statements",
                "List of documents"
            ],
            "objection": [
                "Grounds of objection",
                "Taxpayer details",
                "Assessment reference",
                "Amount in dispute"
            ]
        }

    def validate_document(self, text, doc_type):
        doc_type = doc_type.lower()
        checklist = self.checklists.get(doc_type, [])
        
        if not checklist:
            return {
                "is_valid": True,
                "score": 1.0,
                "total_items": 0,
                "passed_items": 0,
                "missing_items": [],
                "recommendations": ["No specific checklist for this document type."],
                "detailed_results": []
            }

        missing = []
        passed_count = 0
        detailed = []

        for item in checklist:
            found = item.lower() in text.lower()
            detailed.append({"item": item, "found": found})
            if found:
                passed_count += 1
            else:
                missing.append(item)

        is_valid = passed_count == len(checklist)
        score = passed_count / len(checklist) if checklist else 1.0

        return {
            "is_valid": is_valid,
            "score": score,
            "total_items": len(checklist),
            "passed_items": passed_count,
            "missing_items": missing,
            "recommendations": [f"Ensure {item} is clearly mentioned." for item in missing],
            "detailed_results": detailed
        }
