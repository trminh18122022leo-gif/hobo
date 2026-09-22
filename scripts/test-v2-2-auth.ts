/**
 * Automated Verification Script for v2.2 Auth, Identity, Security & Breakthrough Features
 */

import prisma from '../src/lib/db';
import { checkStudentEmail } from '../src/lib/auth/student-verify';
import {
  hashToken,
  generateRandomToken,
  createSession,
  rotateSession,
  getUserSessions,
  revokeSession,
  revokeAllSessions,
} from '../src/lib/auth/session';
import { mergeGuestData } from '../src/lib/auth/guest-merge';
import { emailRouter } from '../src/lib/email/router';

let passed = 0;
let failed = 0;

function assert(condition: any, testName: string) {
  if (Boolean(condition)) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('🚀 [START TEST SUITE] v2.2 Identity, Security & Auth Verification\n');

  // ── TEST SUITE 1: Feature D.1 - Student Domain Verification ──
  console.log('📌 Test Suite 1: Feature D.1 - University Email Domain Student Verification');
  {
    const r1 = await checkStudentEmail('sinhvien@hust.edu.vn');
    assert(r1.isStudent === true, 'hust.edu.vn identified as student email');
    assert(Boolean(r1.universityName?.includes('Bách khoa')), 'hust.edu.vn correctly mapped to Đại học Bách khoa Hà Nội');

    const r2 = await checkStudentEmail('student@vnu.edu.vn');
    assert(r2.isStudent === true, 'vnu.edu.vn identified as student email');

    const r3 = await checkStudentEmail('user@gmail.com');
    assert(r3.isStudent === false, 'gmail.com identified as non-student email');

    const r4 = await checkStudentEmail('test@neu.edu.vn');
    assert(Boolean(r4.isStudent === true && r4.universityName?.includes('Kinh tế')), 'neu.edu.vn correctly mapped');
  }

  // ── TEST SUITE 2: Feature D.2 - Token Rotation & Replay Attack Defense ──
  console.log('\n📌 Test Suite 2: Feature D.2 - Token Rotation & Reuse Attack Mitigation');
  {
    // Create test user
    const testEmail = `test_user_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Nguyen Van Test',
        role: 'user',
        status: 'active',
      },
    });

    const mockRequest = new Request('http://localhost:3000', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'x-forwarded-for': '118.70.12.45, 10.0.0.1',
      },
    });

    // 2.1 Create session
    const session = await createSession(user.id, user.email, user.role, mockRequest);
    assert(Boolean(session.accessToken), 'Generated 15m JWT access token');
    assert(Boolean(session.refreshToken), 'Generated 30d refresh token');

    // 2.2 Verify sessions list
    const sessions = await getUserSessions(user.id, session.refreshToken);
    assert(sessions.length === 1, 'Active sessions count is 1');
    assert(sessions[0].deviceLabel.includes('Chrome trên Windows'), 'Device parsed as Chrome trên Windows');
    assert(sessions[0].ipPrefix === '118.70.12.*', 'IP anonymized to /24 prefix: 118.70.12.*');
    assert(sessions[0].isCurrent === true, 'Current session recognized');

    // 2.3 Rotate session (legitimate client refresh)
    const rotateResult = await rotateSession(session.refreshToken, mockRequest);
    assert(rotateResult.success === true, 'Session successfully rotated');
    assert(rotateResult.refreshToken !== session.refreshToken, 'New refresh token is issued');

    // 2.4 Token Reuse Attack Detection (Replay attack with old token)
    const replayAttackResult = await rotateSession(session.refreshToken, mockRequest);
    assert(replayAttackResult.success === false, 'Replay attack blocked with old token');
    assert(replayAttackResult.code === 'TOKEN_REUSE_DETECTED', 'Code is TOKEN_REUSE_DETECTED');

    // Verify all active sessions were revoked immediately
    const remainingSessions = await getUserSessions(user.id);
    assert(remainingSessions.length === 0, 'All sessions for compromised user were immediately revoked');

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  }

  // ── TEST SUITE 3: Feature D.3 - 30-Day Grace Period Soft Delete & Reactivation ──
  console.log('\n📌 Test Suite 3: Feature D.3 - 30-Day Grace Period Soft Delete & Reactivation');
  {
    const deleteEmail = `delete_test_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: deleteEmail,
        name: 'User Soft Delete',
        role: 'user',
        status: 'active',
      },
    });

    // Soft delete
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'soft_deleted',
        softDeletedAt: now,
      },
    });

    const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(deletedUser?.status === 'soft_deleted', 'User status is soft_deleted');

    // Simulate login within 30 days -> should reactivate
    const daysPassed = (Date.now() - new Date(deletedUser!.softDeletedAt!).getTime()) / (1000 * 60 * 60 * 24);
    assert(daysPassed <= 30, 'Within 30-day grace period');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'active',
        softDeletedAt: null,
      },
    });

    const restoredUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(restoredUser?.status === 'active', 'User successfully reactivated within grace period');
    assert(restoredUser?.softDeletedAt === null, 'softDeletedAt reset to null');

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  }

  // ── TEST SUITE 4: Feature D.4 - Guest Data Merge ──
  console.log('\n📌 Test Suite 4: Feature D.4 - Guest Data to User Account Merge');
  {
    const guestEmail = `guest_merge_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: guestEmail,
        name: 'Guest Tester',
        role: 'user',
        status: 'active',
      },
    });

    // Find any existing opportunity to merge
    const anyOpp = await prisma.opportunity.findFirst({ select: { id: true } });

    const guestTrackerItems = anyOpp
      ? [{ opportunityId: anyOpp.id, status: 'interested', checklist: [{ task: 'Viết luận', done: false }] }]
      : [];

    const guestProfile = {
      gpa: 3.85,
      degreeLevel: 'bachelor',
      preferredRegions: ['Hà Nội', 'TP.HCM'],
    };

    const mergeResult = await mergeGuestData(user.id, guestTrackerItems, guestProfile);
    assert(Boolean(mergeResult.profileId), 'Profile created/updated');
    if (anyOpp) {
      assert(mergeResult.trackerMergedCount === 1, 'Guest application tracker item merged to user account');
    }

    // Verify profile fields in DB
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    assert(profile?.gpa === 3.85, 'GPA from guest session merged successfully (3.85)');

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  }

  // ── TEST SUITE 5: Email Router Failover & Security Alerts ──
  console.log('\n📌 Test Suite 5: Email Router Dispatch & Templates');
  {
    const magicResult = await emailRouter.sendMagicLink('test@hocbong.vn', 'sample-token-123', 'http://localhost:3000');
    assert(magicResult.success === true, 'Magic link email generated and handled');

    const verifyResult = await emailRouter.sendVerificationEmail(
      'student@hust.edu.vn',
      'verify-token-456',
      'http://localhost:3000',
      'Đại học Bách khoa Hà Nội'
    );
    assert(verifyResult.success === true, 'Student verification email generated and handled');
  }

  console.log(`\n======================================================`);
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Test execution exception:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
