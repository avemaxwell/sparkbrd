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
  role: string;
  needsUpgrade: boolean;
}

export async function sendInviteEmail(opts: SendInviteEmailOptions) {
  const { to, inviterName, boardName, inviteUrl, role, needsUpgrade } = opts;

  const isTeamInvite = role === 'admin' || role === 'member';
  const subject = isTeamInvite
    ? `${inviterName} invited you to join ${boardName} on Sparkurio`
    : `${inviterName} invited you to a collection on Sparkurio`;

  const ctaLabel = 'Accept invitation';

  const upgradeNote = needsUpgrade
    ? `<p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
        You&rsquo;ll need a <strong>Team plan</strong> to join this workspace.
        Tap the button below to upgrade &mdash; it only takes a minute.
      </p>`
    : '';

  const roleLabel = role === 'admin' ? 'Admin' : role === 'member' ? 'Member' : role === 'editor' ? 'Can edit' : 'View only';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6F6F6;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F6;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:28px 40px 20px;text-align:center;border-bottom:2px solid #F6F6F6;">
            <img src="https://sparkurio.com/logo.png"
                 alt="Sparkurio" height="36"
                 style="height:36px;width:auto;display:block;margin:0 auto;border:0;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:400;color:#1a1a1a;">
              You&rsquo;re invited to ${isTeamInvite ? 'join a team' : 'collaborate'}
            </h1>
            <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
              <strong>${inviterName}</strong> invited you to ${isTeamInvite ? 'join their team workspace' : `${role === 'editor' ? 'edit' : 'view'} a collection`} on Sparkurio.
            </p>

            <!-- Team/Collection card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#999;">${isTeamInvite ? 'Team' : 'Collection'}</p>
                  <p style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">${boardName}</p>
                  <span style="display:inline-block;padding:3px 10px;background:#4C4DFF;border-radius:99px;font-size:11px;color:#fff;">${roleLabel}</span>
                </td>
              </tr>
            </table>

            ${upgradeNote}

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${inviteUrl}"
                     style="display:inline-block;padding:14px 36px;background:#4C4DFF;color:#fff;text-decoration:none;border-radius:99px;font-size:15px;font-family:Georgia,serif;">
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

  const text = isTeamInvite
    ? `${inviterName} invited you to join "${boardName}" on Sparkurio. Accept here: ${inviteUrl}`
    : `${inviterName} invited you to ${role === 'editor' ? 'edit' : 'view'} "${boardName}" on Sparkurio. Accept here: ${inviteUrl}`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}

interface SendSchoolVerificationEmailOptions {
  to: string;
  name: string | null;
  verifyUrl: string;
}

export async function sendSchoolVerificationEmail(opts: SendSchoolVerificationEmailOptions) {
  const { to, name, verifyUrl } = opts;

  const subject = 'Confirm your school email — Sparkurio';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6F6F6;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F6;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:28px 40px 20px;text-align:center;border-bottom:2px solid #F6F6F6;">
            <img src="https://sparkurio.com/logo.png"
                 alt="Sparkurio" height="36"
                 style="height:36px;width:auto;display:block;margin:0 auto;border:0;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:400;color:#1a1a1a;">
              Confirm your school email
            </h1>
            <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
              Hi${name ? ` ${name}` : ''}, click below to confirm this address and unlock educator perks on Sparkurio — unlimited downloads and more, personalized for classroom teaching.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${verifyUrl}"
                     style="display:inline-block;padding:14px 36px;background:#4C4DFF;color:#fff;text-decoration:none;border-radius:99px;font-size:15px;font-family:Georgia,serif;">
                    Confirm your school
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:#aaa;text-align:center;line-height:1.5;">
              This link expires in 48 hours. If you didn&rsquo;t request this, you can ignore it — your account is unaffected.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Confirm your school email on Sparkurio: ${verifyUrl} (expires in 48 hours)`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}
