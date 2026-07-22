import { NextResponse } from 'next/server';
import { searchStandards } from '@/lib/standards';

// GET /api/standards?subject=&grade_band=&q= — search the embedded Common
// Core + NGSS dataset for the resource-builder's standards picker. Kept as
// an API route rather than a direct client import since the underlying
// dataset is ~1700 entries (~400KB) and has no reason to ship to the browser.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const results = searchStandards({
    subject: searchParams.get('subject') ?? undefined,
    gradeBand: searchParams.get('grade_band') ?? undefined,
    query: searchParams.get('q') ?? undefined,
    limit: 25,
  });
  return NextResponse.json({ standards: results });
}
