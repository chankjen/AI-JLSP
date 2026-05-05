import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import db from '../db';

const router = Router();

// Get all board meetings
router.get('/meetings', authenticateToken, checkPermission('view_board'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, meeting_id, meeting_date, meeting_time, title, attendees, status, created_at
       FROM board_meetings
       ORDER BY meeting_date DESC`
    );

    return res.status(200).json({ meetings: result.rows });
  } catch (error) {
    console.error('Error fetching board meetings:', error);
    return res.status(500).json({ error: 'Unable to fetch meetings' });
  }
});

// Get meeting details
router.get('/meetings/:id', authenticateToken, checkPermission('view_board'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, meeting_id, meeting_date, meeting_time, title, attendees, agenda, status, created_at
       FROM board_meetings
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Get documents
    const docsResult = await db.query(
      `SELECT id, name, type, uploaded_at FROM board_documents WHERE meeting_id = $1`,
      [req.params.id]
    );

    // Get action items
    const actionsResult = await db.query(
      `SELECT id, action_item, assigned_to, due_date, status FROM board_actions WHERE meeting_id = $1`,
      [req.params.id]
    );

    return res.status(200).json({
      meeting: result.rows[0],
      documents: docsResult.rows,
      actionItems: actionsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching board meeting:', error);
    return res.status(500).json({ error: 'Unable to fetch meeting' });
  }
});

// Schedule new meeting
router.post('/meetings', authenticateToken, checkPermission('manage_board'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { meetingDate, meetingTime, title, attendees } = req.body;

    if (!meetingDate || !meetingTime || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const meetingId = `BOARD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    const result = await db.query(
      `INSERT INTO board_meetings (meeting_id, meeting_date, meeting_time, title, attendees, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, meeting_id, meeting_date, meeting_time, title, status`,
      [meetingId, meetingDate, meetingTime, title, JSON.stringify(attendees), 'scheduled', req.user.sub]
    );

    return res.status(201).json({
      message: 'Meeting scheduled successfully',
      meeting: result.rows[0],
    });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    return res.status(500).json({ error: 'Unable to schedule meeting' });
  }
});

import { generateBoardAgenda, extractMeetingMinutes } from '../services/aiValidationService';

// Generate agenda
router.post('/meetings/:id/generate-agenda', authenticateToken, checkPermission('manage_board'), async (req: AuthRequest, res) => {
  try {
    const { agenda } = req.body;

    if (!agenda || !Array.isArray(agenda)) {
      return res.status(400).json({ error: 'Agenda items are required as an array' });
    }

    const meetingResult = await db.query('SELECT title FROM board_meetings WHERE id = $1', [req.params.id]);
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // AI Prioritization (Good Governance)
    const aiResults = await generateBoardAgenda({
      title: meetingResult.rows[0].title,
      current_agenda: agenda
    });

    const result = await db.query(
      `UPDATE board_meetings SET agenda = $1, ai_rationale = $2 WHERE id = $3 RETURNING *`,
      [JSON.stringify(aiResults.prioritized_agenda), aiResults.rationale, req.params.id]
    );

    return res.status(200).json({
      message: 'Agenda generated and prioritized by AI',
      agenda: aiResults.prioritized_agenda,
      rationale: aiResults.rationale,
      meeting: result.rows[0],
    });
  } catch (error) {
    console.error('Error generating agenda:', error);
    return res.status(500).json({ error: 'Unable to generate agenda' });
  }
});

// Upload board documents
router.post('/meetings/:id/documents', authenticateToken, checkPermission('manage_board'), async (req: AuthRequest, res) => {
  try {
    const { documentName, documentType, fileUrl } = req.body;

    const result = await db.query(
      `INSERT INTO board_documents (meeting_id, name, type, file_url, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, type, uploaded_at`,
      [req.params.id, documentName, documentType, fileUrl]
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


// Extract minutes
router.post('/meetings/:id/extract-minutes', authenticateToken, checkPermission('manage_board'), async (req: AuthRequest, res) => {
  try {
    const { meetingNotes } = req.body;

    if (!meetingNotes) {
      return res.status(400).json({ error: 'Meeting notes are required' });
    }

    // Call AI Minute Extractor (Accountability & Good Governance)
    const extractionResults = await extractMeetingMinutes(meetingNotes);

    const result = await db.query(
      `UPDATE board_meetings SET summary = $1, action_items = $2, ai_rationale = $3 WHERE id = $4 RETURNING *`,
      [
        extractionResults.summary, 
        JSON.stringify(extractionResults.action_items), 
        extractionResults.rationale, 
        req.params.id
      ]
    );

    return res.status(200).json({
      message: 'Minutes extracted and summarized by AI',
      summary: extractionResults.summary,
      actionItems: extractionResults.action_items,
      rationale: extractionResults.rationale,
      meeting: result.rows[0],
    });
  } catch (error) {
    console.error('Error extracting minutes:', error);
    return res.status(500).json({ error: 'Unable to extract minutes' });
  }
});

export default router;
