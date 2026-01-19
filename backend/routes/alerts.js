import { Router } from 'express';
import * as alertService from '../services/alertService.js';

const router = Router();

// GET /api/alerts - Get all alerts
router.get('/', async (req, res) => {
  try {
    const { userId, recent } = req.query;
    
    let alerts;
    if (recent) {
      alerts = await alertService.getRecentAlerts(userId, parseInt(recent));
    } else {
      alerts = await alertService.getAllAlerts(userId);
    }
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/alerts/unread/count - Get unread count
router.get('/unread/count', async (req, res) => {
  try {
    const { userId } = req.query;
    const count = await alertService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// GET /api/alerts/brd/:brdId - Get alerts for a BRD
router.get('/brd/:brdId', async (req, res) => {
  try {
    const alerts = await alertService.getAlertsByBrd(req.params.brdId);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching BRD alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/alerts/:id - Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// POST /api/alerts - Create new alert
router.post('/', async (req, res) => {
  try {
    const { title, message, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }
    
    const alert = await alertService.createAlert(req.body);
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// PATCH /api/alerts/:id/read - Mark alert as read
router.patch('/:id/read', async (req, res) => {
  try {
    const alert = await alertService.markAsRead(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// PATCH /api/alerts/read-all - Mark all alerts as read
router.patch('/read-all', async (req, res) => {
  try {
    const { userId } = req.query;
    const count = await alertService.markAllAsRead(userId);
    res.json({ updated: count });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update alerts' });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await alertService.deleteAlert(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// DELETE /api/alerts - Delete all alerts
router.delete('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const count = await alertService.deleteAllAlerts(userId);
    res.json({ deleted: count });
  } catch (error) {
    console.error('Error deleting alerts:', error);
    res.status(500).json({ error: 'Failed to delete alerts' });
  }
});

export default router;
