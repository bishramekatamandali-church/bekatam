import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import { sendEmail } from '../services/emailService';

const router = express.Router();

const sendUserActionEmail = async (params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  try {
    await sendEmail(params);
  } catch (error) {
    console.error('Failed to send user action email:', error);
  }
};

const applyUserAction = async (request: {
  id: string;
  actionType: 'block' | 'delete' | 'unblock';
  userId: string;
  reason: string;
}) => {
  const user = await prisma.user.findUnique({ where: { id: request.userId } });
  if (!user) {
    return { ok: false, error: 'User not found.' };
  }

  if (request.actionType === 'block') {
    if (user.accountStatus === 'blocked') {
      return { ok: false, error: 'User already blocked.' };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: 'blocked', blockedAt: new Date(), deletedAt: null },
    });
    await sendUserActionEmail({
      to: user.email,
      subject: 'Your account has been blocked',
      text: `Hello ${user.fullName},\n\nYour account has been blocked by the admin team.\nReason: ${request.reason}\n\nIf you believe this is a mistake, you may submit a request to unblock your account.\n\n— Bishram Ekata Mandali`,
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Your account has been blocked by the admin team.</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
        <p>If you believe this is a mistake, you may submit a request to unblock your account.</p>
        <p>— Bishram Ekata Mandali</p>
      `,
    });
  }

  if (request.actionType === 'delete') {
    if (user.accountStatus === 'deleted') {
      return { ok: false, error: 'User already deleted.' };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: 'deleted', deletedAt: new Date(), blockedAt: null },
    });
    await sendUserActionEmail({
      to: user.email,
      subject: 'Your account has been deleted',
      text: `Hello ${user.fullName},\n\nYour account has been deleted by the admin team.\nReason: ${request.reason}\n\nIf you believe this is a mistake, please contact support.\n\n— Bishram Ekata Mandali`,
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Your account has been deleted by the admin team.</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
        <p>If you believe this is a mistake, please contact support.</p>
        <p>— Bishram Ekata Mandali</p>
      `,
    });
  }

  if (request.actionType === 'unblock') {
    if (user.accountStatus !== 'blocked') {
      return { ok: false, error: 'User is not blocked.' };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: 'active', blockedAt: null },
    });
    await sendUserActionEmail({
      to: user.email,
      subject: 'Your account has been unblocked',
      text: `Hello ${user.fullName},\n\nYour account has been unblocked and full access has been restored.\n\n— Bishram Ekata Mandali`,
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Your account has been unblocked and full access has been restored.</p>
        <p>— Bishram Ekata Mandali</p>
      `,
    });
  }

  return { ok: true };
};

/**
 * Admin-only: list all users (safe fields only)
 * GET /api/users
 */
router.get('/', authenticateToken, authorizeAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        accountStatus: true,
        blockedAt: true,
        deletedAt: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(users);
  } catch (e) {
    console.error('GET /api/users error:', e);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

/**
 * Admin-only: update a user's role
 * PUT /api/users/:id/role
 * body: { role: "user" | "admin" }
 *
 * Safety: limit max admins to 3 (based on your frontend note)
 */
router.put('/:id/role', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: string };

    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid role. Allowed: user, admin' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found.' });

    // Enforce max admins = 3 when promoting user -> admin
    if (role === 'admin' && target.role !== 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount >= 3) {
        return res.status(400).json({ error: 'Max 3 admins allowed.' });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        accountStatus: true,
        blockedAt: true,
        deletedAt: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (e) {
    console.error('PUT /api/users/:id/role error:', e);
    return res.status(500).json({ error: 'Failed to update role.' });
  }
});


/**
 * Update user profile (self or admin)
 * PUT /api/users/:id/profile
 */
router.put('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user as { id?: string; role?: string } | undefined;

    if (!requester?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (requester.id !== id && requester.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (Object.prototype.hasOwnProperty.call(req.body, 'username')) {
      return res.status(400).json({ error: 'Username cannot be changed.' });
    }

    const {
      fullName,
      email,
      countryCode,
      phone,
      profileImageUrl,
      coverPhotoUrl,
      bio,
      hometown,
      currentCity,
      work,
      education,
      relationshipStatus,
      interests,
      favoriteScripture,
      receiveContentUpdateNotifications,
      receivePrayerRequestNotifications,
      receiveTestimonialNotifications,
      profileInSearchPrivacy,
    } = req.body as {
      fullName?: string;
      email?: string;
      countryCode?: string;
      phone?: string;
      profileImageUrl?: string | null;
      coverPhotoUrl?: string | null;
      bio?: string | null;
      hometown?: string | null;
      currentCity?: string | null;
      work?: string | null;
      education?: string | null;
      relationshipStatus?: string | null;
      interests?: string | null;
      favoriteScripture?: string | null;
      receiveContentUpdateNotifications?: boolean;
      receivePrayerRequestNotifications?: boolean;
      receiveTestimonialNotifications?: boolean;
      profileInSearchPrivacy?: boolean;
    };

    const data: Record<string, unknown> = {};

    if (typeof fullName === 'string') data.fullName = fullName;
    if (typeof email === 'string') data.email = email;
    if (typeof countryCode === 'string') data.countryCode = countryCode;
    if (typeof phone === 'string') data.phone = phone;
    if (profileImageUrl !== undefined) data.profileImageUrl = profileImageUrl;
    if (coverPhotoUrl !== undefined) data.coverPhotoUrl = coverPhotoUrl;
    if (bio !== undefined) data.bio = bio;
    if (hometown !== undefined) data.hometown = hometown;
    if (currentCity !== undefined) data.currentCity = currentCity;
    if (work !== undefined) data.work = work;
    if (education !== undefined) data.education = education;
    if (relationshipStatus !== undefined) data.relationshipStatus = relationshipStatus;
    if (interests !== undefined) data.interests = interests;
    if (favoriteScripture !== undefined) data.favoriteScripture = favoriteScripture;
    if (receiveContentUpdateNotifications !== undefined) {
      data.receiveContentUpdateNotifications = receiveContentUpdateNotifications;
    }
    if (receivePrayerRequestNotifications !== undefined) {
      data.receivePrayerRequestNotifications = receivePrayerRequestNotifications;
    }
    if (receiveTestimonialNotifications !== undefined) {
      data.receiveTestimonialNotifications = receiveTestimonialNotifications;
    }
    if (profileInSearchPrivacy !== undefined) data.profileInSearchPrivacy = profileInSearchPrivacy;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        accountStatus: true,
        blockedAt: true,
        deletedAt: true,
        profileImageUrl: true,
        coverPhotoUrl: true,
        bio: true,
        hometown: true,
        currentCity: true,
        work: true,
        education: true,
        relationshipStatus: true,
        interests: true,
        favoriteScripture: true,
        receiveContentUpdateNotifications: true,
        receivePrayerRequestNotifications: true,
        receiveTestimonialNotifications: true,
        profileInSearchPrivacy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (e) {
    console.error('PUT /api/users/:id/profile error:', e);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * Admin-only: create a block/delete action request for a user
 * POST /api/users/:id/actions
 * body: { actionType: "block" | "delete", reason: string }
 */
router.post('/:id/actions', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id: userId } = req.params;
    const requester = req.user as { id?: string; role?: string; fullName?: string } | undefined;
    const { actionType, reason } = req.body as { actionType?: 'block' | 'delete'; reason?: string };

    if (!requester?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!actionType || !['block', 'delete'].includes(actionType)) {
      return res.status(400).json({ error: 'Invalid action type.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A reason is required.' });
    }

    if (requester.id === userId) {
      return res.status(400).json({ error: 'You cannot perform this action on yourself.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (actionType === 'block' && targetUser.accountStatus === 'blocked') {
      return res.status(400).json({ error: 'User is already blocked.' });
    }

    if (actionType === 'delete' && targetUser.accountStatus === 'deleted') {
      return res.status(400).json({ error: 'User is already deleted.' });
    }

    const existingPending = await prisma.useractionrequest.findFirst({
      where: { userId, actionType, status: 'pending' },
    });
    if (existingPending) {
      return res.status(409).json({ error: 'A pending request already exists for this action.' });
    }

    const request = await prisma.useractionrequest.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        actionType,
        reason: reason.trim(),
        requestedByAdminId: requester.id,
        requestedByAdminName: requester.fullName || null,
      },
    });

    const activeAdmins = await prisma.user.count({
      where: { role: 'admin', accountStatus: 'active' },
    });
    const requiredApprovals = Math.max(activeAdmins - 1, 0);

    if (requiredApprovals === 0) {
      const applyResult = await applyUserAction({
        id: request.id,
        actionType: request.actionType,
        userId: request.userId,
        reason: request.reason,
      });
      if (!applyResult.ok) {
        return res.status(400).json({ error: applyResult.error });
      }
      await prisma.useractionrequest.update({
        where: { id: request.id },
        data: {
          status: 'approved',
          processedAt: new Date(),
          processedByAdminId: requester.id,
        },
      });
    }

    return res.status(201).json({ success: true, requestId: request.id });
  } catch (error) {
    console.error('POST /api/users/:id/actions error:', error);
    return res.status(500).json({ error: 'Failed to create user action request.' });
  }
});

/**
 * Admin-only: list user action requests
 * GET /api/users/actions
 */
router.get('/actions', authenticateToken, authorizeAdmin, async (_req, res) => {
  try {
    const requests = await prisma.useractionrequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        approvals: true,
        user: { select: { id: true, fullName: true, email: true, accountStatus: true } },
        requestedByAdmin: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    const activeAdmins = await prisma.user.count({
      where: { role: 'admin', accountStatus: 'active' },
    });

    const payload = requests.map((request) => {
      const requesterIsAdmin = request.requestedByAdmin?.role === 'admin';
      const requiredApprovals = Math.max(activeAdmins - (requesterIsAdmin ? 1 : 0), 0);

      return {
      id: request.id,
      userId: request.userId,
      actionType: request.actionType,
      reason: request.reason,
      status: request.status,
      requestedByAdminId: request.requestedByAdminId,
      requestedByAdminName: request.requestedByAdmin?.fullName || null,
      createdAt: request.createdAt,
      processedAt: request.processedAt,
      processedByAdminId: request.processedByAdminId,
      approvals: request.approvals.map((approval) => ({
        id: approval.id,
        adminId: approval.adminId,
        adminName: approval.adminName,
        approvedAt: approval.approvedAt,
      })),
      requiredApprovals,
      user: request.user,
      };
    });

    return res.json(payload);
  } catch (error) {
    console.error('GET /api/users/actions error:', error);
    return res.status(500).json({ error: 'Failed to fetch action requests.' });
  }
});

/**
 * Admin-only: approve a pending action request
 * POST /api/users/actions/:requestId/approve
 */
router.post('/actions/:requestId/approve', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const approver = req.user as { id?: string; fullName?: string } | undefined;

    if (!approver?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const request = await prisma.useractionrequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, requestedByAdmin: { select: { id: true, role: true } } },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is no longer pending.' });
    }

    if (request.requestedByAdminId === approver.id) {
      return res.status(400).json({ error: 'Requesting admin cannot approve their own request.' });
    }

    const existingApproval = await prisma.useractionapproval.findUnique({
      where: { requestId_adminId: { requestId, adminId: approver.id } },
    });

    if (existingApproval) {
      return res.status(400).json({ error: 'You have already approved this request.' });
    }

    await prisma.useractionapproval.create({
      data: {
        id: crypto.randomUUID(),
        requestId,
        adminId: approver.id,
        adminName: approver.fullName || null,
      },
    });

    const activeAdmins = await prisma.user.count({
      where: { role: 'admin', accountStatus: 'active' },
    });
    const requesterIsAdmin = request.requestedByAdmin?.role === 'admin';
    const requiredApprovals = Math.max(activeAdmins - (requesterIsAdmin ? 1 : 0), 0);

    const approvalsCount = await prisma.useractionapproval.count({
      where: { requestId },
    });

    if (approvalsCount >= requiredApprovals) {
      const applyResult = await applyUserAction({
        id: request.id,
        actionType: request.actionType,
        userId: request.userId,
        reason: request.reason,
      });
      if (!applyResult.ok) {
        return res.status(400).json({ error: applyResult.error });
      }
      await prisma.useractionrequest.update({
        where: { id: request.id },
        data: {
          status: 'approved',
          processedAt: new Date(),
          processedByAdminId: approver.id,
        },
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('POST /api/users/actions/:requestId/approve error:', error);
    return res.status(500).json({ error: 'Failed to approve request.' });
  }
});

/**
 * User: request unblock
 * POST /api/users/unblock-request
 * body: { reason: string }
 */
router.post('/unblock-request', authenticateToken, async (req, res) => {
  try {
    const requester = req.user as { id?: string; fullName?: string } | undefined;
    const { reason } = req.body as { reason?: string };

    if (!requester?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A reason is required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: requester.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.accountStatus !== 'blocked') {
      return res.status(400).json({ error: 'Your account is not blocked.' });
    }

    const existingPending = await prisma.useractionrequest.findFirst({
      where: { userId: user.id, actionType: 'unblock', status: 'pending' },
    });
    if (existingPending) {
      return res.status(409).json({ error: 'A pending unblock request already exists.' });
    }

    const request = await prisma.useractionrequest.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        actionType: 'unblock',
        reason: reason.trim(),
        requestedByAdminId: requester.id,
        requestedByAdminName: requester.fullName || null,
      },
    });

    return res.status(201).json({ success: true, requestId: request.id });
  } catch (error) {
    console.error('POST /api/users/unblock-request error:', error);
    return res.status(500).json({ error: 'Failed to request unblock.' });
  }
});

export default router;
