import db from '../db';

// Dashboard helpers
export async function getUserDashboardStats(userId: string) {
  try {
    const [caseCount, pendingActions, complianceScore, documentsProcessed] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM cases WHERE filed_by = $1 OR judge_id = $1', [userId]),
      db.query('SELECT COUNT(*) as count FROM dashboard_actions WHERE assigned_to = $1 AND completed = false', [userId]),
      db.query('SELECT ROUND(AVG(compliance_score)::numeric, 1) as score FROM compliance_audit WHERE reviewed_by = $1', [userId]),
      db.query('SELECT COUNT(*) as count FROM case_documents WHERE status = $1', ['validated']),
    ]);

    return {
      activeCases: caseCount.rows[0]?.count || 0,
      pendingActions: pendingActions.rows[0]?.count || 0,
      complianceScore: complianceScore.rows[0]?.score || 98,
      documentsProcessed: documentsProcessed.rows[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { activeCases: 0, pendingActions: 0, complianceScore: 0, documentsProcessed: 0 };
  }
}

export async function getRecentActivity(userId: string) {
  try {
    const result = await db.query(
      `SELECT type, description, timestamp, related_id
       FROM activity_log
       WHERE user_id = $1 OR resource_owner = $1
       ORDER BY timestamp DESC
       LIMIT 10`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

// Case helpers
export async function getCaseStatistics() {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'pending_validation') as pending,
        COUNT(*) FILTER (WHERE status = 'closed') as closed,
        COUNT(*) as total
       FROM cases`
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching case statistics:', error);
    return { active: 0, pending: 0, closed: 0, total: 0 };
  }
}

// TDR helpers
export async function getTDRStatistics() {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'filed') as total,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        SUM(amount_disputed)::bigint as total_amount
       FROM tax_disputes`
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching TDR statistics:', error);
    return { total: 0, under_review: 0, total_amount: 0 };
  }
}

// Conveyancing helpers
export async function getConveyancingStatistics() {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending_review') as pending,
        COUNT(*) FILTER (WHERE status = 'title_verified') as verified,
        COUNT(*) as total
       FROM conveyancing_transactions`
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching conveyancing statistics:', error);
    return { pending: 0, verified: 0, total: 0 };
  }
}

// Compliance helpers
export async function getComplianceScore() {
  try {
    const result = await db.query(
      `SELECT ROUND(AVG(compliance_score)::numeric, 1) as avg_score
       FROM compliance_audit`
    );

    return result.rows[0]?.avg_score || 0;
  } catch (error) {
    console.error('Error fetching compliance score:', error);
    return 0;
  }
}

export async function getActiveAlerts() {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM compliance_alerts WHERE resolved_at IS NULL`
    );

    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return 0;
  }
}

// Admin helpers
export async function getUserStatistics() {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive
       FROM users`
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return { total: 0, active: 0, inactive: 0 };
  }
}

export async function getActiveSessions() {
  try {
    const result = await db.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM auth_sessions WHERE expires_at > NOW()`
    );

    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return 0;
  }
}
