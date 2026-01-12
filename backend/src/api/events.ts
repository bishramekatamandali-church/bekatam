
import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, eventitem, eventitem_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

// Helper to shape data for frontend, assuming frontend types.ts expects 'comments' array
const shapeEventForFrontend = (event: eventitem): any => {
    return {
        ...event,
        comments: [], // Comments handled separately
        // Prisma's DateTime can be an object, ensure it's ISO string for frontend
        date: event.date ? new Date(event.date).toISOString() : null,
        createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
        updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : null,
    };
};

// GET all events
router.get('/', async (req, res) => {
    try {
        const events = await prisma.eventitem.findMany({
            orderBy: {
                date: 'desc',
            },
        });
        res.json(events.map(shapeEventForFrontend));
    } catch (error) {
        if (handleDatabaseFallback(req, res, error)) {
            return;
        }
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

// GET a single event by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const event = await prisma.eventitem.findUnique({
            where: { id: id },
        });
        if (event) {
            res.json(shapeEventForFrontend(event));
        } else {
            res.status(404).json({ error: "Event not found" });
        }
    } catch (error) {
        console.error(`Error fetching event with id "${id}":`, error);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

// POST a new event
router.post('/', async (req, res) => {
    // Note: In a real app, validate req.body against a schema
    const {
        title,
        description,
        imageUrl,
        linkPath: requestLinkPath,
        category,
        date,
        location,
        time,
        expectations,
        guests,
        contactPerson,
        contactEmail,
        contactPhone,
        registrationLink,
        capacity,
        isFeeRequired,
        feeAmount,
        videoUrl,
        audioUrl,
    } = req.body;
    
    const eventDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const id = crypto.randomUUID();
    const linkPath = requestLinkPath || `/events/${id}`;
    const normalizedCategory = normalizeEnumValue(category, eventitem_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid event category.' });
    }

    try {
        const newEvent = await prisma.eventitem.create({
            data: {
                id,
                title,
                description,
                imageUrl,
                linkPath,
                category: normalizedCategory,
                date: eventDate,
                location,
                time,
                expectations,
                guests,
                contactPerson,
                contactEmail,
                contactPhone,
                registrationLink,
                isFeeRequired,
                feeAmount,
                videoUrl,
                audioUrl,
                updatedAt: new Date(),
                // Ensure optional numeric fields are handled
                capacity: capacity ? parseInt(capacity, 10) : undefined,       
               }
        });
     publishContentUpdate({ type: 'event', action: 'created', id: newEvent.id, timestamp: new Date().toISOString() });
        res.status(201).json(shapeEventForFrontend(newEvent));
    } catch (error) {
        console.error("Error creating event:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error creating event.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// PUT (update) an event
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        imageUrl,
        linkPath,
        category,
        date,
        location,
        time,
        expectations,
        guests,
        contactPerson,
        contactEmail,
        contactPhone,
        registrationLink,
        capacity,
        isFeeRequired,
        feeAmount,
        videoUrl,
        audioUrl,
    } = req.body;

    const eventDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const normalizedCategory = normalizeEnumValue(category, eventitem_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid event category.' });
    }

    try {
        const updatedEvent = await prisma.eventitem.update({
            where: { id: id },
            data: {
                title,
                description,
                imageUrl,
                linkPath,
                category: normalizedCategory,
                date: eventDate,
                location,
                time,
                expectations,
                guests,
                contactPerson,
                contactEmail,
                contactPhone,
                registrationLink,
                isFeeRequired,
                feeAmount,
                videoUrl,
                audioUrl,
                // Ensure optional numeric fields are handled
                capacity: capacity ? parseInt(capacity, 10) : undefined,
                updatedAt: new Date(),
            }
        });
    publishContentUpdate({ type: 'event', action: 'updated', id: updatedEvent.id, timestamp: new Date().toISOString() });
        res.json(shapeEventForFrontend(updatedEvent));
    } catch (error) {
        console.error(`Error updating event with id "${id}":`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                 return res.status(404).json({ error: 'Event to update not found.' });
            }
            return res.status(400).json({ error: 'Database error updating event.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// DELETE an event
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.eventitem.delete({
            where: { id: id },
        });
    publishContentUpdate({ type: 'event', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Error deleting event with id "${id}":`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                 return res.status(404).json({ error: 'Event to delete not found.' });
            }
        }
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

export default router;
