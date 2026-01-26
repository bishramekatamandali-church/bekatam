import express from 'express';
import { prisma } from '../db';
import crypto from "crypto";
import { Prisma, collectionrecord_purpose } from '@prisma/client';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

type DonorPayload = {
  donorName?: string;
  amount?: number;
  address?: string | null;
  contact?: string | null;
};

const normalizeDonorEntries = (donors?: DonorPayload[]) => {
  if (!Array.isArray(donors)) {
    return null;
  }
  return donors
    .map((donor) => {
      const donorName = String(donor.donorName || '').trim();
      if (!donorName) {
        return null;
      }
      return {
        id: crypto.randomUUID(),
        donorName,
        amount: Number(donor.amount) || 0,
        address: donor.address?.trim() || null,
        contact: donor.contact?.trim() || null,
      };
    })
    .filter((donor): donor is NonNullable<typeof donor> => donor !== null);
};

const normalizeCollectionRecord = (record: any) => {
  const { donordetail, amount, ...rest } = record;
  const donors = Array.isArray(donordetail)
    ? donordetail.map((donor: any) => ({
        id: donor.id,
        donorName: donor.donorName,
        amount: Number(donor.amount ?? 0),
        address: donor.address ?? undefined,
        contact: donor.contact ?? undefined,
      }))
    : [];
  return {
    ...rest,
    amount: Number(amount ?? 0),
    donors,
  };
};

// GET all collection records
router.get('/', async (req, res) => {
    try {
        const records = await prisma.collectionrecord.findMany({
            orderBy: { collectionDate: 'desc' },
            include: { donordetail: true },
        });
        res.json(records.map((record) => normalizeCollectionRecord(record)));
    } catch (error) {
        if (handleDatabaseFallback(req, res, error)) {
            return;
        }
        res.status(500).json({ error: 'Failed to fetch collection records.' });
    }
});

// POST a new collection record
router.post('/', async (req, res) => {
    const { 
        collectorName, 
        collectionDate, 
        amount, 
        purpose, 
        source, 
        notes, 
        countedBy, 
        isDeposited, 
        depositDate, 
        bankDepositReference, 
        recordedByAdminId, 
        recordedByAdminName,
        donors,
    } = req.body;

    if (!collectorName || !collectionDate || !amount || !purpose) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    
    const normalizedPurpose = normalizeEnumValue(purpose, collectionrecord_purpose);
    if (!normalizedPurpose) {
        return res.status(400).json({ error: 'Invalid collection purpose.' });
    }

    try {
        const donorEntries = normalizeDonorEntries(donors);
        const newRecord = await prisma.collectionrecord.create({
            data: {
                id: crypto.randomUUID(),                   // ✅ Required
                updatedAt: new Date(),                     // ✅ Required

                collectorName,
                collectionDate: new Date(collectionDate),
                amount: Number(amount),
                purpose: normalizedPurpose,
                source,
                notes,
                countedBy,

                isDeposited: Boolean(isDeposited),
                depositDate: depositDate ? new Date(depositDate) : null,
                bankDepositReference,

                recordedByAdminId: recordedByAdminId || 'system',
                recordedByAdminName: recordedByAdminName || 'System',
                recordedAt: new Date(),
                ...(donorEntries && donorEntries.length > 0
                  ? { donordetail: { create: donorEntries } }
                  : {}),
            },
            include: {
              donordetail: true,
            },
        });

        res.status(201).json(normalizeCollectionRecord(newRecord));
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to create collection record.' });
    }
});

// PUT update a record
router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const { 
        collectorName, 
        collectionDate, 
        amount, 
        purpose, 
        source, 
        notes, 
        countedBy, 
        isDeposited, 
        depositDate, 
        bankDepositReference,
        donors,
    } = req.body;
    
    const normalizedPurpose = normalizeEnumValue(purpose, collectionrecord_purpose);
    if (purpose && !normalizedPurpose) {
        return res.status(400).json({ error: 'Invalid collection purpose.' });
    }
    
    try {
        const donorEntries = normalizeDonorEntries(donors);
        const updatedRecord = await prisma.collectionrecord.update({
            where: { id },
            data: {
                collectorName,
                collectionDate: new Date(collectionDate),
                amount: Number(amount),
                purpose: normalizedPurpose,
                source,
                notes,

                countedBy,
                isDeposited: Boolean(isDeposited),
                depositDate: depositDate ? new Date(depositDate) : null,
                bankDepositReference,

                updatedAt: new Date(),                     // ✅ Required
                ...(donorEntries
                  ? {
                      donordetail: {
                        deleteMany: {},
                        create: donorEntries,
                      },
                    }
                  : {}),
            }
        });

        const updatedWithDonors = await prisma.collectionrecord.findUnique({
          where: { id },
          include: { donordetail: true },
        });
        res.json(updatedWithDonors ? normalizeCollectionRecord(updatedWithDonors) : updatedRecord);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Collection record not found.' });
        }
        res.status(500).json({ error: 'Failed to update collection record.' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.collectionrecord.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Collection record not found.' });
        }
        res.status(500).json({ error: 'Failed to delete collection record.' });
    }
});

export default router;
