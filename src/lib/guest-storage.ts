/**
 * Utilities for reading and clearing guest user data from localStorage
 * Feature D.4: Frictionless guest mode + seamless merge
 */

export function getGuestTrackerItems(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('guest_tracker_items');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getGuestProfile(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('guest_profile');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getGuestDataSummary() {
  const tracker = getGuestTrackerItems();
  const profile = getGuestProfile();
  return {
    trackerCount: tracker.length,
    hasProfile: Object.keys(profile).length > 0,
    totalItems: tracker.length + (Object.keys(profile).length > 0 ? 1 : 0),
  };
}

export function clearGuestData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('guest_tracker_items');
    localStorage.removeItem('guest_profile');
    localStorage.removeItem('guest_compared_ids');
  } catch (e) {
    console.error('Error clearing guest data:', e);
  }
}
