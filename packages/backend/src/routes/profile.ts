import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import db from '../db';

const router = Router();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      'SELECT first_name, last_name, email, role, lsk_number, firm_name, professional_address, advocate_phone, is_commissioner FROM users WHERE id = $1',
      [req.user?.sub]
    );
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Unable to fetch profile' });
  }
});

// Update profile details
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { first_name, last_name, lsk_number, firm_name, professional_address, advocate_phone } = req.body;
    
    await db.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, lsk_number = $3, firm_name = $4, professional_address = $5, advocate_phone = $6 
       WHERE id = $7`,
      [first_name, last_name, lsk_number, firm_name, professional_address, advocate_phone, req.user?.sub]
    );

    return res.status(200).json({ message: 'Professional profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
