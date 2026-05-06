import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import db from '../db';
import { semanticSearch, explainProvision } from '../services/aiValidationService';

const router = Router();

// Semantic search across legal documents
router.get('/search', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // AI Semantic Search (RAG)
    const aiResults = await semanticSearch(query as string, type as string);

    // Track search history for User
    if (req.user) {
        await db.query(
          `INSERT INTO search_history (user_id, query, searched_at) VALUES ($1, $2, NOW())`,
          [req.user.sub, query]
        ).catch(e => console.error('Failed to track history:', e));
    }

    return res.status(200).json({
      results: aiResults.results || [],
      total: aiResults.results?.length || 0,
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

// Explain legal provision (AI RAG)
router.post('/explain', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const { provision_text, context } = req.body;

    if (!provision_text) {
      return res.status(400).json({ error: 'Provision text is required' });
    }

    const aiExplanation = await explainProvision(provision_text, context || '');

    return res.status(200).json({ explanation: aiExplanation.explanation });
  } catch (error) {
    console.error('Error explaining provision:', error);
    return res.status(500).json({ error: 'Unable to explain provision' });
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

// Compare two legal authorities (e.g. Local vs International)
router.post('/compare', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const { docId1, docId2 } = req.body;

    if (!docId1 || !docId2) {
      return res.status(400).json({ error: 'Two documents are required for comparison' });
    }

    // Import AI service
    const { compareLegalAuthorities } = await import('../services/aiValidationService');

    // Fetch documents to get content for AI (Mock or real DB)
    const doc1 = await db.query('SELECT title, content, type FROM legal_documents WHERE id = $1', [docId1]);
    const doc2 = await db.query('SELECT title, content, type FROM legal_documents WHERE id = $1', [docId2]);

    const comparison = await compareLegalAuthorities(
      doc1.rows[0] || { title: 'Local Precedent', content: 'Sample Content' },
      doc2.rows[0] || { title: 'International Treaty', content: 'Sample Content' }
    );

    return res.status(200).json(comparison);
  } catch (error) {
    console.error('Error comparing precedents:', error);
    return res.status(500).json({ error: 'Unable to compare legal authorities' });
  }
});

// Generate a formal Skeletal Argument based on comparison
router.post('/draft-argument', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const { doc1, doc2, comparison } = req.body;

    if (!doc1 || !doc2 || !comparison) {
      return res.status(400).json({ error: 'Incomplete comparison data' });
    }

    const { generateSkeletalArgument } = await import('../services/aiValidationService');
    const draft = await generateSkeletalArgument(doc1, doc2, comparison);

    return res.status(200).json({ draft });
  } catch (error) {
    console.error('Error drafting argument:', error);
    return res.status(500).json({ error: 'Unable to generate legal argument' });
  }
});

export default router;
