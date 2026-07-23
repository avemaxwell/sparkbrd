import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { enrollFoundingEducatorIfConsented } from '@/lib/founding-educator';

// POST /api/founding-educator/enroll
// Called right after a session exists for a newly-created account (either
// immediately after signUp(), if email confirmation is off, or from
// /auth/callback once it is). Enrollment only happens if the account was
// created with founding_educator_consent in its signup metadata — see
// lib/founding-educator.ts.
export async function POST() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await enrollFoundingEducatorIfConsented(admin, user);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/founding-educator/enroll error:', err);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}
