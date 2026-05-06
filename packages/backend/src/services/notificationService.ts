import axios from 'axios';
import nodemailer from 'nodemailer';

const odpcAPIUrl = process.env.ODPC_API_URL || 'https://api.odpc.go.ke';
const odpcApiKey = process.env.ODPC_API_KEY;

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

export async function sendBreachNotification(notification: {
  breachDate: Date;
  numberOfAffected: number;
  natureOfBreach: string;
  affectedPersonEmail?: string;
  organizationName: string;
  contactEmail: string;
  contactPhone: string;
}) {
  try {
    // Send to ODPC - 72 hour requirement
    const odpcResponse = await axios.post(`${odpcAPIUrl}/data-breaches`, {
      breachDate: notification.breachDate,
      numberOfAffected: notification.numberOfAffected,
      natureOfBreach: notification.natureOfBreach,
      organizationName: notification.organizationName,
      contactEmail: notification.contactEmail,
      contactPhone: notification.contactPhone,
      timestamp: new Date(),
    }, {
      headers: {
        'Authorization': `Bearer ${odpcApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Send to affected person (if email provided)
    if (notification.affectedPersonEmail) {
      await transporter.sendMail({
        from: process.env.NOTIFICATION_EMAIL || 'noreply@legaltech.ke',
        to: notification.affectedPersonEmail,
        subject: 'Important: Data Breach Notification',
        html: `
          <h2>Data Breach Notification</h2>
          <p>A data breach affecting your personal information has been detected and reported to ODPC.</p>
          <p><strong>Nature of breach:</strong> ${notification.natureOfBreach}</p>
          <p><strong>For more information, contact:</strong> ${notification.contactEmail}</p>
        `,
      });
    }

    return {
      success: true,
      odpcNotificationId: odpcResponse.data.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Breach notification error:', error);
    throw error;
  }
}

export async function sendCaseNotification(userId: string, message: string, caseId: string) {
  try {
    await transporter.sendMail({
      from: process.env.NOTIFICATION_EMAIL || 'noreply@legaltech.ke',
      to: userId,
      subject: `Case Update: ${caseId}`,
      html: `<p>${message}</p>`,
    });
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

export async function notifyComplianceBreach(alert: {
  userId: string;
  alertType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  metadata?: any;
}) {
  try {
    // Log to audit trail
    // Send notification to user
    await sendCaseNotification(
      alert.userId,
      `Compliance Alert: ${alert.description}`,
      `ALERT-${alert.severity.toUpperCase()}`
    );
  } catch (error) {
    console.error('Compliance notification error:', error);
  }
}
export async function sendSummonsNotification(params: {
  defendantEmail: string;
  defendantPhone?: string;
  caseNumber: string;
  plaintiffName: string;
  courtName: string;
  nextHearingDate?: string;
}) {
  try {
    // 1. Send Formal Email Summons (Rule 5 Civil Procedure Rules)
    await transporter.sendMail({
      from: process.env.NOTIFICATION_EMAIL || 'registry@judiciary.go.ke',
      to: params.defendantEmail,
      subject: `OFFICIAL COURT SUMMONS: ${params.caseNumber}`,
      html: `
        <div style="font-family: serif; border: 2px solid #1e293b; padding: 30px; border-radius: 4px; max-width: 600px; margin: auto;">
          <h1 style="color: #1e293b; text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 10px;">REPUBLIC OF KENYA</h1>
          <h2 style="color: #1e293b; text-align: center;">IN THE ${params.courtName.toUpperCase()}</h2>
          <p style="text-align: right; font-weight: bold;">CASE NO: ${params.caseNumber}</p>
          <hr />
          <p><strong>TO: ${params.defendantEmail}</strong></p>
          <p>TAKE NOTICE that a suit has been instituted against you by <strong>${params.plaintiffName}</strong>. You are hereby required within <strong>14 days</strong> from the date of service hereof to enter an appearance in the said suit.</p>
          <p>Should you fail to enter an appearance within the time mentioned, the Plaintiff may proceed with the suit and judgment may be given in your absence.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Registry Status:</strong> Summons Issued</p>
            ${params.nextHearingDate ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>First Mention:</strong> ${params.nextHearingDate}</p>` : ''}
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
            This is an official electronic service notification generated by the AI-JLSP Registry. 
            Verification Hash: ${Math.random().toString(36).substring(7).toUpperCase()}
          </p>
        </div>
      `,
    });

    // 2. Send Urgent SMS (Africa's Talking Mock)
    if (params.defendantPhone) {
      console.log(`[SMS] To: ${params.defendantPhone} - COURT SUMMONS: Case ${params.caseNumber} filed by ${params.plaintiffName}. You have 14 days to respond. Access details at judiciary.go.ke`);
    }

    return { success: true, timestamp: new Date() };
  } catch (error) {
    console.error('Summons notification error:', error);
    throw error;
  }
}

export async function sendEServiceConfirmation(params: {
  recipientEmail: string;
  recipientPhone?: string;
  caseNumber: string;
  documentType: string;
  filingDate: Date;
}) {
  try {
    // 1. Send Email (Rule 5 Civil Procedure Rules)
    await transporter.sendMail({
      from: process.env.NOTIFICATION_EMAIL || 'noreply@legaltech.ke',
      to: params.recipientEmail,
      subject: `E-Service: New Filing in ${params.caseNumber}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
          <h2 style="color: #1e40af;">Official E-Service Notification</h2>
          <p>This is an automated service notification from the AI-JLSP Registry.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Case Number:</strong> ${params.caseNumber}</p>
          <p><strong>Document Type:</strong> ${params.documentType}</p>
          <p><strong>Filing Date:</strong> ${params.filingDate.toLocaleDateString()}</p>
          <p>You can access the full document and respond via your dashboard.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/cases" 
             style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            View Case Dashboard
          </a>
        </div>
      `,
    });

    // 2. Send SMS Mock (DPA Sec 40)
    if (params.recipientPhone) {
      console.log(`[SMS MOCK] To: ${params.recipientPhone} - New ${params.documentType} filed in ${params.caseNumber}. View on JLSP.`);
    }

    return { success: true, timestamp: new Date() };
  } catch (error) {
    console.error('E-Service notification error:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export async function checkAndSendDeadlineReminders() {
  try {
    console.log('[Scheduler] Scanning for upcoming statutory deadlines...');
    
    const db = (await import('../db')).default;
    
    // Fetch cases with deadlines in the next 48 hours
    const result = await db.query(
      `SELECT c.id, c.case_number, c.title, c.deadline, u.email, u.phone_number
       FROM cases c
       JOIN users u ON c.filed_by = u.id
       WHERE c.deadline BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
       AND c.status != 'closed'`
    );

    for (const row of result.rows) {
      await sendCaseNotification(
        row.email,
        `Reminder: Statutory deadline for case ${row.case_number} (${row.title}) is on ${row.deadline.toLocaleDateString()}. Please ensure all filings are completed.`,
        row.case_number
      );
      
      if (row.phone_number) {
        console.log(`[SMS Reminder] To: ${row.phone_number} - Case ${row.case_number} deadline approaching: ${row.deadline.toLocaleDateString()}`);
      }
    }

    return { remindedCount: result.rows.length };
  } catch (error) {
    console.error('Error in deadline reminder worker:', error);
    throw error;
  }
}

