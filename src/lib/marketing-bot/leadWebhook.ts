function cleanString(value: any) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

export async function postLeadToWebhook(payload: any) {
  const email = cleanString(payload?.email);
  const consentMarketing = Boolean(payload?.consent_marketing);

  if (!email) {
    return {
      ok: false,
      error: "Missing email address.",
    };
  }

  if (!consentMarketing) {
    return {
      ok: false,
      error: "Marketing consent must be true before saving a lead.",
    };
  }

  const lead = {
    email,
    first_name: cleanString(payload?.first_name),
    goal: cleanString(payload?.goal) || "General career help",
    segment: cleanString(payload?.segment),
    consent_marketing: true,
    source_page: cleanString(payload?.source_page),
    session_id: cleanString(payload?.session_id),
    notes: cleanString(payload?.notes),
    captured_at: new Date().toISOString(),
    source: "aicareerguide-marketing-bot-nextjs",
  };

  const webhookUrl = cleanString(process.env.BOT_LEAD_WEBHOOK_URL);

  if (!webhookUrl) {
    console.log("[marketing-bot:lead]", JSON.stringify(lead));
    return {
      ok: true,
      mode: "console",
      lead,
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Webhook returned ${response.status}`,
        status: response.status,
      };
    }

    return {
      ok: true,
      mode: "webhook",
    };
  } catch (error) {
    console.error("[marketing-bot:webhook]", error);
    return {
      ok: false,
      error: "Could not deliver lead webhook.",
    };
  }
}
