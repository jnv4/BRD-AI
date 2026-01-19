import { query, getClient } from '../db/connection.js';

// Transform database row to frontend BRD format
const transformBrdRow = (row) => ({
  id: row.id,
  projectName: row.project_name,
  preparedBy: row.prepared_by,
  date: row.date,
  version: row.version,
  status: row.status,
  content: row.content || {},
  rejectionComment: row.rejection_comment,
  audit: row.audit,
  isVerified: row.is_verified,
  verificationHistory: row.verification_history || [],
  logs: row.logs || [],
  lastModified: row.last_modified,
  // Extended fields
  approvalsYes: row.approvals_yes,
  approvalsNo: row.approvals_no,
  finalDecision: row.final_decision,
});

// Get all BRDs
export const getAllBrds = async () => {
  const result = await query(
    'SELECT * FROM brds ORDER BY last_modified DESC NULLS LAST, created_at DESC'
  );
  return result.rows.map(transformBrdRow);
};

// Get BRD by ID
export const getBrdById = async (id) => {
  const result = await query('SELECT * FROM brds WHERE id = $1', [id]);
  return result.rows[0] ? transformBrdRow(result.rows[0]) : null;
};

// Create new BRD
export const createBrd = async (brdData) => {
  const {
    id,
    projectName,
    preparedBy,
    date,
    version = 1,
    status = 'Draft',
    content = {},
    logs = [],
    lastModified = Date.now(),
    isVerified = false,
    verificationHistory = [],
  } = brdData;

  const result = await query(
    `INSERT INTO brds (
      id, project_name, prepared_by, date, version, status, 
      content, logs, last_modified, is_verified, verification_history
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id,
      projectName,
      preparedBy,
      date,
      version,
      status,
      JSON.stringify(content),
      JSON.stringify(logs),
      lastModified,
      isVerified,
      JSON.stringify(verificationHistory),
    ]
  );

  return transformBrdRow(result.rows[0]);
};

// Update BRD
export const updateBrd = async (id, updates) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Get current BRD
    const currentResult = await client.query('SELECT * FROM brds WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      throw new Error('BRD not found');
    }
    
    const current = currentResult.rows[0];
    
    // Merge updates
    const updated = {
      project_name: updates.projectName ?? current.project_name,
      prepared_by: updates.preparedBy ?? current.prepared_by,
      date: updates.date ?? current.date,
      version: updates.version ?? current.version,
      status: updates.status ?? current.status,
      content: updates.content ? JSON.stringify(updates.content) : current.content,
      rejection_comment: updates.rejectionComment ?? current.rejection_comment,
      audit: updates.audit ? JSON.stringify(updates.audit) : current.audit,
      is_verified: updates.isVerified ?? current.is_verified,
      verification_history: updates.verificationHistory 
        ? JSON.stringify(updates.verificationHistory) 
        : current.verification_history,
      logs: updates.logs ? JSON.stringify(updates.logs) : current.logs,
      last_modified: updates.lastModified ?? Date.now(),
      approvals_yes: updates.approvalsYes ?? current.approvals_yes,
      approvals_no: updates.approvalsNo ?? current.approvals_no,
      final_decision: updates.finalDecision ?? current.final_decision,
    };

    const result = await client.query(
      `UPDATE brds SET 
        project_name = $1, prepared_by = $2, date = $3, version = $4, 
        status = $5, content = $6, rejection_comment = $7, audit = $8,
        is_verified = $9, verification_history = $10, logs = $11, 
        last_modified = $12, approvals_yes = $13, approvals_no = $14, 
        final_decision = $15
      WHERE id = $16
      RETURNING *`,
      [
        updated.project_name,
        updated.prepared_by,
        updated.date,
        updated.version,
        updated.status,
        updated.content,
        updated.rejection_comment,
        updated.audit,
        updated.is_verified,
        updated.verification_history,
        updated.logs,
        updated.last_modified,
        updated.approvals_yes,
        updated.approvals_no,
        updated.final_decision,
        id,
      ]
    );
    
    await client.query('COMMIT');
    return transformBrdRow(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Update approval counts
export const updateBrdApproval = async (id, approvalType) => {
  const column = approvalType === 'yes' ? 'approvals_yes' : 'approvals_no';
  
  const result = await query(
    `UPDATE brds SET ${column} = ${column} + 1, last_modified = $1 
     WHERE id = $2 
     RETURNING *`,
    [Date.now(), id]
  );
  
  return result.rows[0] ? transformBrdRow(result.rows[0]) : null;
};

// Set final decision
export const setFinalDecision = async (id, decision) => {
  const result = await query(
    `UPDATE brds SET final_decision = $1, last_modified = $2 
     WHERE id = $3 
     RETURNING *`,
    [decision, Date.now(), id]
  );
  
  return result.rows[0] ? transformBrdRow(result.rows[0]) : null;
};

// Delete BRD
export const deleteBrd = async (id) => {
  const result = await query('DELETE FROM brds WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

// Get BRDs by status
export const getBrdsByStatus = async (status) => {
  const result = await query(
    'SELECT * FROM brds WHERE status = $1 ORDER BY last_modified DESC',
    [status]
  );
  return result.rows.map(transformBrdRow);
};

// Get BRD statistics
export const getBrdStats = async () => {
  const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'Draft') as draft,
      COUNT(*) FILTER (WHERE status = 'Pending Verification') as pending_verification,
      COUNT(*) FILTER (WHERE status = 'Verified') as verified,
      COUNT(*) FILTER (WHERE status = 'Business Review') as business_review,
      COUNT(*) FILTER (WHERE status = 'Lead & PM Review') as lead_pm_review,
      COUNT(*) FILTER (WHERE status = 'CTO Approval') as cto_approval,
      COUNT(*) FILTER (WHERE status = 'Approved') as approved,
      COUNT(*) FILTER (WHERE status = 'Rejected') as rejected,
      COUNT(*) FILTER (WHERE final_decision = 'pending') as decision_pending,
      COUNT(*) FILTER (WHERE final_decision = 'approved') as decision_approved,
      COUNT(*) FILTER (WHERE final_decision = 'rejected') as decision_rejected
    FROM brds
  `);
  
  return result.rows[0];
};
