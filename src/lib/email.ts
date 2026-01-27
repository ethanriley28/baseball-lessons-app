// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email send");
    return;
  }

  try {
    await resend.emails.send({
      from: "Game Ready Performance <no-reply@gamereadyperformance.com>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}
