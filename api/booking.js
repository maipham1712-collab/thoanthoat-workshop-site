const { Resend } = require("resend");

// Comma-separated list supported, e.g. "a@example.com, b@example.com"
const NOTIFY_EMAILS = (process.env.NOTIFY_EMAIL || "maipham1712@gmail.com")
  .split(",").map((s) => s.trim()).filter(Boolean);
const FROM_EMAIL = process.env.FROM_EMAIL || "Thoăn Thoắt <bookings@thoatthoatws.vietjewelers.com>";
const MAX_ATTACHMENTS = 6;
const MAX_ATTACHMENT_B64_CHARS = 3_000_000; // ~2.2MB decoded, well under provider limits per file

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function summarize(payload) {
  const { reference, customer, requested, notes, configuration, submittedAt } = payload;
  const altLine = (requested.alternates || []).filter(Boolean).join(", ") || "—";
  const cfgLine = configuration
    ? `${configuration.modelId || "—"} · ${configuration.metal || "—"} · ${configuration.texture || "—"} · size ${configuration.size ?? "—"}${configuration.stones?.length ? ` · ${configuration.stones.length} stone(s)` : ""}`
    : "None";

  return `
    <div style="font-family:system-ui,sans-serif;font-size:14px;color:#222;line-height:1.6">
      <h2 style="margin:0 0 12px">New booking request — ${escapeHtml(reference)}</h2>
      <p><b>Name:</b> ${escapeHtml(customer.name)}<br>
         <b>Contact:</b> ${escapeHtml(customer.contact)}<br>
         <b>Party size:</b> ${escapeHtml(String(customer.partySize ?? 1))}<br>
         <b>Preferred language:</b> ${escapeHtml(customer.preferredLanguage || "en")}</p>
      <p><b>Requested date:</b> ${escapeHtml(requested.date)}${requested.time ? " · " + escapeHtml(requested.time) : ""}<br>
         <b>Alternates:</b> ${escapeHtml(altLine)}</p>
      <p><b>Saved configuration:</b> ${escapeHtml(cfgLine)}</p>
      <p><b>Notes:</b><br>${notes ? escapeHtml(notes).replace(/\n/g, "<br>") : "—"}</p>
      <p style="color:#888;font-size:12px;margin-top:20px">Submitted ${escapeHtml(submittedAt || "")}</p>
    </div>
  `;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const { reference, customer, requested, attachments } = payload || {};
  if (!reference || !customer?.name || !customer?.contact || !requested?.date) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const safeAttachments = (Array.isArray(attachments) ? attachments : [])
    .slice(0, MAX_ATTACHMENTS)
    .filter((a) => a && typeof a.contentBase64 === "string" && a.contentBase64.length < MAX_ATTACHMENT_B64_CHARS)
    .map((a) => ({ filename: a.filename || "reference.jpg", content: a.contentBase64 }));

  if (!process.env.RESEND_API_KEY) {
    // Not configured yet — don't fail the customer's request, but make it loud in the logs
    // so a missing env var is caught immediately rather than silently dropping bookings.
    console.error("[booking] RESEND_API_KEY is not set — booking was NOT emailed:", JSON.stringify(payload));
    res.status(200).json({ ok: true, reference, warning: "email_not_configured" });
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAILS,
      subject: `New booking request — ${reference}`,
      html: summarize(payload),
      attachments: safeAttachments
    });
    if (error) {
      console.error("[booking] Resend rejected the send:", error);
      res.status(502).json({ error: "email_failed" });
      return;
    }
    res.status(200).json({ ok: true, reference });
  } catch (err) {
    console.error("[booking] Failed to send booking email:", err);
    res.status(502).json({ error: "email_failed" });
  }
};
