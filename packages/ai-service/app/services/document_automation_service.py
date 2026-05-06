from typing import Dict, Any, List

class DocumentAutomationService:
    def __init__(self):
        # We would typically inject a vector DB client here to search for precedent clauses
        pass

    def suggest_clauses(self, draft_text: str, document_type: str) -> List[Dict[str, str]]:
        """
        Suggests clauses based on precedent vectors.
        """
        suggestions = []
        text_lower = draft_text.lower()
        
        if document_type == "contract":
            if "force majeure" not in text_lower:
                suggestions.append({
                    "clause_name": "Force Majeure",
                    "suggestion_text": "Neither party shall be liable for any failure or delay in performance under this Agreement to the extent said failures or delays are proximately caused by causes beyond that party's reasonable control and occurring without its fault or negligence.",
                    "rationale": "Standard protection against unforeseen events, commonly found in 92% of similar contracts."
                })
            if "severability" not in text_lower:
                suggestions.append({
                    "clause_name": "Severability",
                    "suggestion_text": "If any provision of this Agreement is held illegal or unenforceable in a judicial proceeding, such provision shall be severed and shall be inoperative, and the remainder of this Agreement shall remain operative and binding on the Parties.",
                    "rationale": "Prevents the entire contract from being voided if one clause is found invalid."
                })
                
        elif document_type == "objection_decision":
            if "appeal rights" not in text_lower:
                suggestions.append({
                    "clause_name": "Notice of Appeal Rights",
                    "suggestion_text": "If you are dissatisfied with this objection decision, you have the right to appeal to the Tax Appeals Tribunal within 30 days from the date of receipt of this decision, as per Section 52 of the Tax Procedures Act.",
                    "rationale": "Statutory requirement to notify taxpayers of their right to appeal."
                })
        
        return suggestions

    def compliance_pre_check(self, draft_text: str, document_type: str) -> Dict[str, Any]:
        """
        Validates drafts against statutory requirements (e.g., Land Act 2012, TPA).
        """
        text_lower = draft_text.lower()
        issues = []
        is_compliant = True

        if document_type == "conveyancing":
            if "spousal consent" not in text_lower:
                issues.append({
                    "rule": "Land Act 2012 Sec 93",
                    "issue": "Missing Spousal Consent clause",
                    "severity": "CRITICAL",
                    "remediation": "Add a clause explicitly confirming spousal consent or declaring that the property is not matrimonial property."
                })
                is_compliant = False
                
        elif document_type == "objection_decision":
            if "reasons for decision" not in text_lower:
                issues.append({
                    "rule": "Tax Procedures Act Sec 51(8)",
                    "issue": "Missing explicit reasons for the decision",
                    "severity": "CRITICAL",
                    "remediation": "Ensure the decision clearly sets out the reasons for allowing or disallowing the objection."
                })
                is_compliant = False

        return {
            "is_compliant": is_compliant,
            "issues": issues,
            "validation_timestamp": "now" # this would be actual ISO timestamp
        }
