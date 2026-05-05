import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { db } from '../db';

const router = Router();

// Get all cases for user
router.get('/', authenticateToken, checkPermission('view_cases'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await db.query(
      `SELECT id, case_number, title, status, filed_date, next_hearing, judge_name, case_type
       FROM cases 
       WHERE filed_by = $1 OR judge_id = $1
       ORDER BY filed_date DESC`,
      [req.user.sub]
    );

    return res.status(200).json({ cases: result.rows });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return res.status(500).json({ error: 'Unable to fetch cases' });
  }
});

// Get case details
router.get('/:id', authenticateToken, checkPermission('view_cases'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await db.query(
      `SELECT id, case_number, title, status, filed_date, next_hearing, judge_name, 
              case_type, description, parties, jurisdiction
       FROM cases 
       WHERE id = $1 AND (filed_by = $2 OR judge_id = $2)`,
      [req.params.id, req.user.sub]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get documents
    const docsResult = await db.query(
      `SELECT id, name, type, uploaded_at, status FROM case_documents WHERE case_id = $1`,
      [req.params.id]
    );

    // Get hearings
    const hearingsResult = await db.query(
      `SELECT id, hearing_date, hearing_time, hearing_type FROM case_hearings WHERE case_id = $1`,
      [req.params.id]
    );

    return res.status(200).json({
      case: result.rows[0],
      documents: docsResult.rows,
      hearings: hearingsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    return res.status(500).json({ error: 'Unable to fetch case' });
  }
});

// File new case
router.post('/', authenticateToken, checkPermission('file_case'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { caseTitle, caseType, parties, jurisdiction, description } = req.body;

    if (!caseTitle || !caseType || !parties || !jurisdiction) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const caseNumber = `JLSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000)}`;

    const result = await db.query(
      `INSERT INTO cases (case_number, title, case_type, parties, jurisdiction, description, status, filed_by, filed_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, case_number, title, status, filed_date`,
      [caseNumber, caseTitle, caseType, parties, jurisdiction, description, 'pending_validation', req.user.sub]
    );

    return res.status(201).json({
      message: 'Case filed successfully',
      case: result.rows[0],
    });
  } catch (error) {
    console.error('Error filing case:', error);
    return res.status(500).json({ error: 'Unable to file case' });
  }
});

// Upload case documents
router.post('/:id/documents', authenticateToken, checkPermission('manage_documents'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { documentName, documentType, fileUrl } = req.body;

    const result = await db.query(
      `INSERT INTO case_documents (case_id, name, type, file_url, status, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, type, status, uploaded_at`,
      [req.params.id, documentName, documentType, fileUrl, 'pending_review']
    );

    return res.status(201).json({
      message: 'Document uploaded successfully',
      document: result.rows[0],
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Unable to upload document' });
  }
});

// Get case documents
router.get('/:id/documents', authenticateToken, checkPermission('view_cases'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, type, file_url, status, uploaded_at FROM case_documents WHERE case_id = $1`,
      [req.params.id]
    );

    return res.status(200).json({ documents: result.rows });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Unable to fetch documents' });
  }
});

export default router;
