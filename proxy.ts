import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Site-wide "coming soon" gate. When COMING_SOON_MODE=true, every request —
// including existing logged-in users — is served the standalone teaser at
// /coming-soon instead of the live app, so nobody sees the old Sparkurio
// while the relaunch is in progress. Rewritten (not redirected) so the
// address bar still shows whatever URL was requested. /api is exempted so
// backend integrations (Stripe webhooks, Supabase auth callbacks) keep
// working even while the human-facing site is gated. Turn it off by
// removing/flipping the env var — no code change needed.
const STATIC_FILE = /\.(png|jpg|jpeg|gif|svg|ico|webp|avif|css|js|woff2?|ttf|txt|xml|json)$/i

export async function proxy(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_COMING_SOON === 'true') {
    const { pathname } = request.nextUrl
    const isExempt =
      pathname.startsWith('/coming-soon') ||
      pathname.startsWith('/api') ||
      STATIC_FILE.test(pathname)

    if (!isExempt) {
      return NextResponse.rewrite(new URL('/coming-soon', request.url))
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
