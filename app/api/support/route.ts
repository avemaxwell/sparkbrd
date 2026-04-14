import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, email } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: 'admin@sparkurio.com',
      replyTo: email?.trim() || undefined,
      subject: `Sparkurio Support Request${email ? ` — ${email}` : ''}`,
      text: [
        message.trim(),
        email ? `\nFrom: ${email}` : '',
      ].join('\n'),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Support email error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
