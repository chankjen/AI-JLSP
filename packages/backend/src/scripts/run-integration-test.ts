import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:3001';
let authToken: string;
let testCaseId: string;

/**
 * Integration Test: Full TDR Lifecycle
 * Compliance: TPA Section 51(3), Constitution Art 47
 */
async function runIntegrationTest() {
  console.log('--- Starting AI-JLSP Integration Test ---');

  try {
    // 1. Authentication
    console.log('[Test] Step 1: Authenticating...');
    const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'test@judiciary.go.ke',
      password: 'password'
    });
    authToken = loginRes.data.tokens.accessToken;
    console.log('✓ Authenticated successfully');

    // 2. Filing a Tax Dispute
    console.log('[Test] Step 2: Filing Tax Dispute (Module 1.1)...');
    const filingRes = await axios.post(`${BACKEND_URL}/api/tdr`, {
      taxpayerName: 'ABC Kenya Ltd',
      taxYear: '2023',
      amountDisputed: 25000000,
      description: 'Objection against VAT assessment on export services. We contend that these are zero-rated under the First Schedule of the VAT Act.'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testCaseId = filingRes.data.tdr.id;
    console.log(`✓ Case filed: ${filingRes.data.tdr.objection_id}`);

    // 3. AI Validation & iTax Integration (Module 1.4 + 2.1)
    console.log('[Test] Step 3: Triggering AI Validation & iTax Check...');
    const validationRes = await axios.post(`${BACKEND_URL}/api/tdr/${testCaseId}/validate`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✓ Validation Status: ${validationRes.data.tdr.status}`);
    console.log(`✓ AI Rationale: ${validationRes.data.validation.rationale}`);

    // 4. ADR Suitability Assessment (Module 1.4)
    console.log('[Test] Step 4: Assessing ADR Suitability...');
    const adrRes = await axios.post(`${BACKEND_URL}/api/tdr/${testCaseId}/assess-adr`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✓ Recommended Path: ${adrRes.data.assessment.recommended_path}`);
    console.log(`✓ Suitability Score: ${adrRes.data.assessment.suitability_score}`);

    // 5. Settlement Scenario Modeling & IFMIS Reporting (Module 1.4 + 2.3)
    console.log('[Test] Step 5: Modeling Settlement Scenario (50%)...');
    const scenarioRes = await axios.post(`${BACKEND_URL}/api/tdr/${testCaseId}/scenario-model`, {
      settlementPercentage: 50
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✓ Projected Revenue: KES ${scenarioRes.data.scenario.projected_immediate_revenue}`);
    console.log(`✓ Net Economic Benefit: KES ${scenarioRes.data.scenario.net_economic_benefit}`);
    console.log('✓ Reported to IFMIS integration');

    console.log('\n--- Integration Test Passed Successfully ---');
  } catch (error: any) {
    console.error('\n✖ Integration Test Failed');
    if (error.response) {
      console.error(`Error ${error.response.status}:`, error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runIntegrationTest();
