import { query } from '../db/connection.js';

// Transform database row to frontend format
const transformAlertRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  isRead: row.is_read,
  brdId: row.brd_id,
  actionType: row.action_type,
  actionBy: row.action_by,
  timestamp: row.timestamp,
  createdAt: row.created_at,
});

// Get all alerts (optionally filtered by user)
export const getAllAlerts = async (userId = null) => {
  let queryText = 'SELECT * FROM alerts ORDER BY timestamp DESC';
  let params = [];
  
  if (userId) {
    queryText = 'SELECT * FROM alerts WHERE user_id = $1 OR user_id IS NULL ORDER BY timestamp DESC';
    params = [userId];
  }
  
  const result = await query(queryText, params);
  return result.rows.map(transformAlertRow);
};

// Get unread alerts count
export const getUnreadCount = async (userId = null) => {
  let queryText = 'SELECT COUNT(*) as count FROM alerts WHERE is_read = false';
  let params = [];
  
  if (userId) {
    queryText = 'SELECT COUNT(*) as count FROM alerts WHERE is_read = false AND (user_id = $1 OR user_id IS NULL)';
    params = [userId];
  }
  
  const result = await query(queryText, params);
  return parseInt(result.rows[0].count);
};

// Get alert by ID
export const getAlertById = async (id) => {
  const result = await query('SELECT * FROM alerts WHERE id = $1', [id]);
  return result.rows[0] ? transformAlertRow(result.rows[0]) : null;
};

// Create new alert
export const createAlert = async (alertData) => {
  const {
    userId = null,
    title,
    message,
    type = 'info',
    brdId = null,
    actionType = null,
    actionBy = null,
    timestamp = Date.now(),
  } = alertData;

  const result = await query(
    `INSERT INTO alerts (user_id, title, message, type, brd_id, action_type, action_by, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, title, message, type, brdId, actionType, actionBy, timestamp]
  );

  return transformAlertRow(result.rows[0]);
};

// Mark alert as read
export const markAsRead = async (id) => {
  const result = await query(
    'UPDATE alerts SET is_read = true WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] ? transformAlertRow(result.rows[0]) : null;
};

// Mark all alerts as read for a user
export const markAllAsRead = async (userId = null) => {
  let queryText = 'UPDATE alerts SET is_read = true WHERE is_read = false';
  let params = [];
  
  if (userId) {
    queryText = 'UPDATE alerts SET is_read = true WHERE is_read = false AND (user_id = $1 OR user_id IS NULL)';
    params = [userId];
  }
  
  const result = await query(queryText, params);
  return result.rowCount;
};

// Delete alert
export const deleteAlert = async (id) => {
  const result = await query('DELETE FROM alerts WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

// Delete all alerts for a user
export const deleteAllAlerts = async (userId = null) => {
  let queryText = 'DELETE FROM alerts';
  let params = [];
  
  if (userId) {
    queryText = 'DELETE FROM alerts WHERE user_id = $1 OR user_id IS NULL';
    params = [userId];
  }
  
  const result = await query(queryText, params);
  return result.rowCount;
};

// Get alerts by BRD
export const getAlertsByBrd = async (brdId) => {
  const result = await query(
    'SELECT * FROM alerts WHERE brd_id = $1 ORDER BY timestamp DESC',
    [brdId]
  );
  return result.rows.map(transformAlertRow);
};

// Get recent alerts (last 24 hours)
export const getRecentAlerts = async (userId = null, hours = 24) => {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  
  let queryText = 'SELECT * FROM alerts WHERE timestamp > $1 ORDER BY timestamp DESC';
  let params = [cutoff];
  
  if (userId) {
    queryText = 'SELECT * FROM alerts WHERE timestamp > $1 AND (user_id = $2 OR user_id IS NULL) ORDER BY timestamp DESC';
    params = [cutoff, userId];
  }
  
  const result = await query(queryText, params);
  return result.rows.map(transformAlertRow);
};
