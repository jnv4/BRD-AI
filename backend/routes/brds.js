import { Router } from 'express';
import * as brdService from '../services/brdService.js';

const router = Router();

// GET /api/brds - Get all BRDs
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let brds;
    if (status) {
      brds = await brdService.getBrdsByStatus(status);
    } else {
      brds = await brdService.getAllBrds();
    }
    
    res.json(brds);
  } catch (error) {
    console.error('Error fetching BRDs:', error);
    res.status(500).json({ error: 'Failed to fetch BRDs' });
  }
});

// GET /api/brds/stats - Get BRD statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await brdService.getBrdStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching BRD stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/brds/:id - Get BRD by ID
router.get('/:id', async (req, res) => {
  try {
    const brd = await brdService.getBrdById(req.params.id);
    if (!brd) {
      return res.status(404).json({ error: 'BRD not found' });
    }
    res.json(brd);
  } catch (error) {
    console.error('Error fetching BRD:', error);
    res.status(500).json({ error: 'Failed to fetch BRD' });
  }
});

// POST /api/brds - Create new BRD
router.post('/', async (req, res) => {
  try {
    const brd = await brdService.createBrd(req.body);
    res.status(201).json(brd);
  } catch (error) {
    console.error('Error creating BRD:', error);
    res.status(500).json({ error: 'Failed to create BRD' });
  }
});

// PUT /api/brds/:id - Update BRD
router.put('/:id', async (req, res) => {
  try {
    const brd = await brdService.updateBrd(req.params.id, req.body);
    if (!brd) {
      return res.status(404).json({ error: 'BRD not found' });
    }
    res.json(brd);
  } catch (error) {
    console.error('Error updating BRD:', error);
    res.status(500).json({ error: 'Failed to update BRD' });
  }
});

// PATCH /api/brds/:id/approve - Add approval vote
router.patch('/:id/approve', async (req, res) => {
  try {
    const { type } = req.body; // 'yes' or 'no'
    
    if (!type || !['yes', 'no'].includes(type)) {
      return res.status(400).json({ error: 'Invalid approval type' });
    }
    
    const brd = await brdService.updateBrdApproval(req.params.id, type);
    if (!brd) {
      return res.status(404).json({ error: 'BRD not found' });
    }
    res.json(brd);
  } catch (error) {
    console.error('Error updating approval:', error);
    res.status(500).json({ error: 'Failed to update approval' });
  }
});

// PATCH /api/brds/:id/decision - Set final decision
router.patch('/:id/decision', async (req, res) => {
  try {
    const { decision } = req.body; // 'pending', 'approved', or 'rejected'
    
    if (!decision || !['pending', 'approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }
    
    const brd = await brdService.setFinalDecision(req.params.id, decision);
    if (!brd) {
      return res.status(404).json({ error: 'BRD not found' });
    }
    res.json(brd);
  } catch (error) {
    console.error('Error setting decision:', error);
    res.status(500).json({ error: 'Failed to set decision' });
  }
});

// DELETE /api/brds/:id - Delete BRD
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await brdService.deleteBrd(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'BRD not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting BRD:', error);
    res.status(500).json({ error: 'Failed to delete BRD' });
  }
});

export default router;
