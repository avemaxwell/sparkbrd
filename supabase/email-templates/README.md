# Supabase Auth email templates

These are **not** wired up automatically — Supabase Auth's built-in emails
(signup confirmation, magic link, password reset) are configured in the
Supabase Dashboard, not in application code. Our own custom emails
(invite, school verification, Founding Educator) already use these same
visual conventions and are wired up in `lib/email.ts` — no action needed there.

## To apply these

Go to **Supabase Dashboard → Authentication → Email Templates**, and for each
template below, paste the matching file's contents into the "Message body"
field:

| Supabase template | File |
|---|---|
| Confirm signup | `confirm-signup.html` |
| Magic Link | `magic-link.html` |
| Reset Password | `reset-password.html` |

Suggested subject lines (set in the same dashboard panel, above the body):
- Confirm signup → `Confirm your email — Sparkurio`
- Magic Link → `Your Sparkurio sign-in link`
- Reset Password → `Reset your Sparkurio password`

## Before this actually reaches anyone: fix the sender domain

Right now `RESEND_FROM` (and by extension every email this app sends,
including these once wired to a custom SMTP) is `onboarding@resend.dev` —
Resend's sandbox address, which **only delivers to the Resend account
owner's own verified email**. Real users signing up will not receive these
emails at all until a real domain is verified:

1. In Resend, verify a domain (e.g. `sparkurio.com` or `mail.sparkurio.com`) —
   this means adding the DNS records Resend gives you (SPF/DKIM) at your
   domain registrar.
2. Update `RESEND_FROM` in production to use that domain, e.g.
   `Sparkurio <hello@sparkurio.com>`.
3. Optionally, point Supabase's own Auth emails through the same domain too:
   **Supabase Dashboard → Project Settings → Auth → SMTP Settings**, using
   Resend's SMTP credentials (host `smtp.resend.com`, port `465`, username
   `resend`, password = your Resend API key). Without this, Supabase's Auth
   emails still send from Supabase's own default address even after the
   templates above are pasted in — only the visual template changes,
   not the sender.
