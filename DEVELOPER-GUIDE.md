# AI-JLSP Developer Implementation Guide

**Purpose**: Quick-start templates & code patterns for implementing the 10 features  
**Version**: 1.0  
**Date**: June 1, 2026  

---

## 📋 Quick Reference: Service Structure

### **Python Service Template** (packages/ai-service/app/services/)

```python
# services/new_service.py
"""
Service Name: [Your Service]
Purpose: [Brief description]
PRD Reference: [Section X.X]
DPA Compliance: [Data types processed]
"""

import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class YourNewService:
    """
    Implements [feature].
    
    Compliance Notes:
    - Human-in-the-loop required? YES/NO
    - Data retention: 7 years per DPA Sec 31
    - Audit logging: All decisions tracked
    """

    def __init__(self):
        """Initialize service with external dependencies"""
        self.db_connection = None  # PostgreSQL
        self.vector_store = None    # Qdrant
        self.cache = None            # Redis
        self.logger = logging.getLogger(__name__)

    async def main_operation(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point.
        
        Args:
            inputs: Request payload
            
        Returns:
            Response dict with keys:
            - status: 'success' or 'error'
            - data: Actual result
            - confidence_score: 0-1 (if AI-generated)
            - execution_time_ms: Duration
        """
        try:
            # Step 1: Validate inputs
            self._validate_inputs(inputs)
            
            # Step 2: Execute business logic
            result = await self._execute(inputs)
            
            # Step 3: Log audit trail
            await self._log_audit(inputs, result)
            
            return {
                "status": "success",
                "data": result,
                "execution_time_ms": 0,  # Calculate actual time
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Service failed: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    def _validate_inputs(self, inputs: Dict) -> None:
        """Validate request inputs"""
        required_fields = ["field1", "field2"]  # Customize per service
        for field in required_fields:
            if field not in inputs:
                raise ValueError(f"Missing required field: {field}")

    async def _execute(self, inputs: Dict) -> Any:
        """Core business logic - override in subclass"""
        raise NotImplementedError("Subclass must implement _execute()")

    async def _log_audit(self, inputs: Dict, result: Any) -> None:
        """Log to audit_log table for DPA compliance"""
        # Implementation: Insert into audit_log table
        pass
```

---

## 🗂️ PostgreSQL Schema Template

```sql
-- Migration: create_your_feature_table.sql
-- Date: 2026-06-XX
-- Description: [Feature description]

-- Main table
CREATE TABLE IF NOT EXISTS your_feature_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields
    case_id UUID REFERENCES cases(case_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Data fields (customize as needed)
    data_field_1 VARCHAR(255) NOT NULL,
    data_field_2 TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Status tracking
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    status_reason TEXT,
    
    -- AI-related fields (if applicable)
    ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    ai_model_version VARCHAR(50),
    requires_human_review BOOLEAN DEFAULT TRUE,
    human_reviewed_by UUID REFERENCES users(user_id),
    human_reviewed_at TIMESTAMP,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Compliance fields
    dpa_consent_id UUID REFERENCES dpa_consent_records(consent_id),
    audit_log_id UUID REFERENCES audit_log(id)
);

-- Indexes
CREATE INDEX idx_case_id ON your_feature_table(case_id);
CREATE INDEX idx_user_id ON your_feature_table(user_id);
CREATE INDEX idx_created_at ON your_feature_table(created_at DESC);
CREATE INDEX idx_status ON your_feature_table(status);

-- Immutable audit trigger
CREATE TRIGGER audit_trigger_your_feature_table
AFTER INSERT OR UPDATE OR DELETE ON your_feature_table
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Soft delete support
CREATE TRIGGER soft_delete_trigger_your_feature_table
BEFORE DELETE ON your_feature_table
FOR EACH ROW EXECUTE FUNCTION soft_delete_function();
```

---

## 🔌 Backend API Endpoint Template

