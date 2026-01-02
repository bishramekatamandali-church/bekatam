import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { sendEmail } from '../services/emailService';

const router = express.Router();

const ADMIN_EMAIL = 'shahidsingh1432@gmail.com'; // Hardcoded admin email for notifications

// Helper to standardize the payload shape for the frontend
const shapeContactMessage = (message: any) => ({
  ...message,
  submittedAt: message.submittedAt,
  repliedAt: message.repliedAt,
});

// GET all contact messages (admin panel)
router.get('/', async (_req, res) => {
  try {
    const messages = await prisma.contactmessage.findMany({
      orderBy: { submittedAt: 'desc' },
    });
    res.json(messages.map(shapeContactMessage));
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
});

// POST a new contact message
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newContactMessage = await prisma.contactmessage.create({
      data: {
        id: crypto.randomUUID(), // REQUIRED in your schema
        name,
        email,
        subject,
        message,
        status: 'pending',
      },
    });

    // Send email notification to admin
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Contact Form Message: ${subject}`,
        text: `You have received a new message from the BEM Church website contact form.\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\nMessage:\n${message}\n\nYou can manage this message in the admin panel.`,
        html: `
          <p>You have received a new message from the BEM Church website contact form.</p>
          <h3>From: ${name} &lt;${email}&gt;</h3>
          <h3>Subject: ${subject}</h3>
          <hr>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>You can manage this message in the admin panel.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send contact message notification email, but message was saved to DB:", emailError);
      // Don't fail the request if only the email fails, since the message is saved.
    }

    res.status(201).json(shapeContactMessage(newContactMessage));
  } catch (error) {
    console.error("Error creating contact message:", error);
    res.status(500).json({ error: 'Failed to save contact message.' });
  }
});

// PUT to update a contact message status
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, replyNote } = req.body;

    if (!status || !['pending', 'replied'].includes(status)) {
        return res.status(400).json({ error: 'A valid status ("pending" or "replied") is required.' });
    }

    try {
        const updatedMessage = await prisma.contactmessage.update({
            where: { id },
            data: {
                status,
                replyNote: status === 'replied' ? replyNote : null,
                repliedAt: status === 'replied' ? new Date() : null,
            }
        });
        res.json(shapeContactMessage(updatedMessage));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Contact message not found.' });
        }
        res.status(500).json({ error: 'Failed to update contact message status.' });
    }
});

// DELETE a contact message
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.contactmessage.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Contact message not found.' });
        }
        res.status(500).json({ error: 'Failed to delete contact message.' });
    }
});


export default router;
