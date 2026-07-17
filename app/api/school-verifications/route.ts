import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendSchoolVerificationEmail } from '@/lib/email';
import { extractEmailDomain, isConsumerEmailDomain, deriveInstitutionName } from '@/lib/educator';

// POST /api/school-verifications — request a "Confirm your school" email.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { school_email } = await req.json();
    if (typeof school_email !== 'string') {
      return NextResponse.json({ error: 'A school email is required' }, { status: 400 });
    }

    const email = school_email.trim().toLowerCase();
    const domain = extractEmailDomain(email);
    if (!domain) return NextResponse.json({ error: 'That doesn’t look like a valid email address' }, { status: 400 });
    if (isConsumerEmailDomain(domain)) {
      return NextResponse.json({ error: 'Please use your school, district, college, or university email address' }, { status: 400 });
    }

    // Only one pending verification at a time per user.
    await admin.from('school_verifications').delete().eq('user_id', user.id).is('verified_at', null);

    const { data: verification, error } = await admin
      .from('school_verifications')
      .insert({
        user_id: user.id,
        school_email: email,
        email_domain: domain,
        institution_name: deriveInstitutionName(domain),
        method: 'email_link',
      })
      .select('token')
      .single();

    if (error || !verification) throw error;

    const { data: profile } = await admin.from('profiles').select('name').eq('id', user.id).single();

    const origin = new URL(req.url).origin;
    await sendSchoolVerificationEmail({
      to: email,
      name: profile?.name ?? null,
      verifyUrl: `${origin}/verify-school/${verification.token}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/school-verifications error:', err);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}
