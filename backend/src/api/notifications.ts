import express from 'express';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const requester = req.user as { id?: string } | undefined;
    if (!requester?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { targetUserId: requester.id },
      orderBy: { timestamp: 'desc' },
      take: 250,
    });

    return res.json(notifications);
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const requester = req.user as { id?: string } | undefined;
    if (!requester?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updated = await prisma.notification.updateMany({
      where: { id, targetUserId: requester.id },
      data: { read: true },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('POST /api/notifications/:id/read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const requester = req.user as { id?: string } | undefined;
    if (!requester?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.notification.updateMany({
      where: { targetUserId: requester.id, read: false },
      data: { read: true },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('POST /api/notifications/mark-all-read error:', error);
    return res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

export default router;
