import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/security/auth';
import { encrypt, decrypt } from '@/lib/security/encryption';
import { profileInputSchema } from '@/lib/security/sanitize';
import { logAudit, getClientInfo } from '@/lib/security/audit';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    const profile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });

    if (!profile) {
      return NextResponse.json({ success: true, data: null });
    }

    const decryptedData = profile.encryptedData ? decrypt(profile.encryptedData) : null;
    
    const parsedProfile = {
      ...profile,
      degreeLevel: profile.degreeLevel ? JSON.parse(profile.degreeLevel as string) : null,
      languageCerts: profile.languageCerts ? JSON.parse(profile.languageCerts as string) : null,
      achievements: profile.achievements ? JSON.parse(profile.achievements as string) : null,
      projects: profile.projects ? JSON.parse(profile.projects as string) : null,
      publications: profile.publications ? JSON.parse(profile.publications as string) : null,
      preferredOrgType: profile.preferredOrgType ? JSON.parse(profile.preferredOrgType as string) : null,
      preferredRegions: profile.preferredRegions ? JSON.parse(profile.preferredRegions as string) : null,
      decryptedData,
    };

    const clientInfo = getClientInfo(request);
    await logAudit({ userId: authUser.id, action: 'profile_read', resource: 'profile', details: clientInfo });

    return NextResponse.json({ success: true, data: parsedProfile });
  } catch (error: any) {
    console.error('Get profile error:', error);
    if (error.message === 'Not authenticated') {
       return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validatedData = profileInputSchema.parse(body);

    const sensitiveData = (validatedData as any).sensitiveData;
    const encryptedData = sensitiveData ? encrypt(JSON.stringify(sensitiveData)) : null;

    const profileData = {
      gpa: validatedData.gpa,
      degreeLevel: validatedData.degreeLevel ? JSON.stringify(validatedData.degreeLevel) : null,
      languageCerts: validatedData.languageCerts ? JSON.stringify(validatedData.languageCerts) : '{}',
      achievements: validatedData.achievements ? JSON.stringify(validatedData.achievements) : '[]',
      projects: validatedData.projects ? JSON.stringify(validatedData.projects) : '[]',
      publications: validatedData.publications ? JSON.stringify(validatedData.publications) : '[]',
      preferredOrgType: validatedData.preferredOrgType ? JSON.stringify(validatedData.preferredOrgType) : '[]',
      preferredRegions: validatedData.preferredRegions ? JSON.stringify(validatedData.preferredRegions) : '[]',
      encryptedData,
    };

    const profile = await prisma.profile.upsert({
      where: { userId: authUser.id },
      update: profileData,
      create: {
        userId: authUser.id,
        ...profileData,
      },
    });

    const clientInfo = getClientInfo(request);
    await logAudit({ userId: authUser.id, action: 'profile_update', resource: 'profile', details: clientInfo });

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.message === 'Not authenticated') {
       return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    await prisma.$transaction([
      prisma.profile.delete({ where: { userId: authUser.id } }),
      prisma.user.delete({ where: { id: authUser.id } }),
    ]);

    const clientInfo = getClientInfo(request);
    await logAudit({ userId: authUser.id, action: 'profile_delete', resource: 'profile', details: clientInfo });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error: any) {
    console.error('Delete profile error:', error);
    if (error.message === 'Not authenticated') {
       return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}




