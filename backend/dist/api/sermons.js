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
const isMissingColumnError = (error, column) => {
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
        const message = typeof error.message === 'string' ? error.message : '';
        return message.includes(column);
    }
    if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        return error.message.includes(column);
    }
    return false;
};
const getMissingSermonColumns = (error) => {
    const missing = new Set();
    if (isMissingColumnError(error, 'location')) {
        missing.add('location');
    }
    if (isMissingColumnError(error, 'postedByAdminId')) {
        missing.add('postedByAdminId');
    }
    if (isMissingColumnError(error, 'postedByAdminName')) {
        missing.add('postedByAdminName');
    }
    return missing;
};
const buildSermonSelect = (includeLocation, includeAdminFields) => ({
    id: true,
    title: true,
    description: true,
    imageUrl: true,
    linkPath: true,
    category: true,
    date: true,
    ...(includeAdminFields ? { postedByAdminId: true, postedByAdminName: true } : {}),
    createdAt: true,
    updatedAt: true,
    speaker: true,
    scripture: true,
    videoUrl: true,
    audioUrl: true,
    fullContent: true,
    likes: true,
    ...(includeLocation ? { location: true } : {}),
    comment: true,
});
const removeMissingColumns = (data, missing) => {
    if (missing.size === 0) {
        return data;
    }
    const pruned = { ...data };
    for (const column of missing) {
        delete pruned[column];
    }
    return pruned;
};
// Helper to ensure the sermon object sent to the frontend has the expected shape
const shapeSermonForFrontend = (s) => {
    const { comment, ...sermon } = s;
    const comments = Array.isArray(comment) ? comment.map((c) => ({
        id: c.id,
        itemId: sermon.id,
        itemType: 'sermon',
        userId: c.userId ?? null,
        userName: c.userName,
        userProfileImageUrl: c.userProfileImageUrl ?? null,
        isGuest: c.isGuest ?? false,
        guestEmail: c.guestEmail ?? null,
        guestPhone: c.guestPhone ?? null,
        text: c.text,
        timestamp: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
        editedAt: c.editedAt ? new Date(c.editedAt).toISOString() : null,
    })) : [];
    comments.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return { ...sermon, comments };
};
// GET all sermons
router.get('/', async (req, res) => {
    try {
        const sermons = await db_1.prisma.sermon.findMany({
            select: buildSermonSelect(true, true),
            orderBy: { date: 'desc' },
        });
        res.json(sermons.map(shapeSermonForFrontend));
    }
    catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const sermons = await db_1.prisma.sermon.findMany({
                    select: buildSermonSelect(!missingColumns.has('location'), !missingColumns.has('postedByAdminId') && !missingColumns.has('postedByAdminName')),
                    orderBy: { date: 'desc' },
                });
                res.json(sermons.map(shapeSermonForFrontend));
                return;
            }
            catch (fallbackError) {
                if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, fallbackError)) {
                    return;
                }
                console.error("Error fetching sermons without location:", fallbackError);
                res.status(500).json({ error: "Failed to fetch sermons" });
                return;
            }
        }
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        console.error("Error fetching sermons:", error);
        res.status(500).json({ error: "Failed to fetch sermons" });
    }
});
// GET a single sermon by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sermon = await db_1.prisma.sermon.findUnique({
            where: { id: id },
            select: buildSermonSelect(true, true),
        });
        if (sermon) {
            res.json(shapeSermonForFrontend(sermon));
        }
        else {
            res.status(404).json({ error: "Sermon not found" });
        }
    }
    catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const sermon = await db_1.prisma.sermon.findUnique({
                    where: { id: id },
                    select: buildSermonSelect(!missingColumns.has('location'), !missingColumns.has('postedByAdminId') && !missingColumns.has('postedByAdminName')),
                });
                if (sermon) {
                    res.json(shapeSermonForFrontend(sermon));
                }
                else {
                    res.status(404).json({ error: "Sermon not found" });
                }
                return;
            }
            catch (fallbackError) {
                console.error(`Error fetching sermon with id "${id}" without location:`, fallbackError);
                res.status(500).json({ error: "Failed to fetch sermon" });
                return;
            }
        }
        console.error(`Error fetching sermon with id "${id}":`, error);
        res.status(500).json({ error: "Failed to fetch sermon" });
    }
});
// POST a new sermon
router.post('/', async (req, res) => {
    const { title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl, location, postedByAdminId, postedByAdminName } = req.body;
    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const id = crypto_1.default.randomUUID();
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.sermon_category);
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid sermon category.' });
    }
    try {
        const newSermon = await db_1.prisma.sermon.create({
            data: {
                id, // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                title,
                description,
                date: sermonDate, // Use the validated date or null
                category: normalizedCategory,
                speaker,
                scripture,
                videoUrl,
                audioUrl,
                fullContent,
                imageUrl,
                location,
                postedByAdminId,
                postedByAdminName,
                linkPath: `/sermons/${id}`,
            }
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'sermon', action: 'created', id: newSermon.id, timestamp: new Date().toISOString() });
        res.status(201).json(shapeSermonForFrontend(newSermon));
    }
    catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const newSermon = await db_1.prisma.sermon.create({
                    data: removeMissingColumns({
                        id,
                        updatedAt: new Date(),
                        title,
                        description,
                        date: sermonDate,
                        category: normalizedCategory,
                        speaker,
                        scripture,
                        videoUrl,
                        audioUrl,
                        fullContent,
                        imageUrl,
                        location,
                        postedByAdminId,
                        postedByAdminName,
                        linkPath: `/sermons/${id}`,
                    }, missingColumns),
                });
                (0, contentUpdates_1.publishContentUpdate)({ type: 'sermon', action: 'created', id: newSermon.id, timestamp: new Date().toISOString() });
                res.status(201).json(shapeSermonForFrontend(newSermon));
                return;
            }
            catch (fallbackError) {
                console.error("Error creating sermon without location:", fallbackError);
                if (fallbackError instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return res.status(400).json({ error: 'Database error creating sermon.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to create sermon' });
                return;
            }
        }
        console.error("Error creating sermon:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error creating sermon.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to create sermon' });
    }
});
// PUT (update) a sermon
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl, location, postedByAdminId, postedByAdminName } = req.body;
    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.sermon_category);
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid sermon category.' });
    }
    try {
        const updatedSermon = await db_1.prisma.sermon.update({
            where: { id: id },
            data: {
                title,
                description,
                date: sermonDate, // Use the validated date or null
                category: normalizedCategory,
                speaker,
                scripture,
                videoUrl,
                audioUrl,
                fullContent,
                imageUrl,
                location,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            }
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'sermon', action: 'updated', id: updatedSermon.id, timestamp: new Date().toISOString() });
        res.json(shapeSermonForFrontend(updatedSermon));
    }
    catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const updatedSermon = await db_1.prisma.sermon.update({
                    where: { id: id },
                    data: removeMissingColumns({
                        title,
                        description,
                        date: sermonDate,
                        category: normalizedCategory,
                        speaker,
                        scripture,
                        videoUrl,
                        audioUrl,
                        fullContent,
                        imageUrl,
                        location,
                        postedByAdminId,
                        postedByAdminName,
                        updatedAt: new Date(),
                    }, missingColumns),
                });
                (0, contentUpdates_1.publishContentUpdate)({ type: 'sermon', action: 'updated', id: updatedSermon.id, timestamp: new Date().toISOString() });
                res.json(shapeSermonForFrontend(updatedSermon));
                return;
            }
            catch (fallbackError) {
                console.error(`Error updating sermon with id "${id}" without location:`, fallbackError);
                if (fallbackError instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (fallbackError.code === 'P2025') {
                        return res.status(404).json({ error: 'Sermon to update not found.' });
                    }
                    return res.status(400).json({ error: 'Database error updating sermon.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to update sermon' });
                return;
            }
        }
        console.error(`Error updating sermon with id "${id}":`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Sermon to update not found.' });
            }
            return res.status(400).json({ error: 'Database error updating sermon.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to update sermon' });
    }
});
// DELETE a sermon
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.sermon.delete({
            where: { id: id },
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'sermon', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send(); // No Content
    }
    catch (error) {
        console.error(`Error deleting sermon with id "${id}":`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Sermon to delete not found.' });
            }
        }
        res.status(500).json({ error: 'Failed to delete sermon' });
    }
});
exports.default = router;
