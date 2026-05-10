// ─── Email Client (Resend REST API — no SDK required) ─────────────────────────
// Set RESEND_API_KEY in env to enable email delivery.
// Falls back to console.log in development if key is not set.

interface EmailPayload {
    to:      string | string[];
    subject: string;
    html:    string;
    from?:   string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "Sol Sutara <noreply@solsutara.dev>";

export async function sendEmail(payload: EmailPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.info("[email] RESEND_API_KEY not set — skipping delivery");
        console.info(`[email] Would send to: ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to}`);
        console.info(`[email] Subject: ${payload.subject}`);
        return;
    }

    const response = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type":  "application/json",
        },
        body: JSON.stringify({
            from:    payload.from ?? DEFAULT_FROM,
            to:      Array.isArray(payload.to) ? payload.to : [payload.to],
            subject: payload.subject,
            html:    payload.html,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        // Non-fatal: log and continue — email failure should never crash the main flow
        console.error(`[email] Resend delivery failed (${response.status}): ${body}`);
    }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function shipmentStatusTemplate(params: {
    shipmentNumber: string;
    status:         string;
    origin:         string;
    destination:    string;
    notes?:         string;
    location?:      string;
}): { subject: string; html: string } {
    const statusLabel = params.status.replace(/_/g, " ");
    return {
        subject: `Shipment ${params.shipmentNumber} — ${statusLabel}`,
        html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#7c3aed;margin-bottom:4px">Shipment Update</h2>
        <p style="color:#6b7280;margin-top:0">Sol Sutara Supply Chain Platform</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Shipment #</td>
              <td style="padding:6px 0;font-weight:600;font-size:13px">${params.shipmentNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Status</td>
              <td style="padding:6px 0;font-weight:600;font-size:13px;color:#7c3aed">${statusLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Route</td>
              <td style="padding:6px 0;font-size:13px">${params.origin} → ${params.destination}</td></tr>
          ${params.location ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Location</td>
              <td style="padding:6px 0;font-size:13px">${params.location}</td></tr>` : ""}
          ${params.notes ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Notes</td>
              <td style="padding:6px 0;font-size:13px">${params.notes}</td></tr>` : ""}
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="color:#9ca3af;font-size:11px">Sol Sutara · Decentralised Supply Chain Traceability</p>
      </div>`,
    };
}

export function supplierStatusTemplate(params: {
    supplierName: string;
    supplierCode: string;
    status:       string;
}): { subject: string; html: string } {
    const statusLabel = params.status.replace(/_/g, " ");
    return {
        subject: `Supplier ${params.supplierCode} — ${statusLabel}`,
        html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#7c3aed;margin-bottom:4px">Supplier Status Update</h2>
        <p style="color:#6b7280;margin-top:0">Sol Sutara Supply Chain Platform</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Supplier</td>
              <td style="padding:6px 0;font-weight:600;font-size:13px">${params.supplierName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Code</td>
              <td style="padding:6px 0;font-size:13px">${params.supplierCode}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">New Status</td>
              <td style="padding:6px 0;font-weight:600;font-size:13px;color:#7c3aed">${statusLabel}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="color:#9ca3af;font-size:11px">Sol Sutara · Decentralised Supply Chain Traceability</p>
      </div>`,
    };
}
