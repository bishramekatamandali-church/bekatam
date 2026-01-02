import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const members = await prisma.churchmember.findMany({ orderBy: { memberSince: 'desc' } });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load church members.' });
  }
});

router.post('/', async (req, res) => {
  const { userId, fullName, username, contactPhone, contactEmail, address, memberSince, dateOfBirth, baptismDate, familyMembers, notes, isActiveMember, profileImageUrl, postedByOwnerId, postedByOwnerName } = req.body;

  if (!fullName || !memberSince) {
    return res.status(400).json({ error: 'Full name and member since date are required.' });
  }

  try {
    const created = await prisma.churchmember.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId || null,
        fullName,
        username,
        contactPhone,
        contactEmail,
        address,
        memberSince: new Date(memberSince),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        baptismDate: baptismDate ? new Date(baptismDate) : null,
        familyMembers,
        notes,
        isActiveMember: Boolean(isActiveMember),
        profileImageUrl,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create church member.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, fullName, username, contactPhone, contactEmail, address, memberSince, dateOfBirth, baptismDate, familyMembers, notes, isActiveMember, profileImageUrl, postedByOwnerId, postedByOwnerName } = req.body;

  try {
    const updated = await prisma.churchmember.update({
      where: { id },
      data: {
        userId: userId || null,
        fullName,
        username,
        contactPhone,
        contactEmail,
        address,
        memberSince: memberSince ? new Date(memberSince) : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        baptismDate: baptismDate ? new Date(baptismDate) : null,
        familyMembers,
        notes,
        isActiveMember: Boolean(isActiveMember),
        profileImageUrl,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Church member not found.' });
    }
    res.status(500).json({ error: 'Failed to update church member.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.churchmember.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Church member not found.' });
    }
    res.status(500).json({ error: 'Failed to delete church member.' });
  }
});

export default router;
