import express from 'express';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = express.Router();

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

export default router;
