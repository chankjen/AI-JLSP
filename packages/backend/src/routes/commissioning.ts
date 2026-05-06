import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import db from '../db';

const router = Router();

// Submit for Commissioning
router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { caseId, documentType } = req.body;

    const result = await db.query(
      'INSERT INTO commissioning_requests (case_id, document_type, requested_by) VALUES ($1, $2, $3) RETURNING id',
      [caseId, documentType, req.user.sub]
    );

    return res.status(201).json({
      message: 'Document submitted for commissioning',
      requestId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error requesting commissioning:', error);
    return res.status(500).json({ error: 'Unable to submit request' });
  }
});

// Get pending requests (for commissioners)
router.get('/pending', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userResult = await db.query('SELECT is_commissioner FROM users WHERE id = $1', [req.user?.sub]);
    if (!userResult.rows[0]?.is_commissioner) {
      return res.status(403).json({ error: 'Access denied: Requires Commissioner for Oaths status' });
    }

    const result = await db.query(`
      SELECT r.id, r.document_type, r.created_at, c.case_number, c.title, u.first_name, u.last_name
      FROM commissioning_requests r
      JOIN cases c ON r.case_id = c.id
      JOIN users u ON r.requested_by = u.id
      WHERE r.status = 'pending'
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return res.status(500).json({ error: 'Unable to fetch requests' });
  }
});

// Seal/Commission a document
router.post('/:id/seal', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const commissionerId = req.user?.sub;
    const userResult = await db.query('SELECT is_commissioner, commissioner_seal_base64 FROM users WHERE id = $1', [commissionerId]);
    
    if (!userResult.rows[0]?.is_commissioner) {
      return res.status(403).json({ error: 'Only authorized Commissioners can seal documents' });
    }

    const sealData = userResult.rows[0].commissioner_seal_base64;
    if (!sealData) {
      return res.status(400).json({ error: 'Commissioner seal profile incomplete. Please upload your seal first.' });
    }

    await db.query(
      `UPDATE commissioning_requests 
       SET status = 'commissioned', commissioned_by = $1, commissioned_at = NOW(), seal_data = $2
       WHERE id = $3`,
      [commissionerId, sealData, req.params.id]
    );

    return res.status(200).json({ message: 'Document digitally sealed and commissioned successfully' });
  } catch (error) {
    console.error('Error sealing document:', error);
    return res.status(500).json({ error: 'Failed to commission document' });
  }
});

export default router;
