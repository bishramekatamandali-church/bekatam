






































import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';

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
  default:
    return res.status(400).json({ error: 'Invalid itemType for comment.' });
}


    try {
        const newComment = await prisma.comment.create({ data });
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
        const itemId = updatedComment.sermonId || updatedComment.eventId || updatedComment.blogPostId || updatedComment.newsItemId || updatedComment.historyChapterId || updatedComment.prayerRequestId;
        let itemType = "sermon";
        if (updatedComment.eventId) itemType = "event";
        else if (updatedComment.blogPostId) itemType = "blogPost";
        else if (updatedComment.newsItemId) itemType = "news";
        else if (updatedComment.historyChapterId) itemType = "historyChapter";
        else if (updatedComment.prayerRequestId) itemType = "prayerRequest";

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
