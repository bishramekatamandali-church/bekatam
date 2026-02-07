import express from 'express';
import { prisma } from '../db';
import { createUserNotification } from '../utils/notificationHelpers';

const router = express.Router();

router.post('/toggle-like/:itemType/:itemId', async (req, res) => {
  const { itemType, itemId } = req.params;
  const { action, userId, guestName, guestEmail, guestPhone } = req.body;

  if (!['like', 'unlike'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Use like/unlike.' });
  }

  // identity rules
  const isLoggedIn = Boolean(userId);
  const isGuest = !isLoggedIn && Boolean(guestEmail || guestPhone);

  if (!isLoggedIn && !isGuest) {
    return res.status(400).json({ error: 'userId OR guestEmail/guestPhone is required.' });
  }

  if (isLoggedIn) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.accountStatus === 'blocked') {
      const blockRequest = await prisma.useractionrequest.findFirst({
        where: { userId: user.id, actionType: 'block', status: 'approved' },
        orderBy: { createdAt: 'desc' },
        select: { reason: true },
      });
      return res.status(403).json({
        error: 'Your account is blocked from liking content.',
        code: 'ACCOUNT_BLOCKED',
        blockReason: blockRequest?.reason || 'Not specified.',
      });
    }
    if (user.accountStatus === 'deleted') {
      return res.status(403).json({ error: 'Deleted accounts cannot like content.' });
    }
  }

  const likeWhere: any = {
    itemType,
    itemId,
    userId: isLoggedIn ? userId : null,
    guestEmail: isGuest ? (guestEmail || null) : null,
    guestPhone: isGuest ? (guestPhone || null) : null,
  };

  try {
    if (action === 'like') {
      // prevent duplicates (handle cases where unique constraint may not cover phone-only guests)
      const existing = await prisma.contentlike.findFirst({ where: likeWhere });
      if (!existing) {
        await prisma.contentlike.create({
          data: {
            itemType,
            itemId,
            userId: isLoggedIn ? userId : null,
            guestName: isGuest ? (guestName || null) : null,
            guestEmail: isGuest ? (guestEmail || null) : null,
            guestPhone: isGuest ? (guestPhone || null) : null,
          },
        });
      }
    } else {
      // unlike -> delete if exists
      const existing = await prisma.contentlike.findFirst({ where: likeWhere });
      if (existing) {
        await prisma.contentlike.delete({ where: { id: existing.id } });
      }
    }

    // recompute likes from contentlike table (source of truth)
    const likesCount = await prisma.contentlike.count({
      where: { itemType, itemId },
    });

    // update the target item likes column so existing API responses remain compatible
    const modelMap: any = {
      sermon: prisma.sermon,
      event: prisma.eventitem,
      blogPost: prisma.blogpost,
      news: prisma.newsitem,
      historyChapter: prisma.historychapter,
      prayerRequest: prisma.prayerrequest,
      testimonial: prisma.testimonial,
    };

    const model = modelMap[itemType];
    if (!model) return res.status(400).json({ error: 'Invalid itemType.' });

    await model.update({
      where: { id: itemId },
      data: { likes: likesCount },
    });

    return res.json({ likes: likesCount });
  } catch (err) {
    console.error(`toggle-like error ${itemType}/${itemId}`, err);
    return res.status(500).json({ error: 'Failed to update like.' });
  }
});

// Track a share and notify the owner (prayer requests + testimonials)
router.post('/share/:itemType/:itemId', async (req, res) => {
  const { itemType, itemId } = req.params;
  const { userId, userName } = req.body || {};

  if (!userId || !userName) {
    return res.status(400).json({ error: 'userId and userName are required.' });
  }

  try {
    if (itemType === 'prayerRequest') {
      const pr = await prisma.prayerrequest.findUnique({ where: { id: itemId }, select: { userId: true } });
      if (pr?.userId && pr.userId !== userId) {
        await createUserNotification({
          targetUserId: pr.userId,
          message: `${userName} shared your prayer request.`,
          link: `/prayer-requests#prayer-${itemId}`,
          type: 'generic',
        });
      }
    }

    if (itemType === 'testimonial') {
      const t = await prisma.testimonial.findUnique({ where: { id: itemId }, select: { userId: true } });
      if (t?.userId && t.userId !== userId) {
        await createUserNotification({
          targetUserId: t.userId,
          message: `${userName} shared your testimonial.`,
          link: `/prayer-requests#testimonial-${itemId}`,
          type: 'generic',
        });
      }
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error(`share notification error ${itemType}/${itemId}`, error);
    return res.status(500).json({ error: 'Failed to record share.' });
  }
});

export default router;

