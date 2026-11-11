import "server-only";
import crypto from "node:crypto";
import { db } from "./db";

export type EmailRecord = {
  id: string;
  candidateId?: string;
  to: string;
  subject: string;
  text: string;
  status: "sent" | "not_sent" | "failed";
  error?: string;
  at: string;
};

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: any;
async function getTransport() {
  if (!transporter) {
    const nodemailer = (await import("nodemailer")).default;
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Plain-text body → simple branded HTML (URLs become links / buttons). */
function toHtml(text: string, cta?: { label: string; url: string }) {
  const body = escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1f5f4a">$1</a>')
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = cta
    ? `<p style="margin:22px 0"><a href="${cta.url}" style="background:#1f5f4a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1d2522;max-width:560px;margin:0 auto;padding:24px">
<div style="font-weight:700;font-size:18px;letter-spacing:.02em;margin-bottom:18px">Divide</div>${body}${button}</div>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  cta?: { label: string; url: string };
  candidateId?: string;
  ics?: string;
}): Promise<EmailRecord> {
  const rec: EmailRecord = {
    id: crypto.randomUUID(),
    candidateId: opts.candidateId,
    to: opts.to,
    subject: opts.subject,
    text: opts.text + (opts.cta ? `\n\n${opts.cta.label}: ${opts.cta.url}` : ""),
    status: "not_sent",
    at: new Date().toISOString(),
  };
  if (!emailConfigured()) {
    rec.error = "SMTP not configured — email logged only";
    console.log(`[email:not-sent] to=${opts.to} subject="${opts.subject}"\n${rec.text}`);
  } else {
    try {
      const t = await getTransport();
      await t.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: opts.to,
        subject: opts.subject,
        text: rec.text,
        html: toHtml(opts.text, opts.cta),
        ...(opts.ics
          ? {
              icalEvent: { method: opts.ics.includes("METHOD:CANCEL") ? "CANCEL" : "REQUEST", content: opts.ics },
              attachments: [{ filename: "interview.ics", content: opts.ics, contentType: "text/calendar" }],
            }
          : {}),
      });
      rec.status = "sent";
    } catch (e: any) {
      rec.status = "failed";
      rec.error = String(e?.message ?? e).slice(0, 300);
      console.error("[email:failed]", rec.error);
    }
  }
  await db.put("emails", rec.id, rec);
  return rec;
}

export async function emailsFor(candidateId: string) {
  const all = await db.list<EmailRecord>("emails");
  return all.filter((e) => e.candidateId === candidateId).sort((a, b) => b.at.localeCompare(a.at));
}