```typescript
// packages/backend/src/routes/your-feature.ts

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { rbacCheck } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { AuditLog } from '../services/audit-log';

const router = Router();
const auditLog = new AuditLog();

/**
 * POST /api/your-feature
 * Create new [feature] record
 * 
 * Body: { field1: string, field2: string }
 * Response: { status: 'success', data: { id, ...} }
 * 
 * DPA Compliance:
 * - Requires explicit consent for data processing
 * - User must be authenticated
 * - Action logged to audit trail
 */
router.post(
    '/',
    authenticateToken,
    rbacCheck('YOUR_MODULE', 'CREATE'),
    validateRequest({
        body: {
            field1: 'string|required',
            field2: 'string|optional'
        }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { field1, field2 } = req.body;
            const userId = (req as any).user.id;

            // Call AI service if needed
            const result = await callAIService('your_operation', {
                field1,
                field2,
                user_id: userId
            });

            // Log to audit trail
            await auditLog.create({
                action: 'CREATE',
                module: 'YOUR_MODULE',
                entity_type: 'YourFeature',
                entity_id: result.id,
                user_id: userId,
                changes: { field1, field2 },
                timestamp: new Date()
            });

            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/your-feature/:id
 * Retrieve [feature] record
 */
router.get(
    '/:id',
    authenticateToken,
    rbacCheck('YOUR_MODULE', 'READ'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            // Query database
            const result = await db.query(
                'SELECT * FROM your_feature_table WHERE id = $1',
                [id]
            );

            if (!result.rows[0]) {
                return res.status(404).json({
                    status: 'error',
                    error: 'Record not found'
                });
            }

            res.json({
                status: 'success',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
```

---

## ⚛️ React Frontend Component Template

```typescript
// packages/frontend/components/YourFeature.tsx

'use client';

import { useState, useCallback } from 'react';
import { useForm } from '@/hooks/useForm';
import { useFetch } from '@/hooks/useFetch';
import { Card, Button, Input, Select } from '@/components/ui';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Toast } from '@/components/Toast';

interface YourFeatureProps {
  caseId: string;
  onSuccess?: (data: any) => void;
}

export function YourFeature({ caseId, onSuccess }: YourFeatureProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: {
      field1: '',
      field2: ''
    },
    onSubmit: handleFormSubmit
  });

  const { data, loading, error, fetchData } = useFetch();

  async function handleFormSubmit(values: any) {
    try {
      const response = await fetch('/api/your-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          case_id: caseId
        })
      });

      if (!response.ok) throw new Error('Failed to submit');

      const result = await response.json();
      
      setToastMessage('✅ Successfully created!');
      setShowToast(true);
      
      onSuccess?.(result.data);
      
      // Refetch or update state
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastMessage(`❌ Error: ${(err as Error).message}`);
      setShowToast(true);
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <Card title="Your Feature" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Field 1"
          name="field1"
          value={values.field1}
          onChange={handleChange}
          error={errors.field1}
          required
        />

        <Input
          label="Field 2"
          name="field2"
          value={values.field2}
          onChange={handleChange}
          error={errors.field2}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Submit'}
        </Button>
      </form>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </Card>
  );
}
```

---

## 🤖 AI Service FastAPI Endpoint Template

```python
# packages/ai-service/app/main.py (add to existing)

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/api/your-feature", tags=["your-feature"])


class YourFeatureRequest(BaseModel):
    """Incoming request schema"""
    field1: str = Field(..., description="Description of field1")
    field2: Optional[str] = Field(None, description="Optional field")
    case_id: str = Field(..., description="Case ID for context")


class YourFeatureResponse(BaseModel):
    """Outgoing response schema"""
    status: str
    data: dict
    confidence_score: Optional[float] = None
    execution_time_ms: float
    timestamp: str


@router.post("/process", response_model=YourFeatureResponse)
async def process_your_feature(
    request: YourFeatureRequest,
    background_tasks: BackgroundTasks
) -> YourFeatureResponse:
    """
    Process [feature] request.
    
    Compliance:
    - Logged to audit trail
    - Human review required for confidence < 0.8
    """
    try:
        import time
        start_time = time.time()

        # Step 1: Validate
        if not request.field1:
            raise HTTPException(status_code=400, detail="field1 required")

        # Step 2: Execute business logic
        from app.services.new_service import YourNewService
        service = YourNewService()
        result = await service.main_operation({
            "field1": request.field1,
            "field2": request.field2,
            "case_id": request.case_id
        })

        # Step 3: Background task for async processing
        if result.get('requires_human_review'):
            background_tasks.add_task(
                notify_for_review,
                case_id=request.case_id,
                result=result
            )

        execution_time_ms = (time.time() - start_time) * 1000

        return YourFeatureResponse(
            status="success",
            data=result.get('data'),
            confidence_score=result.get('confidence_score'),
            execution_time_ms=execution_time_ms,
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def notify_for_review(case_id: str, result: dict):
    """Background task to notify DPO for human review"""
    # Implementation: Send email/notification
    pass
```

