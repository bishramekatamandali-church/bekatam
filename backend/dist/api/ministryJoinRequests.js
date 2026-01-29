"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const databaseFallback_1 = require("../utils/databaseFallback");
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';
const notifyAdminsOfJoinRequest = async (params) => {
    try {
        const admins = await db_1.prisma.user.findMany({
            where: { role: 'admin', accountStatus: 'active' },
            select: { id: true, email: true },
        });
        if (admins.length === 0)
            return;
        const linkPath = `/admin/ministry-join-requests?requestId=${params.requestId}`;
        const linkUrl = `${getFrontendUrl()}${linkPath}`;
        const message = `New ministry join request from ${params.userName} for ${params.ministryName}.`;
        await db_1.prisma.notification.createMany({
            data: admins.map((admin) => ({
                id: crypto_1.default.randomUUID(),
                targetUserId: admin.id,
                message,
                link: linkPath,
                type: 'admin_action',
            })),
        });
        await Promise.all(admins.map((admin) => (0, emailService_1.sendEmail)({
            to: admin.email,
            subject: `New Ministry Join Request: ${params.ministryName}`,
            text: `A new ministry join request has been submitted.\n\nUser: ${params.userName} (${params.userEmail})\nMinistry: ${params.ministryName}\n\nReview and process the request in the admin panel: ${linkUrl}`,
            html: `
                        <p>A new ministry join request has been submitted.</p>
                        <ul>
                          <li><strong>User:</strong> ${params.userName} (${params.userEmail})</li>
                          <li><strong>Ministry:</strong> ${params.ministryName}</li>
                        </ul>
                        <p>
                          <a href="${linkUrl}">Review and process the request</a>
                        </p>
                    `,
        }).catch((error) => {
            console.error('Failed to send ministry join request notification email:', error);
        })));
    }
    catch (error) {
        console.error('Failed to notify admins about ministry join request:', error);
    }
};
const notifyUserOfJoinRequest = async (params) => {
    try {
        await (0, emailService_1.sendEmail)({
            to: params.userEmail,
            subject: `We received your request to join ${params.ministryName}`,
            text: `Hello ${params.userName},\n\nWe have received your request to join ${params.ministryName}. Our team will review it soon, and we will notify you once a decision has been made.\n\nThank you for your interest!`,
            html: `
                <p>Hello ${params.userName},</p>
                <p>We have received your request to join <strong>${params.ministryName}</strong>. Our team will review it soon, and we will notify you once a decision has been made.</p>
                <p>Thank you for your interest!</p>
            `,
        });
    }
    catch (error) {
        console.error('Failed to send ministry join request confirmation email:', error);
    }
};
// GET all ministry join requests
router.get('/', async (req, res) => {
    try {
        const requests = await db_1.prisma.ministryjoinrequest.findMany({
            orderBy: { requestDate: 'desc' },
        });
        res.json(requests);
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: 'Failed to fetch ministry join requests.' });
    }
});
// POST a new ministry join request
router.post('/', async (req, res) => {
    const { userId, userName, userEmail, ministryId, ministryName, message, ministryGuidelines } = req.body;
    if (!userId || !userName || !userEmail || !ministryId || !ministryName) {
        return res.status(400).json({ error: 'Missing required fields for join request.' });
    }
    try {
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ error: 'User must be a registered account to submit a join request.' });
        }
        const existingRequest = await db_1.prisma.ministryjoinrequest.findFirst({
            where: {
                userId,
                ministryId,
                status: {
                    in: ['pending', 'approved'],
                },
            },
            orderBy: { requestDate: 'desc' },
        });
        if (existingRequest) {
            const message = existingRequest.status === 'approved'
                ? 'Your ministry join request has already been approved.'
                : 'Your ministry join request is already submitted and under review.';
            return res.status(409).json({ error: message, existingRequest });
        }
        const requestId = crypto_1.default.randomUUID();
        const newRequest = await db_1.prisma.$transaction(async (tx) => {
            const created = await tx.ministryjoinrequest.create({
                data: {
                    id: requestId,
                    userId,
                    userName,
                    userEmail,
                    ministryId,
                    ministryName,
                    message: message || '',
                    ministryGuidelines: ministryGuidelines || '',
                    status: 'pending',
                }
            });
            await tx.ministryjoinrequesthistory.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    requestId: created.id,
                    userId: created.userId,
                    userName: created.userName,
                    userEmail: created.userEmail,
                    ministryId: created.ministryId,
                    ministryName: created.ministryName,
                    status: created.status,
                    action: 'submitted',
                },
            });
            return created;
        });
        await notifyAdminsOfJoinRequest({
            requestId: newRequest.id,
            userName: newRequest.userName,
            userEmail: newRequest.userEmail,
            ministryName: newRequest.ministryName,
        });
        await notifyUserOfJoinRequest({
            userName: newRequest.userName,
            userEmail: newRequest.userEmail,
            ministryName: newRequest.ministryName,
        });
        res.status(201).json(newRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create ministry join request.' });
    }
});
// PUT to update a request's status
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes, processedByAdminId, processedByAdminName } = req.body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'A valid status is required.' });
    }
    try {
        const existingRequest = await db_1.prisma.ministryjoinrequest.findUnique({ where: { id } });
        if (!existingRequest) {
            return res.status(404).json({ error: 'Ministry join request not found.' });
        }
        const updatedRequest = await db_1.prisma.$transaction(async (tx) => {
            const updated = await tx.ministryjoinrequest.update({
                where: { id },
                data: {
                    status,
                    adminNotes: adminNotes || undefined,
                    processedDate: new Date(),
                    processedByAdminId: processedByAdminId || undefined,
                    processedByAdminName: processedByAdminName || undefined,
                }
            });
            await tx.ministryjoinrequesthistory.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    requestId: updated.id,
                    userId: updated.userId,
                    userName: updated.userName,
                    userEmail: updated.userEmail,
                    ministryId: updated.ministryId,
                    ministryName: updated.ministryName,
                    status: updated.status,
                    action: 'status_updated',
                    adminNotes: adminNotes || undefined,
                    performedByAdminId: processedByAdminId || undefined,
                    performedByAdminName: processedByAdminName || undefined,
                },
            });
            if (status === 'approved') {
                const existingMember = await tx.ministrymember.findFirst({
                    where: { userId: updated.userId },
                });
                if (!existingMember) {
                    const createdMember = await tx.ministrymember.create({
                        data: {
                            id: crypto_1.default.randomUUID(),
                            userId: updated.userId,
                            userName: updated.userName,
                            userEmail: updated.userEmail,
                            ministryId: updated.ministryId,
                            ministryName: updated.ministryName,
                            membershipType: 'member',
                            joinedAt: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                    await tx.ministrymemberhistory.create({
                        data: {
                            id: crypto_1.default.randomUUID(),
                            memberId: createdMember.id,
                            userId: createdMember.userId,
                            userName: createdMember.userName,
                            userEmail: createdMember.userEmail,
                            ministryId: createdMember.ministryId,
                            ministryName: createdMember.ministryName,
                            action: 'created',
                            details: 'Approved join request.',
                            performedByAdminId: processedByAdminId || undefined,
                            performedByAdminName: processedByAdminName || undefined,
                        },
                    });
                }
                else {
                    const previousMinistryId = existingMember.ministryId;
                    const previousMinistryName = existingMember.ministryName;
                    const isMove = Boolean(previousMinistryId && previousMinistryId !== updated.ministryId);
                    const updatedMember = await tx.ministrymember.update({
                        where: { id: existingMember.id },
                        data: {
                            userId: updated.userId,
                            userName: updated.userName,
                            userEmail: updated.userEmail,
                            ministryId: updated.ministryId,
                            ministryName: updated.ministryName,
                            membershipType: existingMember.membershipType || 'member',
                            updatedAt: new Date(),
                        },
                    });
                    await tx.ministrymemberhistory.create({
                        data: {
                            id: crypto_1.default.randomUUID(),
                            memberId: updatedMember.id,
                            userId: updatedMember.userId,
                            userName: updatedMember.userName,
                            userEmail: updatedMember.userEmail,
                            ministryId: updatedMember.ministryId,
                            ministryName: updatedMember.ministryName,
                            previousMinistryId,
                            previousMinistryName,
                            action: isMove ? 'moved' : 'updated',
                            details: isMove ? 'Approved join request and moved member.' : 'Approved join request.',
                            performedByAdminId: processedByAdminId || undefined,
                            performedByAdminName: processedByAdminName || undefined,
                        },
                    });
                }
            }
            return updated;
        });
        res.json(updatedRequest);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Ministry join request not found.' });
        }
        res.status(500).json({ error: 'Failed to update ministry join request status.' });
    }
});
exports.default = router;
