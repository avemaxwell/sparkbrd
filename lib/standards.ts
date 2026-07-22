import { COMMON_CORE_MATH } from '@/lib/standards-data/common-core-math';
import { COMMON_CORE_ELA } from '@/lib/standards-data/common-core-ela';
import { NGSS } from '@/lib/standards-data/ngss';

export interface Standard {
  code: string;
  text: string;
  subject: string; // "Math" | "ELA" | "Science" — the standards body's own subject label, not this app's SUBJECT_LIST
  gradeBands: string[]; // subset of GRADE_BANDS ("K-5" | "6-8" | "9-12")
}

// Server-only — these three datasets are ~1700 entries combined (~400KB),
// so they're queried via an API route rather than imported into any client
// bundle. See app/api/standards/route.ts.
const ALL_STANDARDS: Standard[] = [...COMMON_CORE_MATH, ...COMMON_CORE_ELA, ...NGSS];

// This app's resource subjects (lib/subjects.ts SUBJECT_LIST) don't map
// 1:1 onto the standards bodies' own subject labels (there's no "Math"
// entry in SUBJECT_LIST, for instance — math resources might be tagged
// "Elementary", "CTE", etc.). So `subject` here is a soft relevance filter,
// not a hard requirement: only applied when it plausibly matches one of the
// three datasets, otherwise every dataset is searched.
function matchesSubject(standard: Standard, subject?: string): boolean {
  if (!subject) return true;
  const s = subject.toLowerCase();
  if (standard.subject === 'Math' && s.includes('math')) return true;
  if (standard.subject === 'ELA' && (s.includes('ela') || s.includes('english') || s.includes('literacy') || s.includes('reading') || s.includes('writing'))) return true;
  if (standard.subject === 'Science' && s.includes('scien')) return true;
  return false;
}

export function searchStandards({
  subject,
  gradeBand,
  query,
  limit = 25,
}: {
  subject?: string;
  gradeBand?: string;
  query?: string;
  limit?: number;
}): Standard[] {
  const q = query?.trim().toLowerCase();
  const bandFiltered = gradeBand ? ALL_STANDARDS.filter((s) => s.gradeBands.includes(gradeBand)) : ALL_STANDARDS;

  const subjectMatches = bandFiltered.filter((s) => matchesSubject(s, subject));
  // If the subject filter wiped out everything (e.g. an exact-match subject
  // with no corresponding dataset), fall back to grade-band-only results
  // rather than returning nothing.
  const pool = subjectMatches.length > 0 ? subjectMatches : bandFiltered;

  const results = q
    ? pool.filter((s) => s.code.toLowerCase().includes(q) || s.text.toLowerCase().includes(q))
    : pool;

  return results.slice(0, limit);
}
