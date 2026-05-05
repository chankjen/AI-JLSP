import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import db from '../db';

const router = Router();

// Get all users
router.get('/users', authenticateToken, checkPermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, status, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    return res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Unable to fetch users' });
  }
});

// Get system statistics
router.get('/statistics', authenticateToken, checkPermission('view_admin'), async (req: AuthRequest, res) => {
  try {
    // Total users
    const usersResult = await db.query('SELECT COUNT(*) as total FROM users');

    // Active sessions
    const sessionsResult = await db.query('SELECT COUNT(*) as active FROM auth_sessions WHERE expires_at > NOW()');

    // System health
    const healthResult = await db.query('SELECT uptime_percentage FROM system_health ORDER BY created_at DESC LIMIT 1');

    // Last backup
    const backupResult = await db.query('SELECT backup_timestamp FROM backups ORDER BY backup_timestamp DESC LIMIT 1');

    return res.status(200).json({
      totalUsers: usersResult.rows[0]?.total || 0,
      activeSessions: sessionsResult.rows[0]?.active || 0,
      systemHealth: healthResult.rows[0]?.uptime_percentage || 99.8,
      lastBackup: backupResult.rows[0]?.backup_timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ error: 'Unable to fetch statistics' });
  }
});

// Create new user
router.post('/users', authenticateToken, checkPermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { email, firstName, lastName, role } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const result = await db.query(
      `INSERT INTO users (email, first_name, last_name, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, first_name, last_name, role, status`,
      [email, firstName, lastName, role, 'active']
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Unable to create user' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, checkPermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, role, status } = req.body;

    const result = await db.query(
      `UPDATE users SET first_name = COALESCE($1, first_name), 
                        last_name = COALESCE($2, last_name),
                        role = COALESCE($3, role),
                        status = COALESCE($4, status)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, status`,
      [firstName || null, lastName || null, role || null, status || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Unable to update user' });
  }
});

// Disable user
router.post('/users/:id/disable', authenticateToken, checkPermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `UPDATE users SET status = 'inactive' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'User disabled successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error disabling user:', error);
    return res.status(500).json({ error: 'Unable to disable user' });
  }
});

export default router;
