import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { listAllowedActions } from '../services/rbacService';

const router = Router();

const DASHBOARD_TEMPLATES: Record<string, any> = {
  advocate: {
    title: 'Advocate Dashboard',
    widgets: [
      { key: 'active_cases', label: 'Open Filings', description: 'Track active client matters and deadlines' },
      { key: 'ai_validation', label: 'AI Prevalidation Tasks', description: 'Review draft documents flagged for legal compliance' },
      { key: 'document_search', label: 'Evidence Library', description: 'Search legal documents and precedent summaries' }
    ]
  },
  tdr_officer: {
    title: 'TDR Officer Dashboard',
    widgets: [
      { key: 'pending_objections', label: 'Pending Objections', description: 'Handle new tax dispute filings and ADR referrals' },
      { key: 'audit_alerts', label: 'Audit Flags', description: 'Monitor case audits and DPA compliance exceptions' },
      { key: 'case_assignment', label: 'Assigned Cases', description: 'Review cases assigned to your team' }
    ]
  },
  board_secretary: {
    title: 'Board Secretary Dashboard',
    widgets: [
      { key: 'board_meetings', label: 'Upcoming Meetings', description: 'Prepare board packages and minutes' },
      { key: 'document_approval', label: 'Document Approval', description: 'Sign off on board-ready documents' },
      { key: 'registry_overview', label: 'Registry Status', description: 'Track filings and procedural updates' }
    ]
  },
  litigation_counsel: {
    title: 'Litigation Counsel Dashboard',
    widgets: [
      { key: 'high_priority_cases', label: 'High Priority Cases', description: 'Focus on urgent court matters and disputes' },
      { key: 'evidence_review', label: 'Evidence Review', description: 'Validate exhibits and procedural compliance' },
      { key: 'ai_insights', label: 'AI Recommendations', description: 'Review model-backed case analysis' }
    ]
  },
  citizen: {
    title: 'Citizen Dashboard',
    widgets: [
      { key: 'my_cases', label: 'My Filings', description: 'Track your current legal requests and statuses' },
      { key: 'support_checklist', label: 'Submission Checklist', description: 'Confirm required information before filing' },
      { key: 'legal_guidance', label: 'Guidance', description: 'Access simplified civil procedure tips' }
    ]
  },
  admin: {
    title: 'Administrator Dashboard',
    widgets: [
      { key: 'system_health', label: 'System Health', description: 'Monitor platform availability and audit queue' },
      { key: 'user_management', label: 'User Management', description: 'Manage accounts, roles, and access policies' },
      { key: 'security_alerts', label: 'Security Alerts', description: 'Review compliance and operational events' }
    ]
  },
  dpo: {
    title: 'DPO Dashboard',
    widgets: [
      { key: 'consent_monitoring', label: 'Consent Status', description: 'Track active and withdrawn consents' },
      { key: 'breach_reports', label: 'Breach Notifications', description: 'Review open incidents and DPA timelines' },
      { key: 'dpia_overview', label: 'DPIA Reviews', description: 'Monitor high-risk processing assessments' }
    ]
  }
};

router.get('/', (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const role = req.user.role;
  const template = DASHBOARD_TEMPLATES[role] || DASHBOARD_TEMPLATES.citizen;

  return res.status(200).json({
    role,
    title: template.title,
    widgets: template.widgets,
    allowedActions: listAllowedActions(role)
  });
});

router.get('/menu', (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    role: req.user.role,
    menu: listAllowedActions(req.user.role)
  });
});

export default router;
