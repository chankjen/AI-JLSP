import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import db from '../db';

const router = Router();

// Get all conveyancing transactions
router.get('/', authenticateToken, checkPermission('view_conveyancing'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await db.query(
      `SELECT id, transaction_id, property_description, transaction_type, parties, status, 
              transaction_value, created_at
       FROM conveyancing_transactions
       WHERE created_by = $1 OR assigned_to = $1
       ORDER BY created_at DESC`,
      [req.user.sub]
    );

    return res.status(200).json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching conveyancing transactions:', error);
    return res.status(500).json({ error: 'Unable to fetch transactions' });
  }
});

// Get transaction details
router.get('/:id', authenticateToken, checkPermission('view_conveyancing'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, transaction_id, property_description, transaction_type, parties, status, 
              transaction_value, jurisdiction, created_at, contract_clauses
       FROM conveyancing_transactions
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get documents
    const docsResult = await db.query(
      `SELECT id, name, type, uploaded_at FROM conveyancing_documents WHERE transaction_id = $1`,
      [req.params.id]
    );

    return res.status(200).json({
      transaction: result.rows[0],
      documents: docsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching conveyancing transaction:', error);
    return res.status(500).json({ error: 'Unable to fetch transaction' });
  }
});

// Create new transaction
router.post('/', authenticateToken, checkPermission('manage_conveyancing'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { propertyDescription, transactionType, parties, transactionValue, jurisdiction } = req.body;

    if (!propertyDescription || !transactionType || !parties || !transactionValue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transactionId = `CONV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`;

    const result = await db.query(
      `INSERT INTO conveyancing_transactions (transaction_id, property_description, transaction_type, parties, transaction_value, jurisdiction, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, transaction_id, property_description, status, created_at`,
      [transactionId, propertyDescription, transactionType, parties, transactionValue, jurisdiction, 'pending_review', req.user.sub]
    );

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Unable to create transaction' });
  }
});

// Verify title
router.post('/:id/verify-title', authenticateToken, checkPermission('verify_titles'), async (req: AuthRequest, res) => {
  try {
    const { titleNumber } = req.body;

    if (!titleNumber) {
      return res.status(400).json({ error: 'Title number is required' });
    }

    // Query Ardhi Sasa (placeholder)
    const titleData = {
      titleNumber,
      owner: 'Property Owner Name',
      description: 'Property Description',
      plotNumber: '12345',
      area: '0.25 hectares',
      status: 'verified',
      lastUpdated: new Date().toISOString(),
    };

    const result = await db.query(
      `UPDATE conveyancing_transactions SET status = $1 WHERE id = $2 RETURNING *`,
      ['title_verified', req.params.id]
    );

    return res.status(200).json({
      message: 'Title verified successfully',
      titleData,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Error verifying title:', error);
    return res.status(500).json({ error: 'Unable to verify title' });
  }
});

export default router;
