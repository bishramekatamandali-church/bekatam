"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
const enumNormalization_1 = require("../utils/enumNormalization");
const router = express_1.default.Router();
// All roster templates and generated schedules
router.get('/', async (_req, res) => {
    try {
        const [rosters, schedules] = await Promise.all([
            db_1.prisma.fellowshiprosteritem.findMany({ include: { responsibility: true }, orderBy: { assignedDate: 'desc' } }),
            db_1.prisma.generatedscheduleitem.findMany({ include: { responsibility: true }, orderBy: { scheduledDate: 'desc' } }),
        ]);
        res.json({ rosters, schedules });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load fellowship schedules.' });
    }
});
router.post('/rosters', async (req, res) => {
    const { rosterType, groupNameOrEventTitle, assignedDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isTemplate, responsibilities, postedByAdminId, postedByAdminName } = req.body;
    if (!rosterType || !groupNameOrEventTitle || !assignedDate || !timeSlot) {
        return res.status(400).json({ error: 'Roster type, title, assigned date, and time slot are required.' });
    }
    const normalizedRosterType = (0, enumNormalization_1.normalizeEnumValue)(rosterType, client_1.fellowshiprosteritem_rosterType);
    if (!normalizedRosterType) {
        return res.status(400).json({ error: 'Invalid roster type.' });
    }
    try {
        const created = await db_1.prisma.fellowshiprosteritem.create({
            data: {
                id: crypto_1.default.randomUUID(),
                rosterType: normalizedRosterType,
                groupNameOrEventTitle,
                assignedDate: new Date(assignedDate),
                timeSlot,
                location,
                contactNumber,
                additionalNotesOrProgramDetails,
                isTemplate: Boolean(isTemplate),
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
                responsibility: responsibilities
                    ? {
                        create: responsibilities.map((item) => ({
                            id: crypto_1.default.randomUUID(),
                            role: item.role,
                            assignedTo: item.assignedTo,
                        })),
                    }
                    : undefined,
            },
            include: { responsibility: true },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create roster item.' });
    }
});
router.put('/rosters/:id', async (req, res) => {
    const { id } = req.params;
    const { rosterType, groupNameOrEventTitle, assignedDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isTemplate, responsibilities, postedByAdminId, postedByAdminName } = req.body;
    const normalizedRosterType = (0, enumNormalization_1.normalizeEnumValue)(rosterType, client_1.fellowshiprosteritem_rosterType);
    if (rosterType && !normalizedRosterType) {
        return res.status(400).json({ error: 'Invalid roster type.' });
    }
    try {
        const updated = await db_1.prisma.fellowshiprosteritem.update({
            where: { id },
            data: {
                rosterType: normalizedRosterType,
                groupNameOrEventTitle,
                assignedDate: assignedDate ? new Date(assignedDate) : undefined,
                timeSlot,
                location,
                contactNumber,
                additionalNotesOrProgramDetails,
                isTemplate,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
                responsibility: responsibilities
                    ? {
                        deleteMany: {},
                        create: responsibilities.map((item) => ({
                            id: crypto_1.default.randomUUID(),
                            role: item.role,
                            assignedTo: item.assignedTo,
                        })),
                    }
                    : undefined,
            },
            include: { responsibility: true },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Roster item not found.' });
        }
        res.status(500).json({ error: 'Failed to update roster item.' });
    }
});
router.delete('/rosters/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.fellowshiprosteritem.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Roster item not found.' });
        }
        res.status(500).json({ error: 'Failed to delete roster item.' });
    }
});
router.post('/generated', async (req, res) => {
    const { basedOnRosterItemId, rosterType, groupNameOrEventTitle, scheduledDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isPublishedAsEvent, publishedEventId, adminNotes, responsibilities, postedByAdminId, postedByAdminName } = req.body;
    if (!rosterType || !groupNameOrEventTitle || !scheduledDate || !timeSlot) {
        return res.status(400).json({ error: 'Roster type, title, scheduled date, and time slot are required.' });
    }
    const normalizedRosterType = (0, enumNormalization_1.normalizeEnumValue)(rosterType, client_1.generatedscheduleitem_rosterType);
    if (!normalizedRosterType) {
        return res.status(400).json({ error: 'Invalid roster type.' });
    }
    try {
        const created = await db_1.prisma.generatedscheduleitem.create({
            data: {
                id: crypto_1.default.randomUUID(),
                basedOnRosterItemId,
                rosterType: normalizedRosterType,
                groupNameOrEventTitle,
                scheduledDate: new Date(scheduledDate),
                timeSlot,
                location,
                contactNumber,
                additionalNotesOrProgramDetails,
                isPublishedAsEvent: Boolean(isPublishedAsEvent),
                publishedEventId,
                adminNotes,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
                responsibility: responsibilities
                    ? {
                        create: responsibilities.map((item) => ({
                            id: crypto_1.default.randomUUID(),
                            role: item.role,
                            assignedTo: item.assignedTo,
                        })),
                    }
                    : undefined,
            },
            include: { responsibility: true },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create generated schedule item.' });
    }
});
router.put('/generated/:id', async (req, res) => {
    const { id } = req.params;
    const { basedOnRosterItemId, rosterType, groupNameOrEventTitle, scheduledDate, timeSlot, location, contactNumber, additionalNotesOrProgramDetails, isPublishedAsEvent, publishedEventId, adminNotes, responsibilities, postedByAdminId, postedByAdminName } = req.body;
    const normalizedRosterType = (0, enumNormalization_1.normalizeEnumValue)(rosterType, client_1.generatedscheduleitem_rosterType);
    if (rosterType && !normalizedRosterType) {
        return res.status(400).json({ error: 'Invalid roster type.' });
    }
    try {
        const updated = await db_1.prisma.generatedscheduleitem.update({
            where: { id },
            data: {
                basedOnRosterItemId,
                rosterType: normalizedRosterType,
                groupNameOrEventTitle,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
                timeSlot,
                location,
                contactNumber,
                additionalNotesOrProgramDetails,
                isPublishedAsEvent,
                publishedEventId,
                adminNotes,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
                responsibility: responsibilities
                    ? {
                        deleteMany: {},
                        create: responsibilities.map((item) => ({
                            id: crypto_1.default.randomUUID(),
                            role: item.role,
                            assignedTo: item.assignedTo,
                        })),
                    }
                    : undefined,
            },
            include: { responsibility: true },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Generated schedule item not found.' });
        }
        res.status(500).json({ error: 'Failed to update generated schedule item.' });
    }
});
router.delete('/generated/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.generatedscheduleitem.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Generated schedule item not found.' });
        }
        res.status(500).json({ error: 'Failed to delete generated schedule item.' });
    }
});
exports.default = router;
