import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { finalizeVerification } from '@/lib/school-verification';

type Params = { params: Promise<{ token: string }> };

// GET /api/school-verifications/[token] — fetch details for the confirm page (public, no auth required).
export async function GET(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const admin = createAdminClient();

    const { data: verification } = await admin
      .from('school_verifications')
      .select('school_email, institution_name, expires_at, verified_at')
      .eq('token', token)
      .single();

    if (!verification) return NextResponse.json({ error: 'Verification link not found' }, { status: 404 });

    if (!verification.verified_at && new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This verification link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      school_email: verification.school_email,
      institution_name: verification.institution_name,
      already_verified: !!verification.verified_at,
    });
  } catch (err) {
    console.error('GET /api/school-verifications/[token] error:', err);
    return NextResponse.json({ error: 'Failed to load verification' }, { status: 500 });
  }
}

// POST /api/school-verifications/[token] — confirm (must be authenticated as the requesting user).
export async function POST(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: verification } = await admin
      .from('school_verifications')
      .select('id, user_id, school_email, email_domain, expires_at, verified_at')
      .eq('token', token)
      .single();

    if (!verification) return NextResponse.json({ error: 'Verification link not found' }, { status: 404 });

    if (verification.user_id !== user.id) {
      return NextResponse.json({ error: 'This link was sent to a different Sparkurio account. Log in as that account to confirm.' }, { status: 403 });
    }

    if (verification.verified_at) {
      return NextResponse.json({ success: true, already_verified: true });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This verification link has expired' }, { status: 410 });
    }

    await admin.from('school_verifications').update({ verified_at: new Date().toISOString() }).eq('id', verification.id);

    const { institutionName } = await finalizeVerification(admin, user.id, verification.school_email, verification.email_domain);

    return NextResponse.json({ success: true, institution_name: institutionName });
  } catch (err) {
    console.error('POST /api/school-verifications/[token] error:', err);
    return NextResponse.json({ error: 'Failed to confirm verification' }, { status: 500 });
  }
}
