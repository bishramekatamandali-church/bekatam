import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const members = await prisma.ministrymember.findMany({ orderBy: { joinedAt: 'desc' } });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load ministry members.' });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const history = await prisma.ministrymemberhistory.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load ministry member history.' });
  }
});

router.post('/', async (req, res) => {
  const { userId, userName, userEmail, ministryId, ministryName, membershipType } = req.body;

  if (!userName || !userEmail || !ministryName) {
    return res.status(400).json({ error: 'User name, email, and ministry name are required.' });
  }

  try {
    const memberId = crypto.randomUUID();
    const created = await prisma.$transaction(async (tx) => {
      const member = await tx.ministrymember.create({
        data: {
          id: memberId,
          userId: userId || null,
          userName,
          userEmail,
          ministryId: ministryId || null,
          ministryName,
          membershipType: membershipType || 'member',
          joinedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.ministrymemberhistory.create({
        data: {
          id: crypto.randomUUID(),
          memberId: member.id,
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
          ministryId: member.ministryId,
          ministryName: member.ministryName,
          action: 'created',
          details: 'Member added.',
        },
      });

      return member;
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ministry member.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, userName, userEmail, ministryId, ministryName, membershipType } = req.body;

  try {
    const existing = await prisma.ministrymember.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Ministry member not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.ministrymember.update({
        where: { id },
        data: {
          userId: userId === undefined ? existing.userId : userId,
          userName: userName ?? existing.userName,
          userEmail: userEmail ?? existing.userEmail,
          ministryId: ministryId === undefined ? existing.ministryId : ministryId,
          ministryName: ministryName ?? existing.ministryName,
          membershipType: membershipType ?? existing.membershipType,
          updatedAt: new Date(),
        },
      });

      const isMove = Boolean(existing.ministryId && next.ministryId && existing.ministryId !== next.ministryId);

      await tx.ministrymemberhistory.create({
        data: {
          id: crypto.randomUUID(),
          memberId: next.id,
          userId: next.userId,
          userName: next.userName,
          userEmail: next.userEmail,
          ministryId: next.ministryId,
          ministryName: next.ministryName,
          previousMinistryId: existing.ministryId,
          previousMinistryName: existing.ministryName,
          action: isMove ? 'moved' : 'updated',
          details: isMove ? 'Member moved to a new ministry.' : 'Member updated.',
        },
      });

      return next;
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Ministry member not found.' });
    }
    res.status(500).json({ error: 'Failed to update ministry member.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.ministrymember.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Ministry member not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ministrymember.delete({ where: { id } });
      await tx.ministrymemberhistory.create({
        data: {
          id: crypto.randomUUID(),
          memberId: existing.id,
          userId: existing.userId,
          userName: existing.userName,
          userEmail: existing.userEmail,
          ministryId: existing.ministryId,
          ministryName: existing.ministryName,
          previousMinistryId: existing.ministryId,
          previousMinistryName: existing.ministryName,
          action: 'deleted',
          details: 'Member removed.',
        },
      });
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Ministry member not found.' });
    }
    res.status(500).json({ error: 'Failed to delete ministry member.' });
  }
});

export default router;