---

## 🔄 Database Migration Template

```bash
# scripts/migrate_new_feature.sql
-- Run with: psql -U postgres -d ai_jlsp -f scripts/migrate_new_feature.sql

BEGIN TRANSACTION;

-- Create table
CREATE TABLE your_feature_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(case_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_your_feature_case_id ON your_feature_table(case_id);

-- Verify
SELECT * FROM your_feature_table LIMIT 0;

-- Audit log
INSERT INTO audit_log (action, module, entity_type, details)
VALUES ('CREATE_TABLE', 'MIGRATION', 'your_feature_table', '{"status": "completed"}');

COMMIT;
```

---

## 📊 Testing Template

```python
# packages/ai-service/tests/test_new_service.py

import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.new_service import YourNewService


@pytest.fixture
def service():
    return YourNewService()


@pytest.mark.asyncio
async def test_main_operation_success(service):
    """Test happy path"""
    inputs = {"field1": "test", "field2": "data"}
    result = await service.main_operation(inputs)
    
    assert result["status"] == "success"
    assert "data" in result
    assert result["execution_time_ms"] > 0


@pytest.mark.asyncio
async def test_main_operation_validation_error(service):
    """Test input validation"""
    inputs = {}  # Missing required fields
    result = await service.main_operation(inputs)
    
    assert result["status"] == "error"
    assert "error" in result


@pytest.mark.asyncio
async def test_audit_logging(service):
    """Test audit trail is created"""
    with patch.object(service, '_log_audit', new_callable=AsyncMock) as mock_audit:
        inputs = {"field1": "test"}
        await service.main_operation(inputs)
        
        mock_audit.assert_called_once()


def test_validate_inputs_success(service):
    """Test input validation passes"""
    service._validate_inputs({"field1": "test", "field2": "test"})
    # Should not raise


def test_validate_inputs_failure(service):
    """Test input validation fails"""
    with pytest.raises(ValueError):
        service._validate_inputs({"field1": "test"})  # Missing field2
```

---

## 📝 Documentation Template

```markdown
# [Feature Name]

## Overview
[Brief 1-paragraph description]

## Use Cases
1. [Use case 1]
2. [Use case 2]

## Architecture
```
[Simple diagram or description]
```

## API Reference

### POST /api/[feature]
Create new [feature]

**Request:**
```json
{
  "field1": "string",
  "field2": "string"
}
```

**Response:**
```json
{
  "status": "success",
  "data": { "id": "uuid", ... }
}
```

## Database Schema
[SQL table description]

## DPA Compliance
- [Compliance point 1]
- [Compliance point 2]

## Example Usage
```python
from app.services.new_service import YourNewService
service = YourNewService()
result = await service.main_operation({"field1": "test"})
```
```

---

## 🚀 Implementation Workflow

### For Each Feature:

1. **Skeleton Phase** (1 day)
   ```bash
   # Create service file with tests
   touch packages/ai-service/app/services/new_service.py
   touch packages/ai-service/tests/test_new_service.py
   
   # Create migration
   touch scripts/migrate_new_feature.sql
   
   # Create API routes
   touch packages/backend/src/routes/new-feature.ts
   
   # Create components
   touch packages/frontend/components/NewFeature.tsx
   ```

2. **Development Phase** (3-5 days)
   - Implement business logic
   - Add tests (aim for >80% coverage)
   - Create API endpoints
   - Build UI components

3. **Integration Phase** (2 days)
   - Connect to PostgreSQL
   - Integrate with Qdrant (if applicable)
   - Add audit logging
   - Test end-to-end

4. **Compliance Review** (1 day)
   - DPA compliance check
   - Security audit
   - Performance testing
   - Documentation

5. **Deployment** (1 day)
   - Merge to staging
   - UAT with stakeholders
   - Merge to production

---

## 🔗 Important Links

- **Repository Memory**: `/memories/repo/ai-jlsp-compliance-framework.md`
- **TRD**: `TRD.md` (Legal & technical requirements)
- **RBAC Policy**: `RBAC-POLICY.md` (Role-based access)
- **Compliance**: `COMPLIANCE.md` (DPA/Constitutional mapping)
- **Roadmap**: `IMPLEMENTATION-ROADMAP.md` (Feature timeline)

---

**Last Updated**: June 1, 2026  
**Version**: 1.0
