import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import db from '../db';

const router = Router();

// Save digital signature
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { signature } = req.body;

    if (!signature) {
      return res.status(400).json({ error: 'Signature data is required' });
    }

    // Reset other defaults
    await db.query('UPDATE user_signatures SET is_default = false WHERE user_id = $1', [req.user.sub]);

    const result = await db.query(
      'INSERT INTO user_signatures (user_id, signature_base64) VALUES ($1, $2) RETURNING id',
      [req.user.sub, signature]
    );

    return res.status(201).json({
      message: 'Digital signature saved successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error saving signature:', error);
    return res.status(500).json({ error: 'Unable to save signature' });
  }
});

// Get current signature
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await db.query(
      'SELECT signature_base64 FROM user_signatures WHERE user_id = $1 AND is_default = true',
      [req.user.sub]
    );

    return res.status(200).json({
      signature: result.rows[0]?.signature_base64 || null
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    return res.status(500).json({ error: 'Unable to fetch signature' });
  }
});

export default router;
