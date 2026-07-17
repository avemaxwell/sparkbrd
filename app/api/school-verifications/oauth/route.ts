import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { extractEmailDomain, isConsumerEmailDomain } from '@/lib/educator';
import { finalizeVerification } from '@/lib/school-verification';

// POST /api/school-verifications/oauth — finalize verification after the user
// links a Google/Microsoft account via supabase.auth.linkIdentity(). The
// linked identity's email is used as proof of institutional account
// ownership — no separate Sparkurio login is created for it.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider } = await req.json();
    if (provider !== 'google' && provider !== 'azure') {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const identities = user.identities ?? [];
    const linked = identities
      .filter((i) => i.provider === provider)
      .sort((a, b) => new Date(b.last_sign_in_at ?? b.created_at ?? 0).getTime() - new Date(a.last_sign_in_at ?? a.created_at ?? 0).getTime())[0];

    const email = (linked?.identity_data?.email as string | undefined)?.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: `No linked ${provider === 'google' ? 'Google' : 'Microsoft'} account found` }, { status: 400 });

    const domain = extractEmailDomain(email);
    if (!domain || isConsumerEmailDomain(domain)) {
      return NextResponse.json({ error: 'That account doesn’t use a school, district, college, or university email address' }, { status: 400 });
    }

    await admin.from('school_verifications').insert({
      user_id: user.id,
      school_email: email,
      email_domain: domain,
      institution_name: null,
      method: provider === 'google' ? 'google' : 'microsoft',
      verified_at: new Date().toISOString(),
    });

    const { institutionName } = await finalizeVerification(admin, user.id, email, domain);

    return NextResponse.json({ success: true, institution_name: institutionName });
  } catch (err) {
    console.error('POST /api/school-verifications/oauth error:', err);
    return NextResponse.json({ error: 'Failed to confirm verification' }, { status: 500 });
  }
}
