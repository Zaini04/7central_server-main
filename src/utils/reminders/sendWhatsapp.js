const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Use one of these:
// 1) sandbox: TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
// 2) production sender: TWILIO_WHATSAPP_FROM=whatsapp:+<your-enabled-number>
const fromWhatsapp = process.env.TWILIO_WHATSAPP_FROM;

const client = twilio(accountSid, authToken);

const normalizeToE164 = (phone) => {
  if (!phone) return "";

  let value = String(phone).trim().replace(/\s+/g, "");

  // remove duplicate whatsapp: prefix if caller passes it
  value = value.replace(/^whatsapp:/i, "");

  // basic Pakistan normalization example
  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  } else if (value.startsWith("0")) {
    value = `+92${value.slice(1)}`;
  } else if (!value.startsWith("+")) {
    value = `+${value}`;
  }

  return value;
};

const sendWhatsapp = async ({
  to,
  message,
  mediaUrl = null,
}) => {
  try {
    if (!accountSid || !authToken || !fromWhatsapp) {
      throw new Error(
        "Missing Twilio WhatsApp environment variables. Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM"
      );
    }

    if (!to) {
      throw new Error("WhatsApp recipient number is required");
    }

    if (!message && !mediaUrl) {
      throw new Error("Either message or mediaUrl is required");
    }

    const toE164 = normalizeToE164(to);

    const payload = {
      from: fromWhatsapp.startsWith("whatsapp:")
        ? fromWhatsapp
        : `whatsapp:${fromWhatsapp}`,
      to: `whatsapp:${toE164}`,
    };

    if (message) {
      payload.body = message;
    }

    if (mediaUrl) {
      payload.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    }

    const response = await client.messages.create(payload);

    return {
      success: true,
      sid: response.sid,
      status: response.status,
      response,
    };
  } catch (error) {
    console.error(
      "WHATSAPP ERROR:",
      error?.message,
      error?.code ? `| code: ${error.code}` : ""
    );

    return {
      success: false,
      error: error?.message || "Failed to send WhatsApp message",
      code: error?.code || null,
    };
  }
};

module.exports = sendWhatsapp;