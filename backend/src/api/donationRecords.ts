import express from 'express';
import { prisma } from '../db';
import { Prisma, donationrecord_paymentMethod, donationrecord_purpose } from '@prisma/client';
import crypto from 'crypto';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { sendEmail } from '../services/emailService';
import { handleDatabaseFallback } from '../utils/databaseFallback';
import { publishContentUpdate } from '../services/contentUpdates';
import { buildDonationReceiptPdfBuffer, DonationReceiptPdfData } from '../utils/donationReceiptPdf';

const router = express.Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'bishramekatamandali@gmail.com').toLowerCase().trim();


// GET all donation records
router.get('/', async (req, res) => {
  try {
    const records = await prisma.donationrecord.findMany({
      orderBy: { donationDate: 'desc' },
    });
    res.json(records);
  } catch (error) {
    if (handleDatabaseFallback(req, res, error)) return;
    res.status(500).json({ error: 'Failed to fetch donation records.' });
  }
});

// POST a new donation record
router.post('/', async (req, res) => {
  const {
    donorName,
    donorEmail,
    amount,
    purpose,
    donationDate,
    paymentMethod,
    transactionReference,
    notes,
    isReceiptSent,
    postedByAdminId,
    postedByAdminName,
  } = req.body;

  if (!donorName || !donorEmail || !amount || !purpose || !donationDate) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const normalizedPurpose = normalizeEnumValue(purpose, donationrecord_purpose);
  const normalizedPaymentMethod = normalizeEnumValue(paymentMethod, donationrecord_paymentMethod);

  if (!normalizedPurpose) {
    return res.status(400).json({ error: 'Invalid donation purpose.' });
  }

  if (paymentMethod && !normalizedPaymentMethod) {
    return res.status(400).json({ error: 'Invalid donation payment method.' });
  }

  try {
    const newRecord = await prisma.donationrecord.create({
      data: {
        id: crypto.randomUUID(), // REQUIRED in your schema
        updatedAt: new Date(), // REQUIRED
        donorName,
        donorEmail,
        amount: Number(amount),
        purpose: normalizedPurpose,
        donationDate: new Date(donationDate),
        paymentMethod: normalizedPaymentMethod,
        transactionReference,
        notes,
        isReceiptSent: Boolean(isReceiptSent),
        postedByAdminId: postedByAdminId || 'system',
        postedByAdminName: postedByAdminName || 'System',
        transactionTimestamp: new Date(),
      },
    });

    let recordToReturn = newRecord;

    // Build receipt PDF once (best effort)
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await buildDonationReceiptPdfBuffer({
        id: newRecord.id,
        donorName,
        donorEmail,
        amount: Number(amount),
        purpose: String(normalizedPurpose),
        donationDate: new Date(donationDate),
        transactionReference: transactionReference ?? null,
      });
    } catch (pdfErr) {
      console.error('Failed to generate donation receipt PDF:', pdfErr);
      pdfBuffer = null;
    }

    // Donor email + PDF attachment
    try {
      const amountFixed = Number(amount).toFixed(2);
      const dateStr = new Date(donationDate).toLocaleDateString();

      await sendEmail({
        to: donorEmail,
        subject: 'Thank you for your donation',
        text:
          `Dear ${donorName},\n\n` +
          `Thank you for your generous donation of NPR ${amountFixed}.\n` +
          `Purpose: ${normalizedPurpose}\n` +
          `Date: ${dateStr}\n` +
          `${transactionReference ? `Transaction Reference: ${transactionReference}\n` : ''}` +
          `\nWe appreciate your support.\n\n— Bishram Ekata Mandali`,
        html: `
          <p>Dear ${donorName},</p>
          <p>Thank you for your generous donation of <strong>NPR ${amountFixed}</strong>.</p>
          <p><strong>Purpose:</strong> ${normalizedPurpose}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          ${transactionReference ? `<p><strong>Transaction Reference:</strong> ${transactionReference}</p>` : ''}
          <p>Your PDF receipt is attached to this email.</p>
          <p>— Bishram Ekata Mandali</p>
        `,
        attachments: pdfBuffer
          ? [
              {
                filename: `Donation_Receipt_${newRecord.id}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ]
          : undefined,
      });

      if (!isReceiptSent) {
        recordToReturn = await prisma.donationrecord.update({
          where: { id: newRecord.id },
          data: {
            isReceiptSent: true,
            updatedAt: new Date(),
          },
        });
      }
    } catch (emailError) {
      console.error('Failed to send donation confirmation email:', emailError);
    }

    // Admin notification (optional: also attach)
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Donation Logged: ${donorName}`,
        text:
          `A new donation has been logged.\n\n` +
          `Donor: ${donorName}\n` +
          `Email: ${donorEmail}\n` +
          `Amount: NPR ${Number(amount).toFixed(2)}\n` +
          `Purpose: ${normalizedPurpose}\n` +
          `Date: ${new Date(donationDate).toLocaleDateString()}\n\n` +
          `You can review this in the admin dashboard.`,
        html: `
          <p>A new donation has been logged.</p>
          <ul>
            <li><strong>Donor:</strong> ${donorName}</li>
            <li><strong>Email:</strong> ${donorEmail}</li>
            <li><strong>Amount:</strong> NPR ${Number(amount).toFixed(2)}</li>
            <li><strong>Purpose:</strong> ${normalizedPurpose}</li>
            <li><strong>Date:</strong> ${new Date(donationDate).toLocaleDateString()}</li>
          </ul>
          <p>You can review this in the admin dashboard.</p>
        `,
        attachments: pdfBuffer
          ? [
              {
                filename: `Donation_Receipt_${newRecord.id}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ]
          : undefined,
      });
    } catch (emailError) {
      console.error('Failed to send admin donation notification email:', emailError);
    }

    publishContentUpdate({
      type: 'donation',
      action: 'created',
      id: newRecord.id,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(recordToReturn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create donation record.' });
  }
});

// PUT (update) a donation record
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { donorName, donorEmail, amount, purpose, donationDate, paymentMethod, transactionReference, notes, isReceiptSent } =
    req.body;

  const normalizedPurpose = normalizeEnumValue(purpose, donationrecord_purpose);
  const normalizedPaymentMethod = normalizeEnumValue(paymentMethod, donationrecord_paymentMethod);

  if (!normalizedPurpose) {
    return res.status(400).json({ error: 'Invalid donation purpose.' });
  }

  if (paymentMethod && !normalizedPaymentMethod) {
    return res.status(400).json({ error: 'Invalid donation payment method.' });
  }

  try {
    const updatedRecord = await prisma.donationrecord.update({
      where: { id },
      data: {
        donorName,
        donorEmail,
        amount: Number(amount),
        purpose: normalizedPurpose,
        donationDate: new Date(donationDate),
        paymentMethod: normalizedPaymentMethod,
        transactionReference,
        notes,
        isReceiptSent: Boolean(isReceiptSent),
        updatedAt: new Date(),
      },
    });

    publishContentUpdate({
      type: 'donation',
      action: 'updated',
      id: updatedRecord.id,
      timestamp: new Date().toISOString(),
    });

    res.json(updatedRecord);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Donation record not found.' });
    }
    res.status(500).json({ error: 'Failed to update donation record.' });
  }
});

// DELETE a donation record
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.donationrecord.delete({ where: { id } });
    publishContentUpdate({ type: 'donation', action: 'deleted', id, timestamp: new Date().toISOString() });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Donation record not found.' });
    }
    res.status(500).json({ error: 'Failed to delete donation record.' });
  }
});

export default router; 
