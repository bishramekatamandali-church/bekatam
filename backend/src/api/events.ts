
import express from 'express';
import { prisma } from '../db';
import { Prisma, eventitem } from '@prisma/client';

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
    const { date, videoUrl, audioUrl, ...restOfData } = req.body;
    
    // TODO: Get user from auth token for postedByOwnerId/Name
    const postedByOwnerId = '0'; // Placeholder
    const postedByOwnerName = 'Admin System'; // Placeholder

    const eventDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;

    try {
        const newEvent = await prisma.eventitem.create({
            data: {
                ...restOfData,
                date: eventDate,
                videoUrl,
                audioUrl,
                postedByOwnerId,
                postedByOwnerName,
                // Ensure optional numeric fields are handled
                capacity: restOfData.capacity ? parseInt(restOfData.capacity, 10) : undefined,
                likes: restOfData.likes || 0,
            }
        });
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
    const { date, videoUrl, audioUrl, ...restOfData } = req.body;

    const eventDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    
    try {
        const updatedEvent = await prisma.eventitem.update({
            where: { id: id },
            data: {
                ...restOfData,
                date: eventDate,
                videoUrl,
                audioUrl,
                // Ensure optional numeric fields are handled
                capacity: restOfData.capacity ? parseInt(restOfData.capacity, 10) : undefined,
                updatedAt: new Date(),
            }
        });
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
