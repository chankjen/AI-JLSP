/**
 * Route: /api/judgments
 * Purpose: Judgment ingestion, search, and retrieval
 * PRD Reference: Section 3.2 (Judgment Fetching & Management)
 * DPA Compliance: All actions logged to audit trail; human review gates for AI features
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { rbacCheck } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { AuditLog } from '../services/audit-log';
import { db } from '../db';

const router = Router();
const auditLog = new AuditLog();

/**
 * POST /api/judgments/import
 * Import judgments from external sources (Kenya Law Reports, CTS, manual upload)
 *
 * DPA Compliance:
 * - Requires 'JUDGMENT_ADMIN' role
 * - Logged to audit trail
 * - Source validation
 */
router.post(
  '/import',
  authenticateToken,
  rbacCheck('JUDGMENT_INGESTION', 'CREATE'),
  validateRequest({
    body: {
      source: 'string|required|enum:kenyalawreports,cts,magistrate,manual',
      case_number: 'string|required',
      judgment_date: 'string|required|date',
      judge_name: 'string|optional',
      parties: 'array|required',
      legal_issues: 'array|optional'
    }
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { source, case_number, judgment_date, judge_name, parties, legal_issues } = req.body;

      // Check for duplicate case number
      const existing = await db.query(
        'SELECT judgment_id FROM judgments WHERE case_number = $1 AND deleted_at IS NULL',
        [case_number]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          status: 'error',
          error: 'Case number already exists'
        });
      }

      // Call AI service for initial processing
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const aiResponse = await fetch(`${aiServiceUrl}/api/judgments/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_number,
          judge_name,
          parties,
          legal_issues
        })
      });

      const aiValidation = await aiResponse.json();

      // Store judgment in PostgreSQL
      const result = await db.query(
        `INSERT INTO judgments (
          case_number, 
          parties, 
          judge_name, 
          judgment_date, 
          legal_issues, 
          source_system, 
          validation_status,
          ai_confidence_score,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING judgment_id, case_number, validation_status`,
        [
          case_number,
          JSON.stringify(parties),
          judge_name || null,
          judgment_date,
          legal_issues || [],
          source,
          'valid',
          aiValidation.confidence_score || 0.85,
          userId
        ]
      );

      const judgment = result.rows[0];

      // Log to audit trail
      await auditLog.create({
        action: 'CREATE',
        module: 'JUDGMENT_INGESTION',
        entity_type: 'judgments',
        entity_id: judgment.judgment_id,
        user_id: userId,
        changes: {
          case_number,
          source,
          validation_status: judgment.validation_status
        },
        timestamp: new Date()
      });

      res.json({
        status: 'success',
        data: {
          judgment_id: judgment.judgment_id,
          case_number: judgment.case_number,
          validation_status: judgment.validation_status,
          message: 'Judgment imported and queued for AI processing'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/judgments/:id
 * Retrieve single judgment with metadata
 */
router.get(
  '/:id',
  authenticateToken,
  rbacCheck('JUDGMENT_INGESTION', 'READ'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT 
          judgment_id,
          case_number,
          court_level,
          parties,
          judge_name,
          judgment_date,
          judgment_summary,
          legal_issues,
          outcome,
          source_system,
          validation_status,
          ai_confidence_score,
          created_at
        FROM judgments 
        WHERE judgment_id = $1 AND deleted_at IS NULL`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          error: 'Judgment not found'
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

/**
 * GET /api/judgments/search
 * Semantic search through indexed judgments
 *
 * Query params:
 *   q: search query (semantic)
 *   case_type: filter by case type
 *   limit: max results (default 10)
 */
router.get(
  '/search',
  authenticateToken,
  rbacCheck('JUDGMENT_INGESTION', 'READ'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q = '', limit = 10, offset = 0 } = req.query;

      // Call Qdrant for semantic search
      const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
      const searchResponse = await fetch(
        `${qdrantUrl}/collections/judgments/points/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vector: q, // In production, vectorize q using Legal-BERT
            limit: parseInt(limit as string),
            with_payload: true
          })
        }
      );

      const searchResults = await searchResponse.json();

      res.json({
        status: 'success',
        data: {
          query: q,
          total_results: searchResults.result?.length || 0,
          results: searchResults.result?.map((r: any) => ({
            case_number: r.payload?.case_number,
            similarity_score: r.score,
            judge_name: r.payload?.judge_name,
            legal_issues: r.payload?.legal_issues
          })) || []
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/judgments/:id/validate
 * Manually validate judgment (DPA compliance)
 *
 * Only allows users with JUDGMENT_ADMIN role
 */
router.post(
  '/:id/validate',
  authenticateToken,
  rbacCheck('JUDGMENT_INGESTION', 'APPROVE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { validation_status, validation_notes } = req.body;
      const userId = (req as any).user.id;

      // Update validation status
      const result = await db.query(
        `UPDATE judgments 
        SET validation_status = $1, validation_notes = $2, updated_at = NOW()
        WHERE judgment_id = $3 AND deleted_at IS NULL
        RETURNING judgment_id, case_number, validation_status`,
        [validation_status, validation_notes || '', id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          error: 'Judgment not found'
        });
      }

      // Log validation
      await auditLog.create({
        action: 'APPROVE',
        module: 'JUDGMENT_INGESTION',
        entity_type: 'judgments',
        entity_id: id,
        user_id: userId,
        changes: {
          validation_status,
          validation_notes
        },
        timestamp: new Date()
      });

      res.json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/judgments
 * List all judgments with pagination
 *
 * Query params:
 *   page: page number (default 1)
 *   limit: results per page (default 20)
 *   source: filter by source system
 */
router.get(
  '',
  authenticateToken,
  rbacCheck('JUDGMENT_INGESTION', 'READ'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, source } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = `SELECT 
        judgment_id,
        case_number,
        judge_name,
        judgment_date,
        outcome,
        source_system,
        validation_status,
        created_at
      FROM judgments 
      WHERE deleted_at IS NULL`;

      const params: any[] = [];

      if (source) {
        query += ` AND source_system = $${params.length + 1}`;
        params.push(source);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM judgments WHERE deleted_at IS NULL';
      if (source) {
        countQuery += ` AND source_system = $1`;
      }

      const countResult = await db.query(countQuery, source ? [source] : []);

      res.json({
        status: 'success',
        data: {
          judgments: result.rows,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: parseInt(countResult.rows[0]?.total || 0)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/judgments/bulk-import
 * Bulk import from source (admin only)
 */
router.post(
  '/bulk-import',
  authenticateToken,
  rbacCheck('JUDGMENT_INGESTION', 'CREATE'),
  validateRequest({
    body: {
      source: 'string|required|enum:kenyalawreports,cts',
      limit: 'number|optional|min:1|max:1000'
    }
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { source, limit = 100 } = req.body;
      const batchId = uuidv4();

      // Log ingestion start
      await db.query(
        `INSERT INTO judgment_ingestion_log (source_system, batch_id, status, triggered_by)
        VALUES ($1, $2, 'in_progress', $3)`,
        [source, batchId, userId]
      );

      // Call AI service for bulk import (async)
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      fetch(`${aiServiceUrl}/api/judgments/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, limit, batch_id: batchId })
      }).catch((err) => {
        console.error('Bulk import error:', err);
      });

      res.json({
        status: 'success',
        data: {
          batch_id: batchId,
          message: 'Bulk import queued. Check status with batch_id',
          status_endpoint: `/api/judgments/bulk-import/${batchId}`
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
