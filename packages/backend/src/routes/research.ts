import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import db from '../db';

const router = Router();

// Semantic search across legal documents
router.get('/search', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Simple full-text search on statutes and case law
    const result = await db.query(
      `SELECT id, title, type, content, source, updated_at
       FROM legal_documents
       WHERE (title ILIKE $1 OR content ILIKE $1)
       AND ($2::text IS NULL OR type = $2)
       ORDER BY updated_at DESC
       LIMIT 20`,
      [`%${query}%`, type || null]
    );

    return res.status(200).json({
      results: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return res.status(500).json({ error: 'Unable to search documents' });
  }
});

// Get statute details
router.get('/statute/:id', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, content, act_name, section, amendments, judicial_interpretations
       FROM legal_documents
       WHERE id = $1 AND type = 'statute'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Statute not found' });
    }

    return res.status(200).json({ statute: result.rows[0] });
  } catch (error) {
    console.error('Error fetching statute:', error);
    return res.status(500).json({ error: 'Unable to fetch statute' });
  }
});

// Get case law
router.get('/cases/:id', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, court, judgment_date, ratio_decidendi, holdings, citations
       FROM legal_documents
       WHERE id = $1 AND type = 'case_law'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    return res.status(200).json({ caselaw: result.rows[0] });
  } catch (error) {
    console.error('Error fetching case law:', error);
    return res.status(500).json({ error: 'Unable to fetch case law' });
  }
});

// Get recent searches (for history)
router.get('/searches/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await db.query(
      `SELECT DISTINCT query, COUNT(*) as count, MAX(searched_at) as last_searched
       FROM search_history
       WHERE user_id = $1
       GROUP BY query
       ORDER BY last_searched DESC
       LIMIT 10`,
      [req.user.sub]
    );

    return res.status(200).json({ searches: result.rows });
  } catch (error) {
    console.error('Error fetching search history:', error);
    return res.status(500).json({ error: 'Unable to fetch search history' });
  }
});

export default router;
