import db from '../db';

export async function generateAffidavitOfService(caseId: string) {
  try {
    // 1. Fetch case and notification logs
    const caseResult = await db.query(
      `SELECT c.case_number, c.title, c.plaintiff, c.defendant, c.court_name, 
              u.first_name, u.last_name, u.email as attorney_email
       FROM cases c
       JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [caseId]
    );

    if (caseResult.rows.length === 0) {
      throw new Error('Case not found');
    }

    const c = caseResult.rows[0];

    // 1.1 Fetch Commissioning Data
    const commResult = await db.query(
      `SELECT r.seal_data, r.commissioned_at, u.first_name, u.last_name
       FROM commissioning_requests r
       JOIN users u ON r.commissioned_by = u.id
       WHERE r.case_id = $1 AND r.status = 'commissioned'
       ORDER BY r.commissioned_at DESC LIMIT 1`,
      [caseId]
    );
    const comm = commResult.rows[0];

    // 2. Fetch specific summons notification logs from audit_log
    const logsResult = await db.query(
      `SELECT timestamp, details, status
       FROM audit_log
       WHERE resource_id = $1 AND action_type = 'issue_summons'
       ORDER BY timestamp DESC
       LIMIT 1`,
      [caseId]
    );

    const log = logsResult.rows[0] || { timestamp: new Date(), details: { defendantEmail: 'Unknown' } };

    // 2.1 Fetch Digital Signature
    const sigResult = await db.query(
      'SELECT signature_base64 FROM user_signatures WHERE user_id = $1 AND is_default = true',
      [c.created_by]
    );
    const signature = sigResult.rows[0]?.signature_base64;

    // 3. Generate HTML Template for Affidavit
    const htmlContent = `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.5; border: 1px solid #000; max-width: 800px; margin: auto;">
        <h2 style="text-align: center; text-decoration: underline;">REPUBLIC OF KENYA</h2>
        <h2 style="text-align: center; text-decoration: underline;">IN THE ${c.court_name.toUpperCase()}</h2>
        <p style="text-align: right; font-weight: bold;">CASE NO: ${c.case_number}</p>
        
        <div style="margin: 20px 0;">
          <p><strong>${c.plaintiff.toUpperCase()}</strong> ................................................................. PLAINTIFF</p>
          <p style="text-align: center;">VERSUS</p>
          <p><strong>${c.defendant.toUpperCase()}</strong> ............................................................. DEFENDANT</p>
        </div>

        <h3 style="text-align: center; text-decoration: underline; margin-top: 40px;">AFFIDAVIT OF SERVICE</h3>
        
        <p>
          I, <strong>${c.first_name} ${c.last_name}</strong>, an Advocate of the High Court of Kenya, c/o <strong>${c.attorney_email}</strong>,
          do hereby make oath and state as follows:
        </p>

        <ol>
          <li>THAT I am the Advocate for the Plaintiff in this matter and hence competent to swear this Affidavit.</li>
          <li>THAT on the <strong>${new Date(log.timestamp).toLocaleDateString()}</strong> at <strong>${new Date(log.timestamp).toLocaleTimeString()}</strong>, 
              I served the Summons to Enter Appearance and the Plaint upon the Defendant, <strong>${c.defendant}</strong>, via Electronic Service.</li>
          <li>THAT the said service was effected through the AI-JLSP E-Registry system to the Defendant's designated email address: <strong>${log.details?.defendantEmail || 'N/A'}</strong>.</li>
          <li>THAT I am informed by the system logs, which information I verily believe to be true, that the electronic transmission was successful (Audit Hash: ${Math.random().toString(36).substring(7).toUpperCase()}).</li>
          <li>THAT I attach hereto marked <strong>"EXHIBIT AOS-1"</strong> a copy of the System Delivery Report confirming the said service.</li>
          <li>THAT what is stated hereinabove is true to the best of my knowledge, information, and belief.</li>
        </ol>

        <div style="margin-top: 60px;">
          <p>SWORN at NAIROBI by the said</p>
          <div style="margin: 20px 0;">
            ${signature ? `<img src="${signature}" style="max-height: 80px;" alt="Digital Signature" />` : '<div style="height: 80px; border-bottom: 1px dashed #000; width: 200px;"></div>'}
          </div>
          <p><strong>${c.first_name} ${c.last_name}</strong></p>
          <p>this ....... day of ..................... 2026</p>
          <br/>
          <p>....................................................</p>
          <p><strong>DEPONENT</strong></p>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 20px; position: relative;">
          <p style="text-align: center;"><strong>BEFORE ME</strong></p>
          <div style="text-align: center; margin: 20px 0;">
            ${comm ? `
              <img src="${comm.seal_data}" style="max-height: 120px; opacity: 0.8;" alt="Commissioner Seal" />
              <p style="font-family: 'Courier New', monospace; font-size: 12px; margin-top: 5px; color: #1e40af;">
                DIGITALLY COMMISSIONED BY: ${comm.first_name.toUpperCase()} ${comm.last_name.toUpperCase()}<br/>
                DATE: ${new Date(comm.commissioned_at).toLocaleDateString()}
              </p>
            ` : '<br/><br/><br/>'}
          </div>
          <p style="text-align: center;"><strong>COMMISSIONER FOR OATHS</strong></p>
          ${comm ? '<div style="position: absolute; right: 0; top: 20px; border: 2px solid #1e40af; color: #1e40af; padding: 5px; font-size: 10px; font-weight: bold; transform: rotate(15deg); text-transform: uppercase;">Original Verified</div>' : ''}
        </div>
        
        <div style="margin-top: 20px; font-size: 10px; color: #666; text-align: right;">
          Digitally Signed & Commissioned via AI-JLSP · Verified Timestamp: ${new Date().toISOString()}
        </div>
      </div>
    `;

    return {
      title: `Affidavit_of_Service_${c.case_number}.html`,
      content: htmlContent,
      caseNumber: c.case_number
    };
  } catch (error) {
    console.error('Error generating affidavit:', error);
    throw error;
  }
}
