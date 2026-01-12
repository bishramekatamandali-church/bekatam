"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const contentUpdates_1 = require("../services/contentUpdates");
const enumNormalization_1 = require("../utils/enumNormalization");
const databaseFallback_1 = require("../utils/databaseFallback");
const router = express_1.default.Router();
const normalizeStringArray = (value) => {
    if (Array.isArray(value)) {
        return value.map(String).map((entry) => entry.trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
};
// Helper to shape data for frontend, assuming frontend types.ts expects 'comments' array
const shapeEventForFrontend = (event) => {
    return {
        ...event,
        comments: [], // Comments handled separately
        // Prisma's DateTime can be an object, ensure it's ISO string for frontend
        date: event.date ? new Date(event.date).toISOString() : null,
        createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
        updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : null,
        locations: Array.isArray(event.locations) ? event.locations : [],
        conductedBy: Array.isArray(event.conductedBy) ? event.conductedBy : [],
        speakers: Array.isArray(event.speakers) ? event.speakers : [],
    };
};
// GET all events
router.get('/', async (req, res) => {
    try {
        const events = await db_1.prisma.eventitem.findMany({
            orderBy: {
                date: 'desc',
            },
        });
        res.json(events.map(shapeEventForFrontend));
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
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
        const event = await db_1.prisma.eventitem.findUnique({
            where: { id: id },
        });
        if (event) {
            res.json(shapeEventForFrontend(event));
        }
        else {
            res.status(404).json({ error: "Event not found" });
        }
    }
    catch (error) {
        console.error(`Error fetching event with id "${id}":`, error);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});
// POST a new event
router.post('/', async (req, res) => {
    // Note: In a real app, validate req.body against a schema
    const { title, description, imageUrl, linkPath: requestLinkPath, category, date, location, time, expectations, guests, eventType, scheduleType, scheduleNotes, locations, conductedBy, speakers, contactPerson, contactEmail, contactPhone, registrationLink, capacity, isFeeRequired, feeAmount, videoUrl, audioUrl, postedByAdminId, postedByAdminName, } = req.body;
    const eventDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const id = crypto_1.default.randomUUID();
    const linkPath = requestLinkPath || `/events/${id}`;
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.eventitem_category);
    const normalizedEventType = (0, enumNormalization_1.normalizeEnumValue)(eventType || 'REGULAR', client_1.eventitem_type);
    const normalizedScheduleType = scheduleType ? (0, enumNormalization_1.normalizeEnumValue)(scheduleType, client_1.eventitem_schedule_type) : undefined;
    const normalizedLocations = normalizeStringArray(locations);
    const normalizedConductedBy = normalizeStringArray(conductedBy);
    const normalizedSpeakers = normalizeStringArray(speakers);
    const primaryLocation = location || normalizedLocations[0] || null;
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid event category.' });
    }
    if (eventType && !normalizedEventType) {
        return res.status(400).json({ error: 'Invalid event type.' });
    }
    if (scheduleType && !normalizedScheduleType) {
        return res.status(400).json({ error: 'Invalid event schedule type.' });
    }
    try {
        const newEvent = await db_1.prisma.eventitem.create({
            data: {
                id,
                title,
                description,
                imageUrl,
                linkPath,
                category: normalizedCategory,
                date: eventDate,
                location: primaryLocation,
                time,
                expectations,
                guests,
                eventType: normalizedEventType,
                scheduleType: normalizedScheduleType,
                scheduleNotes,
                locations: normalizedLocations.length ? normalizedLocations : undefined,
                conductedBy: normalizedConductedBy.length ? normalizedConductedBy : undefined,
                speakers: normalizedSpeakers.length ? normalizedSpeakers : undefined,
                contactPerson,
                contactEmail,
                contactPhone,
                registrationLink,
                isFeeRequired,
                feeAmount,
                videoUrl,
                audioUrl,
                updatedAt: new Date(),
                postedByAdminId,
                postedByAdminName,
                // Ensure optional numeric fields are handled
                capacity: capacity ? parseInt(capacity, 10) : undefined,
            }
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'event', action: 'created', id: newEvent.id, timestamp: new Date().toISOString() });
        res.status(201).json(shapeEventForFrontend(newEvent));
    }
    catch (error) {
        console.error("Error creating event:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error creating event.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to create event' });
    }
});
// PUT (update) an event
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, imageUrl, linkPath, category, date, location, time, expectations, guests, eventType, scheduleType, scheduleNotes, locations, conductedBy, speakers, contactPerson, contactEmail, contactPhone, registrationLink, capacity, isFeeRequired, feeAmount, videoUrl, audioUrl, postedByAdminId, postedByAdminName, } = req.body;
    const eventDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.eventitem_category);
    const normalizedEventType = eventType ? (0, enumNormalization_1.normalizeEnumValue)(eventType, client_1.eventitem_type) : undefined;
    const normalizedScheduleType = scheduleType ? (0, enumNormalization_1.normalizeEnumValue)(scheduleType, client_1.eventitem_schedule_type) : undefined;
    const normalizedLocations = normalizeStringArray(locations);
    const normalizedConductedBy = normalizeStringArray(conductedBy);
    const normalizedSpeakers = normalizeStringArray(speakers);
    const primaryLocation = location !== undefined ? location || normalizedLocations[0] || null : normalizedLocations[0];
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid event category.' });
    }
    if (eventType && !normalizedEventType) {
        return res.status(400).json({ error: 'Invalid event type.' });
    }
    if (scheduleType && !normalizedScheduleType) {
        return res.status(400).json({ error: 'Invalid event schedule type.' });
    }
    try {
        const updatedEvent = await db_1.prisma.eventitem.update({
            where: { id: id },
            data: {
                title,
                description,
                imageUrl,
                linkPath,
                category: normalizedCategory,
                date: eventDate,
                location: primaryLocation,
                time,
                expectations,
                guests,
                eventType: normalizedEventType,
                scheduleType: normalizedScheduleType,
                scheduleNotes,
                locations: normalizedLocations.length ? normalizedLocations : undefined,
                conductedBy: normalizedConductedBy.length ? normalizedConductedBy : undefined,
                speakers: normalizedSpeakers.length ? normalizedSpeakers : undefined,
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
                postedByAdminId,
                postedByAdminName,
            }
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'event', action: 'updated', id: updatedEvent.id, timestamp: new Date().toISOString() });
        res.json(shapeEventForFrontend(updatedEvent));
    }
    catch (error) {
        console.error(`Error updating event with id "${id}":`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
        await db_1.prisma.eventitem.delete({
            where: { id: id },
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'event', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send(); // No Content
    }
    catch (error) {
        console.error(`Error deleting event with id "${id}":`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Event to delete not found.' });
            }
        }
        res.status(500).json({ error: 'Failed to delete event' });
    }
});
exports.default = router;
