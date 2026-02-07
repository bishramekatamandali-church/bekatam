import crypto from 'crypto';
import { prisma } from '../db';
import type { notification_type } from '@prisma/client';

export const createUserNotification = async (params: {
  targetUserId: string;
  message: string;
  link?: string;
  type: notification_type;
}) => {
  try {
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        targetUserId: params.targetUserId,
        message: params.message,
        link: params.link,
        type: params.type,
      },
    });
  } catch (error) {
    console.error('createUserNotification failed:', error);
  }
};

export const createAdminNotifications = async (params: {
  message: string;
  link?: string;
  type: notification_type;
}) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin', accountStatus: 'active' },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        id: crypto.randomUUID(),
        targetUserId: admin.id,
        message: params.message,
        link: params.link,
        type: params.type,
      })),
    });
  } catch (error) {
    console.error('createAdminNotifications failed:', error);
  }
};
