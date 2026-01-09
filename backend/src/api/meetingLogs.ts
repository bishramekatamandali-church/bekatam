import express from 'express';
import {
  Prisma,
  meetingdecisionpoint_status,
  meetinglog_meetingType,
  meetinglog_status,
} from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';
import { normalizeEnumValue } from '../utils/enumNormalization';

const router = express.Router();

// List meetings with decision points
router.get('/', async (_req, res) => {
  try {
    const meetings = await prisma.meetinglog.findMany({
      orderBy: { meetingDate: 'desc' },
      include: { meetingdecisionpoint: true },
    });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load meeting logs.' });
  }
});

// Create a meeting log
router.post('/', async (req, res) => {
  const {
    meetingDate,
    title,
    meetingType,
    attendees,
    agenda,
    minutes,
    actionItems,
    status,
    imageUrl,
    decisionPoints,
    postedByAdminId,
    postedByAdminName,
  } = req.body;

  if (!meetingDate || !title || !attendees || !agenda || !minutes) {
    return res.status(400).json({
      error: 'Meeting date, title, attendees, agenda, and minutes are required.',
    });
  }

  // normalize enums
  const normalizedMeetingType = normalizeEnumValue(
    meetingType,
    meetinglog_meetingType
  );

  const normalizedStatus = normalizeEnumValue(status, meetinglog_status);

  if (meetingType && !normalizedMeetingType) {
    return res.status(400).json({ error: 'Invalid meeting type.' });
  }

  if (status && !normalizedStatus) {
    return res.status(400).json({ error: 'Invalid meeting status.' });
  }

  // normalize decision points
  let normalizedDecisionPoints: Array<Record<string, any>> = [];
  if (decisionPoints && Array.isArray(decisionPoints)) {
    for (const point of decisionPoints) {
      const normalizedPointStatus = normalizeEnumValue(
        point.status,
        meetingdecisionpoint_status
      );

      if (point.status && !normalizedPointStatus) {
        return res
          .status(400)
          .json({ error: 'Invalid meeting decision point status.' });
      }

      normalizedDecisionPoints.push({
        ...point,
        status: normalizedPointStatus,
      });
    }
  }

  try {
    const created = await prisma.meetinglog.create({
      data: {
        id: crypto.randomUUID(),
        meetingDate: new Date(meetingDate),
        title,
        meetingType: normalizedMeetingType,
        attendees,
        agenda,
        minutes,
        actionItems,
        status: normalizedStatus,
        imageUrl,
        postedByAdminId,
        postedByAdminName,
        updatedAt: new Date(),
        meetingdecisionpoint: {
          create: normalizedDecisionPoints.map((point: any) => ({
            id: crypto.randomUUID(),
            description: point.description,
            proposedBy: point.proposedBy,
            status: point.status,
            followUpNotes: point.followUpNotes,
            resolutionDate: point.resolutionDate
              ? new Date(point.resolutionDate)
              : null,
          })),
        },
      },
      include: { meetingdecisionpoint: true },
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meeting log.' });
  }
});

// Update a meeting and replace decision points
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    meetingDate,
    title,
    meetingType,
    attendees,
    agenda,
    minutes,
    actionItems,
    status,
    imageUrl,
    decisionPoints,
    postedByAdminId,
    postedByAdminName,
  } = req.body;

  const normalizedMeetingType = normalizeEnumValue(
    meetingType,
    meetinglog_meetingType
  );
  const normalizedStatus = normalizeEnumValue(status, meetinglog_status);

  if (meetingType && !normalizedMeetingType) {
    return res.status(400).json({ error: 'Invalid meeting type.' });
  }

  if (status && !normalizedStatus) {
    return res.status(400).json({ error: 'Invalid meeting status.' });
  }

  let normalizedDecisionPoints: Array<Record<string, any>> | undefined = undefined;

  if (decisionPoints && Array.isArray(decisionPoints)) {
    normalizedDecisionPoints = [];
    for (const point of decisionPoints) {
      const normalizedPointStatus = normalizeEnumValue(
        point.status,
        meetingdecisionpoint_status
      );

      if (point.status && !normalizedPointStatus) {
        return res
          .status(400)
          .json({ error: 'Invalid meeting decision point status.' });
      }

      normalizedDecisionPoints.push({
        ...point,
        status: normalizedPointStatus,
      });
    }
  }

  try {
    const updated = await prisma.meetinglog.update({
      where: { id },
      data: {
        meetingDate: meetingDate ? new Date(meetingDate) : undefined,
        title,
        meetingType: normalizedMeetingType,
        attendees,
        agenda,
        minutes,
        actionItems,
        status: normalizedStatus,
        imageUrl,
        postedByAdminId,
        postedByAdminName,
        updatedAt: new Date(),
        meetingdecisionpoint: decisionPoints
          ? {
              deleteMany: {},
              create: (normalizedDecisionPoints || []).map((point: any) => ({
                id: crypto.randomUUID(),
                description: point.description,
                proposedBy: point.proposedBy,
                status: point.status,
                followUpNotes: point.followUpNotes,
                resolutionDate: point.resolutionDate
                  ? new Date(point.resolutionDate)
                  : null,
              })),
            }
          : undefined,
      },
      include: { meetingdecisionpoint: true },
    });

    res.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ error: 'Meeting log not found.' });
    }
    res.status(500).json({ error: 'Failed to update meeting log.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.meetinglog.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ error: 'Meeting log not found.' });
    }
    res.status(500).json({ error: 'Failed to delete meeting log.' });
  }
});

export default router;
