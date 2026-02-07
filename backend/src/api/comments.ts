






































import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { createUserNotification } from '../utils/notificationHelpers';

const router = express.Router();

// POST a new comment
router.post('/', async (req, res) => {
    const {
        itemType,
        itemId,
        text,
        // logged-in
        userId,
        userName,
        userProfileImageUrl,
        // guest
        isGuest,
        guestEmail,
        guestPhone,
    } = req.body;

    if (!itemType || !itemId || !text || !userName) {
        return res.status(400).json({ error: 'Missing required fields for comment.' });
    }

    const isGuestComment = Boolean(isGuest) || (!userId && (guestEmail || guestPhone));

    if (!isGuestComment && !userId) {
        return res.status(400).json({ error: 'userId is required for non-guest comments.' });
    }

    if (isGuestComment && !(guestEmail || guestPhone)) {
        return res.status(400).json({ error: 'Guest comments require guestEmail or guestPhone.' });
    }
    
    if (!isGuestComment && userId) {
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
                error: 'Your account is blocked from commenting.',
                code: 'ACCOUNT_BLOCKED',
                blockReason: blockRequest?.reason || 'Not specified.',
            });
        }
        if (user.accountStatus === 'deleted') {
            return res.status(403).json({ error: 'Deleted accounts cannot comment.' });
        }
    }

    let data: any = {
  id: crypto.randomUUID(),        // ✅ ADD THIS
  userId: isGuestComment ? null : userId,
  userName,
  userProfileImageUrl: userProfileImageUrl || null,
  isGuest: isGuestComment,
  guestEmail: isGuestComment ? (guestEmail || null) : null,
  guestPhone: isGuestComment ? (guestPhone || null) : null,
  text,
  timestamp: new Date(),
};

    switch (itemType) {
  case 'sermon': data.sermonId = itemId; break;
  case 'event': data.eventId = itemId; break;
  case 'blogPost': data.blogPostId = itemId; break;
  case 'news':
  case 'newsItem': data.newsItemId = itemId; break;
  case 'historyChapter': data.historyChapterId = itemId; break;
  case 'prayerRequest': data.prayerRequestId = itemId; break;
  case 'testimonial': data.testimonialId = itemId; break;
  default:
    return res.status(400).json({ error: 'Invalid itemType for comment.' });
}


    try {
        const newComment = await prisma.comment.create({ data });

        // Bell notifications: notify the content owner (registered users only)
        try {
            const actorUserId: string | null = isGuestComment ? null : (userId || null);
            const actorName: string = userName || 'Someone';

            const notifyOwner = async (ownerUserId: string | null | undefined, link: string, what: string) => {
                if (!ownerUserId) return;
                if (actorUserId && actorUserId === ownerUserId) return; // don't notify self
                await createUserNotification({
                    targetUserId: ownerUserId,
                    message: `${actorName} commented on your ${what}.`,
                    link,
                    type: 'comment',
                });
            };

            if (itemType === 'prayerRequest') {
                const pr = await prisma.prayerrequest.findUnique({
                    where: { id: itemId },
                    select: { userId: true },
                });
                await notifyOwner(pr?.userId, `/prayer-requests#prayer-${itemId}`, 'prayer request');
            }

            if (itemType === 'testimonial') {
                const t = await prisma.testimonial.findUnique({
                    where: { id: itemId },
                    select: { userId: true },
                });
                await notifyOwner(t?.userId, `/prayer-requests#testimonial-${itemId}`, 'testimonial');
            }
        } catch (notifyError) {
            console.error('Comment owner notification failed:', notifyError);
        }
        // Shape response to match frontend Comment type
        res.status(201).json({
            id: newComment.id,
            itemId,
            itemType,
            userId: newComment.userId,
            userName: newComment.userName,
            userProfileImageUrl: newComment.userProfileImageUrl,
            isGuest: newComment.isGuest,
            guestEmail: newComment.guestEmail,
            guestPhone: newComment.guestPhone,
            text: newComment.text,
            timestamp: new Date(newComment.timestamp).toISOString(),
            editedAt: newComment.editedAt ? new Date(newComment.editedAt).toISOString() : null,
        });
    } catch (error) {
        console.error("Error creating comment:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') { // Foreign key constraint failed
                return res.status(404).json({ error: `The ${itemType} with ID ${itemId} does not exist.` });
            }
        }
        res.status(500).json({ error: 'Failed to create comment.' });
    }
});

// PUT (update) a comment
router.put('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Comment text is required for update.' });
    }

    try {
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                text,
                editedAt: new Date(),
            }
        });
        const itemId = updatedComment.sermonId || updatedComment.eventId || updatedComment.blogPostId || updatedComment.newsItemId || updatedComment.historyChapterId || updatedComment.prayerRequestId || updatedComment.testimonialId;
        let itemType = "sermon";
        if (updatedComment.eventId) itemType = "event";
        else if (updatedComment.blogPostId) itemType = "blogPost";
        else if (updatedComment.newsItemId) itemType = "news";
        else if (updatedComment.historyChapterId) itemType = "historyChapter";
        else if (updatedComment.prayerRequestId) itemType = "prayerRequest";
        else if (updatedComment.testimonialId) itemType = "testimonial";

        res.json({
            id: updatedComment.id,
            itemId,
            itemType,
            userId: updatedComment.userId,
            userName: updatedComment.userName,
            userProfileImageUrl: updatedComment.userProfileImageUrl,
            isGuest: updatedComment.isGuest,
            guestEmail: updatedComment.guestEmail,
            guestPhone: updatedComment.guestPhone,
            text: updatedComment.text,
            timestamp: new Date(updatedComment.timestamp).toISOString(),
            editedAt: updatedComment.editedAt ? new Date(updatedComment.editedAt).toISOString() : null,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Comment to update not found.' });
        }
        res.status(500).json({ error: 'Failed to update comment.' });
    }
});

// DELETE a comment
router.delete('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    try {
        await prisma.comment.delete({
            where: { id: commentId },
        });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Comment to delete not found.' });
        }
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

export default router; 
