import express from 'express';
import { prisma } from '../db';

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
      return res.status(403).json({ error: 'Your account is blocked from liking content.' });
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

export default router;
