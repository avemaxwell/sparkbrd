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

// ─── Founding Educator program ──────────────────────────────────────────────
// Free Sparkurio Plus for 1 year, contingent on publishing 5 resources every
// rolling 30-day period. See lib/founding-educator.ts and
// app/api/cron/founding-educator/route.ts for the enrollment/enforcement logic
// these emails are sent from.

function foundingEducatorEmailShell(opts: { heading: string; body: string; ctaLabel?: string; ctaUrl?: string; footer: string }) {
  const { heading, body, ctaLabel, ctaUrl, footer } = opts;
  const cta = ctaLabel && ctaUrl ? `
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${ctaUrl}"
                     style="display:inline-block;padding:14px 36px;background:#4C4DFF;color:#fff;text-decoration:none;border-radius:99px;font-size:15px;font-family:Georgia,serif;">
                    ${ctaLabel}
                  </a>
                </td>
              </tr>
            </table>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6F6F6;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F6;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#ffffff;padding:28px 40px 20px;text-align:center;border-bottom:2px solid #F6F6F6;">
            <img src="https://sparkurio.com/logo.png" alt="Sparkurio" height="36" style="height:36px;width:auto;display:block;margin:0 auto;border:0;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:400;color:#1a1a1a;">${heading}</h1>
            <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">${body}</p>
            ${cta}
            <p style="margin:24px 0 0;font-size:12px;color:#aaa;text-align:center;line-height:1.5;">${footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

interface FoundingEducatorReminderOptions {
  to: string;
  name: string | null;
  daysLeft: number;
  publishedCount: number;
}

export async function sendFoundingEducatorReminderEmail(opts: FoundingEducatorReminderOptions) {
  const { to, name, daysLeft, publishedCount } = opts;
  const remaining = Math.max(5 - publishedCount, 0);
  const subject = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to keep Sparkurio Plus free`;

  const html = foundingEducatorEmailShell({
    heading: `Hi${name ? ` ${name}` : ''}, your free Sparkurio Plus needs ${remaining} more resource${remaining === 1 ? '' : 's'}`,
    body: `As a Founding Educator, you keep Sparkurio Plus free by publishing at least 5 resources every month. You&rsquo;ve published <strong>${publishedCount} of 5</strong> so far this period, and you have <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> left. Publish ${remaining} more to keep your free year going.`,
    ctaLabel: 'Share a resource',
    ctaUrl: 'https://sparkurio.com/resources/new',
    footer: `If you miss the quota, your account moves to the Free plan — no other data is affected.`,
  });

  const text = `Hi${name ? ` ${name}` : ''}, you've published ${publishedCount}/5 resources this period with ${daysLeft} day(s) left to keep Sparkurio Plus free. Share a resource: https://sparkurio.com/resources/new`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}

export async function sendFoundingEducatorDowngradedEmail(opts: { to: string; name: string | null }) {
  const { to, name } = opts;
  const subject = `Your Sparkurio account moved to the Free plan`;

  const html = foundingEducatorEmailShell({
    heading: `Hi${name ? ` ${name}` : ''}, your Founding Educator period lapsed`,
    body: `You didn&rsquo;t quite hit 5 published resources this month, so your account has moved from Sparkurio Plus to the Free plan. Everything you&rsquo;ve shared and saved is untouched — you can upgrade any time, or reach out if you think this is a mistake.`,
    ctaLabel: 'View plans',
    ctaUrl: 'https://sparkurio.com/settings/billing',
    footer: `Questions? Just reply to this email.`,
  });

  const text = `Hi${name ? ` ${name}` : ''}, you didn't hit 5 published resources this month, so your account moved to the Free plan. Nothing else changed. View plans: https://sparkurio.com/settings/billing`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}

export async function sendFoundingEducatorYearCompleteEmail(opts: { to: string; name: string | null }) {
  const { to, name } = opts;
  const subject = `Thank you for a year of building Sparkurio with us`;

  const html = foundingEducatorEmailShell({
    heading: `Hi${name ? ` ${name}` : ''}, your Founding Educator year is complete`,
    body: `A year ago you joined as one of Sparkurio&rsquo;s first Founding Educators, and everything you&rsquo;ve shared has genuinely helped build this. Your free year of Sparkurio Plus has now ended, and your account has moved to the Free plan. We&rsquo;d love for you to stay on as a paying Plus member.`,
    ctaLabel: 'Continue with Plus',
    ctaUrl: 'https://sparkurio.com/settings/billing',
    footer: `Thank you for building this with us from the start.`,
  });

  const text = `Hi${name ? ` ${name}` : ''}, thank you for a year of being a Founding Educator. Your free Sparkurio Plus year has ended and your account is now on the Free plan. Continue with Plus: https://sparkurio.com/settings/billing`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}
