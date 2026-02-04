import express from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { publishContentUpdate } from '../services/contentUpdates';
import type { ContentUpdatePayload } from '../services/contentUpdates';

const router = express.Router();

const safePublish = (payload: ContentUpdatePayload) => {
  try {
    publishContentUpdate(payload);
  } catch (err) {
    // IMPORTANT: Never break CRUD if SSE is misconfigured/down.
    console.warn('publishContentUpdate failed (churchMembers):', err);
  }
};

router.get('/', async (_req, res) => {
  try {
    const members = await prisma.churchmember.findMany({
      orderBy: { memberSince: 'desc' },
    });
    res.json(members);
  } catch (error) {
    console.error('Failed to load church members:', error);
    res.status(500).json({ error: 'Failed to load church members.' });
  }
});

router.post('/', async (req, res) => {
  const {
    userId,
    fullName,
    username,
    contactPhone,
    contactEmail,
    address,
    memberSince,
    dateOfBirth,
    baptismDate,
    familyMembers,
    notes,
    isActiveMember,
    memberStatus,
    deactivatedDate,
    profileImageUrl,
    postedByAdminId,
    postedByAdminName,
  } = req.body;

  if (!fullName || !memberSince) {
    return res.status(400).json({ error: 'Full name and member since date are required.' });
  }

  try {
    const resolvedMemberStatus = memberStatus || (isActiveMember ? 'Active' : 'Left');
    const resolvedIsActive = String(resolvedMemberStatus).toLowerCase() === 'active';

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
        isActiveMember: resolvedIsActive,
        memberStatus: resolvedMemberStatus,
        deactivatedDate: deactivatedDate ? new Date(deactivatedDate) : null,
        profileImageUrl,
        postedByAdminId,
        postedByAdminName,
        updatedAt: new Date(),
      },
    });

    safePublish({
      type: 'churchMember',
      action: 'created',
      id: created.id,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create church member:', error);
    res.status(500).json({ error: 'Failed to create church member.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;

  const {
    userId,
    fullName,
    username,
    contactPhone,
    contactEmail,
    address,
    memberSince,
    dateOfBirth,
    baptismDate,
    familyMembers,
    notes,
    isActiveMember,
    memberStatus,
    deactivatedDate,
    profileImageUrl,
    postedByAdminId,
    postedByAdminName,
  } = req.body;

  try {
    const resolvedMemberStatus = memberStatus || (isActiveMember ? 'Active' : 'Left');
    const resolvedIsActive = String(resolvedMemberStatus).toLowerCase() === 'active';

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
        isActiveMember: resolvedIsActive,
        memberStatus: resolvedMemberStatus,
        deactivatedDate: deactivatedDate ? new Date(deactivatedDate) : null,
        profileImageUrl,
        postedByAdminId,
        postedByAdminName,
        updatedAt: new Date(),
      },
    });

    safePublish({
      type: 'churchMember',
      action: 'updated',
      id: updated.id,
      timestamp: new Date().toISOString(),
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Church member not found.' });
    }
    console.error('Failed to update church member:', error);
    res.status(500).json({ error: 'Failed to update church member.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.churchmember.delete({ where: { id } });

    safePublish({
      type: 'churchMember',
      action: 'deleted',
      id,
      timestamp: new Date().toISOString(),
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Church member not found.' });
    }
    console.error('Failed to delete church member:', error);
    res.status(500).json({ error: 'Failed to delete church member.' });
  }
});

export default router;
