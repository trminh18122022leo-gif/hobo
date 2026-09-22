import prisma from '@/lib/db';

export function getClientInfo(request: Request): { ip: string; userAgent: string } {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return { ip: ip.split(',')[0].trim(), userAgent };
}

export async function logAudit(params: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  Promise.resolve().then(async () => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          details: params.details ? JSON.stringify(params.details) : undefined,
          ip: params.ip,
          userAgent: params.userAgent,
        },
      });
    } catch (error: any) {
      // If user was deleted concurrently, persist audit log with decoupled userId in details
      if (error?.code === 'P2003' && params.userId) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: null,
              action: params.action,
              resource: params.resource,
              resourceId: params.resourceId,
              details: JSON.stringify({ ...(params.details || {}), targetUserId: params.userId }),
              ip: params.ip,
              userAgent: params.userAgent,
            },
          });
          return;
        } catch {}
      }
      if (process.env.NODE_ENV !== 'production') {
        console.error('Audit log failed:', error);
      }
    }
  });
}
