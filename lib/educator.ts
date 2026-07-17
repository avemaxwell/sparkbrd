// Educator Perks personalization + lightweight verification helpers.
// Verification proves inbox/account ownership of a non-consumer email
// domain — it never checks against a district roster or employment record.

export type EducatorRole =
  | 'public_school_educator'
  | 'private_school_educator'
  | 'college_educator'
  | 'preservice_educator'
  | 'homeschool'
  | 'tutor_other'
  | 'just_browsing';

export const EDUCATOR_ROLES: { id: EducatorRole; label: string }[] = [
  { id: 'public_school_educator', label: 'Public School Educator' },
  { id: 'private_school_educator', label: 'Private School Educator' },
  { id: 'college_educator', label: 'College/University Educator' },
  { id: 'preservice_educator', label: 'Preservice Educator' },
  { id: 'homeschool', label: 'Homeschool Parent/Educator' },
  { id: 'tutor_other', label: 'Tutor/Other' },
  { id: 'just_browsing', label: 'Just Browsing' },
];

export function roleLabel(role: string | null | undefined): string | null {
  return EDUCATOR_ROLES.find((r) => r.id === role)?.label ?? null;
}

// Roles for whom "Confirm your school" is a relevant prompt. Homeschool has
// its own dedicated membership track instead; just-browsing has no need.
export function isClassroomEducatorRole(role: string | null | undefined): boolean {
  return !!role && role !== 'homeschool' && role !== 'just_browsing';
}

export function isVerifiedEducator(profile: { is_verified_educator?: boolean | null } | null | undefined): boolean {
  return !!profile?.is_verified_educator;
}

// Major personal webmail providers — anything else is accepted as a
// plausible school/district/college/university domain. This is the
// "lightweight" part of verification: no per-institution lookup, just a
// blocklist plus proof of inbox ownership via the emailed link.
const CONSUMER_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'outlook.com',
  'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'protonmail.com', 'proton.me', 'gmx.com', 'mail.com',
  'yandex.com', 'zoho.com', 'fastmail.com', 'pm.me',
]);

export function extractEmailDomain(email: string): string | null {
  const match = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(email.trim().toLowerCase());
  return match ? match[1] : null;
}

export function isConsumerEmailDomain(domain: string): boolean {
  return CONSUMER_EMAIL_DOMAINS.has(domain.toLowerCase());
}

// Best-effort, cosmetic-only guess at an institution name from its email
// domain — never authoritative. Users can edit it before opting into any
// public display, and it's only ever shown to the account holder or (if
// they opt in) as a plain name, never alongside the domain or email.
export function deriveInstitutionName(domain: string): string {
  const label = domain.split('.')[0] ?? domain;
  return label
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
