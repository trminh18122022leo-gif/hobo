/**
 * Daily Cron Task: Hard-delete accounts that have been soft-deleted for more than 30 days
 * Feature D.3: 30-day grace period expiration enforcement
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeExpiredSoftDeletedUsers() {
  console.log('🧹 [PURGE JOB] Starting daily check for expired soft-deleted accounts...');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const expiredUsers = await prisma.user.findMany({
      where: {
        status: 'soft_deleted',
        softDeletedAt: {
          lt: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        email: true,
        softDeletedAt: true,
      },
    });

    console.log(`🔍 Found ${expiredUsers.length} accounts beyond 30-day grace period.`);

    for (const user of expiredUsers) {
      console.log(`❌ Permanently purging user: ${user.id} (${user.email}), soft-deleted on ${user.softDeletedAt}`);

      // Delete user (foreign key cascades will remove profile, tokens, trackers, etc.)
      await prisma.user.delete({
        where: { id: user.id },
      });
    }

    console.log(`✅ [PURGE JOB] Completed. Successfully purged ${expiredUsers.length} expired accounts.`);
  } catch (error) {
    console.error('❌ [PURGE JOB] Error executing purge task:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

purgeExpiredSoftDeletedUsers();
