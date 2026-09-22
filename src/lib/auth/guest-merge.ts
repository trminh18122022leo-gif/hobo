import prisma from '@/lib/db';

export interface GuestTrackerItem {
  opportunityId: number;
  status?: string;
  checklist?: any[];
}

export interface GuestProfileData {
  gpa?: number;
  gpaScale?: number;
  cpa?: number;
  degreeLevel?: string;
  fieldCodes?: string[];
  languageCerts?: any[];
  achievements?: any[];
  projects?: any[];
  publications?: any[];
  preferredOrgType?: string[];
  preferredRegions?: string[];
}

/**
 * Merges anonymous guest items (saved opportunities, application status, profile questions)
 * into a newly registered or authenticated user's account in database.
 */
export async function mergeGuestData(
  userId: string,
  guestTrackerItems?: GuestTrackerItem[],
  guestProfile?: GuestProfileData
) {
  let trackerMergedCount = 0;
  let profileUpdated = false;

  // 1. Ensure User has a Profile record
  let profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        gpa: guestProfile?.gpa || null,
        gpaScale: guestProfile?.gpaScale || 4.0,
        cpa: guestProfile?.cpa || null,
        degreeLevel: guestProfile?.degreeLevel || null,
        fieldCodes: JSON.stringify(guestProfile?.fieldCodes || []),
        languageCerts: JSON.stringify(guestProfile?.languageCerts || []),
        achievements: JSON.stringify(guestProfile?.achievements || []),
        projects: JSON.stringify(guestProfile?.projects || []),
        publications: JSON.stringify(guestProfile?.publications || []),
        preferredOrgType: JSON.stringify(guestProfile?.preferredOrgType || []),
        preferredRegions: JSON.stringify(guestProfile?.preferredRegions || []),
      },
    });
    profileUpdated = true;
  } else if (guestProfile && Object.keys(guestProfile).length > 0) {
    // Merge only fields that are currently empty in existing profile
    const updateData: any = {};
    if (!profile.gpa && guestProfile.gpa) updateData.gpa = guestProfile.gpa;
    if (!profile.cpa && guestProfile.cpa) updateData.cpa = guestProfile.cpa;
    if (!profile.degreeLevel && guestProfile.degreeLevel) updateData.degreeLevel = guestProfile.degreeLevel;

    if (Object.keys(updateData).length > 0) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: updateData,
      });
      profileUpdated = true;
    }
  }

  // 2. Merge Guest Application Tracker items
  if (guestTrackerItems && Array.isArray(guestTrackerItems) && guestTrackerItems.length > 0) {
    for (const item of guestTrackerItems) {
      if (!item.opportunityId) continue;

      const existing = await prisma.applicationTracker.findUnique({
        where: {
          profileId_opportunityId: {
            profileId: profile.id,
            opportunityId: item.opportunityId,
          },
        },
      });

      if (!existing) {
        // Verify opportunity exists before creating relation
        const opp = await prisma.opportunity.findUnique({
          where: { id: item.opportunityId },
          select: { id: true },
        });

        if (opp) {
          await prisma.applicationTracker.create({
            data: {
              profileId: profile.id,
              opportunityId: opp.id,
              status: item.status || 'interested',
              checklist: JSON.stringify(item.checklist || []),
            },
          });
          trackerMergedCount++;
        }
      }
    }
  }

  return {
    trackerMergedCount,
    profileUpdated,
    profileId: profile.id,
  };
}
