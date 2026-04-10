import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// The "from" address must be a verified domain in your Resend account.
// During development you can use the Resend sandbox: onboarding@resend.dev
// (only delivers to your own verified email address).
const FROM = process.env.RESEND_FROM ?? 'Sparkurio <onboarding@resend.dev>';

interface SendInviteEmailOptions {
  to: string;
  inviterName: string;
  boardName: string;
  inviteUrl: string;
  role: 'editor' | 'viewer';
  /** True when the invitee has a Sparkurio account but is on the free plan. */
  needsUpgrade: boolean;
}

export async function sendInviteEmail(opts: SendInviteEmailOptions) {
  const { to, inviterName, boardName, inviteUrl, role, needsUpgrade } = opts;

  const subject = needsUpgrade
    ? `${inviterName} invited you to collaborate on Sparkurio — upgrade to join`
    : `${inviterName} invited you to a board on Sparkurio`;

  const ctaLabel = needsUpgrade ? 'Upgrade &amp; join board' : 'Accept invitation';

  const upgradeNote = needsUpgrade
    ? `<p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
        You&rsquo;ll need a <strong>Pro account</strong> to edit boards on Sparkurio.
        Tap the button below to upgrade &mdash; it only takes a minute.
      </p>`
    : '';

  const roleLabel = role === 'editor' ? 'Can edit' : 'View only';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fef3e2;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3e2;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#fef3e2;padding:32px 40px 24px;text-align:center;">
            <span style="font-size:28px;font-style:italic;color:#1a1a1a;">Spark</span><span style="font-size:28px;color:#E24E42;">urio</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:400;color:#1a1a1a;">
              You&rsquo;re invited to collaborate
            </h1>
            <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
              <strong>${inviterName}</strong> invited you to ${role === 'editor' ? 'edit' : 'view'} a board on Sparkurio.
            </p>

            <!-- Board card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#999;">Board</p>
                  <p style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">${boardName}</p>
                  <span style="display:inline-block;padding:3px 10px;background:#E24E42;border-radius:99px;font-size:11px;color:#fff;">${roleLabel}</span>
                </td>
              </tr>
            </table>

            ${upgradeNote}

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${inviteUrl}"
                     style="display:inline-block;padding:14px 36px;background:#E24E42;color:#fff;text-decoration:none;border-radius:99px;font-size:15px;font-family:Georgia,serif;">
                    ${ctaLabel}
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:#aaa;text-align:center;line-height:1.5;">
              This link expires in 7 days. If you didn&rsquo;t expect this email, you can ignore it.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = needsUpgrade
    ? `${inviterName} invited you to ${role === 'editor' ? 'edit' : 'view'} "${boardName}" on Sparkurio. You'll need a Pro account to edit — upgrade now: ${inviteUrl}`
    : `${inviterName} invited you to ${role === 'editor' ? 'edit' : 'view'} "${boardName}" on Sparkurio. Accept here: ${inviteUrl}`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}
