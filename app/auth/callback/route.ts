import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { enrollFoundingEducatorIfConsented } from '@/lib/founding-educator';

// Handles Supabase email confirmation links.
// Supabase redirects here with ?code=... after the user clicks the confirm link.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Enrollment is deferred here (rather than right after signUp()) when
      // email confirmation is required, since no session exists until now.
      if (data.user) {
        await enrollFoundingEducatorIfConsented(createAdminClient(), data.user).catch(() => {});
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Confirmation failed or link was invalid — send to login with a notice
  return NextResponse.redirect(`${origin}/login?notice=email-confirmed`);
}
