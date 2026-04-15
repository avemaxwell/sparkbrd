import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY!);

const LOGO = 'https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/assets/logo.png';
const SIGNUP_URL = 'https://sparkurio.com/signup';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { emails, senderName } = await request.json();
    if (!emails?.length) return NextResponse.json({ error: 'No emails provided' }, { status: 400 });

    const name = senderName || 'A friend';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFCFB;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFCFB;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td align="center" style="padding:36px 40px 24px;">
            <img src="${LOGO}" alt="Sparkurio" width="140" style="display:block;height:auto;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <p style="margin:0 0 12px;font-size:26px;color:#1a1a1a;line-height:1.2;">
              I love Sparkurio!
            </p>
            <p style="margin:0 0 20px;font-size:16px;color:#555;line-height:1.6;">
              ${name} wants you to join them on Sparkurio — a space for collecting the images, ideas, and things that genuinely inspire you.
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#888;font-style:italic;">
              "Come join me."
            </p>
            <a href="${SIGNUP_URL}" style="display:inline-block;background:#E24E42;color:#ffffff;text-decoration:none;font-family:sans-serif;font-size:15px;font-weight:600;padding:14px 32px;border-radius:999px;">
              Join Sparkurio — it's free →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f0ece8;">
            <p style="margin:0;font-size:12px;color:#bbb;font-family:sans-serif;">
              You received this because ${name} thought you'd love it.<br/>
              <a href="${SIGNUP_URL}" style="color:#E24E42;text-decoration:none;">sparkurio.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await Promise.all(
      emails.map((to: string) =>
        resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: to.trim(),
          replyTo: user.email,
          subject: `${name} wants you to join them on Sparkurio`,
          html,
        })
      )
    );

    return NextResponse.json({ ok: true, count: emails.length });
  } catch (err) {
    console.error('Invite error:', err);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
