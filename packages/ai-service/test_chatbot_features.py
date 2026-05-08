#!/usr/bin/env python
"""
Test script for enhanced chatbot features:
- Litigation anticipation
- Fun factual summaries
- Swahili gist interpretation
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3002"

# ANSI color codes for output
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def print_test(name):
    print(f"\n{YELLOW}TEST: {name}{RESET}")

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_response(label, data):
    print(f"\n{label}:")
    print(json.dumps(data, indent=2))

# Test data
SAMPLE_CONTRACT = """
LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on this 1st day of May 2026, 
between John Mwangi ("Landlord") and ABC Corporation Limited ("Tenant").

1. PARTIES
The Landlord agrees to rent the commercial space located at Plot 123, Nairobi to the Tenant 
for a monthly rent of KES 500,000.

2. BREACH OF LEASE
If Tenant fails to pay rent within 7 days of the due date, Landlord may terminate this 
agreement and pursue legal action for recovery of unpaid amounts plus penalties.

3. DISPUTE RESOLUTION
Any disputes arising from this agreement shall be resolved through arbitration per the 
Arbitration Act. The prevailing party may pursue execution against the defaulting party's assets.

4. TERMINATION
This lease may be terminated by either party with 30 days written notice. Upon termination, 
the Tenant shall vacate the premises and restore them to original condition.

DATED this 1st day of May 2026
Signed: John Mwangi (Landlord)
Signed: ABC Corporation Limited (Tenant Director)
"""

SAMPLE_TAX_OBJECTION = """
OBJECTION TO TAX ASSESSMENT

Pin Number: A001234567X
Assessment Date: March 15, 2026
Amount in Dispute: KES 2,500,000

GROUNDS OF OBJECTION (per Section 51(3) TPA):

1. VALUATION METHODOLOGY DISPUTE
The assessment was based on an inflated property valuation of KES 50 million. The actual 
market value is KES 35 million as evidenced by independent valuation report attached as Exhibit A.

2. PROCEDURAL ERROR
The Assessment Officer failed to provide adequate notice period as required by Section 22 of 
the Valuation for Rating Act. The taxpayer was given only 5 days instead of the mandatory 14 days.

3. MISAPPLICATION OF LAW
The penalty imposed violates Article 47 of the Constitution regarding fair administrative action. 
The penalty rate of 100% is disproportionate to the offense.

We hereby submit this objection within the statutory 30-day period and request suspension of 
payment pending determination.
"""

def test_health_check():
    """Test the health endpoint"""
    print_test("Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"Service is healthy: {response.json()}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Connection error: {str(e)}")
        return False

def test_litigation_analysis():
    """Test litigation anticipation feature"""
    print_test("Litigation Anticipation Analysis")
    try:
        payload = {
            "query": "analyze litigation risks",
            "context": {
                "document_text": SAMPLE_CONTRACT
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/query",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Query processed successfully")
            print_response("Response", data)
            
            # Validate key fields
            if "litigation_risks" in data:
                risks = data["litigation_risks"]
                print_success(f"Litigation Risk Score: {risks.get('risk_score', 'N/A')}")
                print_success(f"Potential Risks Identified: {len(risks.get('potential_risks', []))}")
                for risk in risks.get("potential_risks", []):
                    print(f"  • {risk}")
                print_success(f"Involved Parties: {risks.get('involved_parties', [])}")
                return True
            else:
                print_error("litigation_risks field not found in response")
                return False
        else:
            print_error(f"Request failed: {response.status_code}")
            print_response("Error", response.json())
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_fun_summary():
    """Test fun factual summary feature"""
    print_test("Fun Factual Case Summary")
    try:
        payload = {
            "query": "give me a fun simplified summary of this case",
            "context": {
                "case_details": SAMPLE_TAX_OBJECTION
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/query",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Query processed successfully")
            
            if "fun_summary" in data:
                print_success("Fun Summary Generated:")
                print(f"  {data['fun_summary']}")
                return True
            else:
                print_error("fun_summary field not found in response")
                print_response("Full Response", data)
                return False
        else:
            print_error(f"Request failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_swahili_gist():
    """Test Swahili gist feature"""
    print_test("Swahili Gist Interpretation")
    try:
        payload = {
            "query": "provide swahili gist of this case",
            "context": {
                "case_details": SAMPLE_TAX_OBJECTION
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/query",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Query processed successfully")
            
            if "swahili_gist" in data:
                print_success("Swahili Gist Generated:")
                print(f"  {data['swahili_gist']}")
                return True
            else:
                print_error("swahili_gist field not found in response")
                print_response("Full Response", data)
                return False
        else:
            print_error(f"Request failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_document_analysis():
    """Test document analysis with all three features"""
    print_test("Comprehensive Document Analysis")
    try:
        payload = {
            "file_content": SAMPLE_CONTRACT,
            "file_type": "txt"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/analyze-file",
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Document analyzed successfully")
            
            # Check for all new features
            features_found = []
            
            if "litigation_risks" in data:
                features_found.append("litigation_risks")
                risks = data["litigation_risks"]
                print_success(f"Litigation Risk Score: {risks.get('risk_score', 'N/A'):.2f}")
                
            if "fun_summary" in data:
                features_found.append("fun_summary")
                print_success(f"Fun Summary: {data['fun_summary'][:100]}...")
                
            if "swahili_gist" in data:
                features_found.append("swahili_gist")
                print_success(f"Swahili Gist: {data['swahili_gist'][:100]}...")
            
            print_success(f"All enhanced features detected: {', '.join(features_found)}")
            print_response("Full Analysis", data)
            return len(features_found) == 3
        else:
            print_error(f"Request failed: {response.status_code}")
            print_response("Error", response.json())
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all chatbot feature tests"""
    print_header("🚀 AI-JLSP CHATBOT FEATURE TESTING")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Service URL: {BASE_URL}")
    
    tests = [
        ("Health Check", test_health_check),
        ("Litigation Anticipation", test_litigation_analysis),
        ("Fun Summary", test_fun_summary),
        ("Swahili Gist", test_swahili_gist),
        ("Document Analysis", test_document_analysis),
    ]
    
    results = {}
    for test_name, test_func in tests:
        results[test_name] = test_func()
    
    # Print summary
    print_header("📊 TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{GREEN}PASSED{RESET}" if result else f"{RED}FAILED{RESET}"
        print(f"{test_name}: {status}")
    
    print(f"\n{BLUE}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}✓ All chatbot features are working correctly!{RESET}")
    else:
        print(f"\n{YELLOW}⚠ Some tests failed. Review the details above.{RESET}")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
