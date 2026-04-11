import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Resend-backed contact endpoint.
// Env vars (set in Vercel project settings):
//   RESEND_API_KEY   — the API key from resend.com/api-keys (secret, no NEXT_PUBLIC_)
//   CONTACT_TO       — destination inbox, e.g. jyvovvo@gmail.com
//   CONTACT_FROM     — sender, defaults to Resend's sandbox address during setup.
//                      Once a custom domain is verified on Resend, swap to something
//                      like "Portfolio <hi@yourdomain.com>".
const FROM_DEFAULT = "Portfolio <onboarding@resend.dev>";

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || FROM_DEFAULT;

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "Contact endpoint not configured: missing RESEND_API_KEY or CONTACT_TO" },
      { status: 500 }
    );
  }

  let payload: { from?: string; message?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const senderEmail = (payload.from || "").trim();
  const message = (payload.message || "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  // Basic length caps to discourage abuse (Resend itself also rate-limits by API key)
  if (message.length > 5000 || senderEmail.length > 200) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const resend = new Resend(apiKey);
  const label = senderEmail || "anonymous visitor";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      // Only set Reply-To if the visitor typed a valid-looking email, so "Reply" in the
      // inbox actually goes back to them. Skipping unless it looks like an address.
      replyTo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) ? senderEmail : undefined,
      subject: `Portfolio contact — ${label}`,
      text: `From: ${label}\n\n${message}`,
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Resend error" }, { status: 502 });
    }
    return NextResponse.json({ success: true, id: data?.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
