import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

// All roster templates and generated schedules
router.get('/', async (_req, res) => {
  try {
    const [rosters, schedules] = await Promise.all([
      prisma.fellowshiprosteritem.findMany({ include: { responsibility: true }, orderBy: { assignedDate: 'desc' } }),
      prisma.generatedscheduleitem.findMany({ include: { responsibility: true }, orderBy: { scheduledDate: 'desc' } }),
    ]);
    res.json({ rosters, schedules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load fellowship schedules.' });
  }
});

router.post('/rosters', async (req, res) => {
  const { rosterType, groupNameOrEventTitle, assignedDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isTemplate, responsibilities, postedByOwnerId, postedByOwnerName } = req.body;

  if (!rosterType || !groupNameOrEventTitle || !assignedDate || !timeSlot) {
    return res.status(400).json({ error: 'Roster type, title, assigned date, and time slot are required.' });
  }

  try {
    const created = await prisma.fellowshiprosteritem.create({
      data: {
        id: crypto.randomUUID(),
        rosterType,
        groupNameOrEventTitle,
        assignedDate: new Date(assignedDate),
        timeSlot,
        location,
        contactNumber,
        additionalNotesOrProgramDetails,
        isTemplate: Boolean(isTemplate),
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
        responsibility: responsibilities
          ? {
              create: responsibilities.map((item: any) => ({
                id: crypto.randomUUID(),
                role: item.role,
                assignedTo: item.assignedTo,
              })),
            }
          : undefined,
      },
      include: { responsibility: true },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create roster item.' });
  }
});

router.put('/rosters/:id', async (req, res) => {
  const { id } = req.params;
  const { rosterType, groupNameOrEventTitle, assignedDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isTemplate, responsibilities, postedByOwnerId, postedByOwnerName } = req.body;

  try {
    const updated = await prisma.fellowshiprosteritem.update({
      where: { id },
      data: {
        rosterType,
        groupNameOrEventTitle,
        assignedDate: assignedDate ? new Date(assignedDate) : undefined,
        timeSlot,
        location,
        contactNumber,
        additionalNotesOrProgramDetails,
        isTemplate,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
        responsibility: responsibilities
          ? {
              deleteMany: {},
              create: responsibilities.map((item: any) => ({
                id: crypto.randomUUID(),
                role: item.role,
                assignedTo: item.assignedTo,
              })),
            }
          : undefined,
      },
      include: { responsibility: true },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Roster item not found.' });
    }
    res.status(500).json({ error: 'Failed to update roster item.' });
  }
});

router.delete('/rosters/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.fellowshiprosteritem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Roster item not found.' });
    }
    res.status(500).json({ error: 'Failed to delete roster item.' });
  }
});

router.post('/generated', async (req, res) => {
  const { basedOnRosterItemId, rosterType, groupNameOrEventTitle, scheduledDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isPublishedAsEvent, publishedEventId, adminNotes, responsibilities, postedByOwnerId, postedByOwnerName } = req.body;

  if (!rosterType || !groupNameOrEventTitle || !scheduledDate || !timeSlot) {
    return res.status(400).json({ error: 'Roster type, title, scheduled date, and time slot are required.' });
  }

  try {
    const created = await prisma.generatedscheduleitem.create({
      data: {
        id: crypto.randomUUID(),
        basedOnRosterItemId,
        rosterType,
        groupNameOrEventTitle,
        scheduledDate: new Date(scheduledDate),
        timeSlot,
        location,
        contactNumber,
        additionalNotesOrProgramDetails,
        isPublishedAsEvent: Boolean(isPublishedAsEvent),
        publishedEventId,
        adminNotes,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
        responsibility: responsibilities
          ? {
              create: responsibilities.map((item: any) => ({
                id: crypto.randomUUID(),
                role: item.role,
                assignedTo: item.assignedTo,
              })),
            }
          : undefined,
      },
      include: { responsibility: true },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create generated schedule item.' });
  }
});

router.put('/generated/:id', async (req, res) => {
  const { id } = req.params;
  const { basedOnRosterItemId, rosterType, groupNameOrEventTitle, scheduledDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isPublishedAsEvent, publishedEventId, adminNotes, responsibilities, postedByOwnerId, postedByOwnerName } = req.body;

  try {
    const updated = await prisma.generatedscheduleitem.update({
      where: { id },
      data: {
        basedOnRosterItemId,
        rosterType,
        groupNameOrEventTitle,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        timeSlot,
        location,
        contactNumber,
        additionalNotesOrProgramDetails,
        isPublishedAsEvent,
        publishedEventId,
        adminNotes,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
        responsibility: responsibilities
          ? {
              deleteMany: {},
              create: responsibilities.map((item: any) => ({
                id: crypto.randomUUID(),
                role: item.role,
                assignedTo: item.assignedTo,
              })),
            }
          : undefined,
      },
      include: { responsibility: true },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Generated schedule item not found.' });
    }
    res.status(500).json({ error: 'Failed to update generated schedule item.' });
  }
});

router.delete('/generated/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.generatedscheduleitem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Generated schedule item not found.' });
    }
    res.status(500).json({ error: 'Failed to delete generated schedule item.' });
  }
});

export default router;
