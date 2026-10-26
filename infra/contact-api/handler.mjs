import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE_NAME = process.env.TABLE_NAME;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || "slandscapemgmt@gmail.com";
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL || "Sunshine Landscape <noreply@sunshine-landscape.com>";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function corsHeaders(origin) {
  const allow =
    ALLOWED_ORIGINS.includes("*") || !origin
      ? ALLOWED_ORIGINS[0] || "*"
      : ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0] || "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json",
  };
}

function response(statusCode, body, origin) {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event?.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function handler(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || "";

  if (event?.requestContext?.http?.method === "OPTIONS" || event?.httpMethod === "OPTIONS") {
    return response(204, {}, origin);
  }

  try {
    const data = parseBody(event);

    // Honeypot — bots fill hidden fields; humans leave blank
    if (clean(data.company || data.website || data._gotcha, 200)) {
      return response(200, { ok: true }, origin);
    }

    const name = clean(data.name || data.Name, 200);
    const email = clean(data.email || data.Email, 320);
    const phone = clean(data.phone || data["Phone-Number"] || data.PhoneNumber, 40);
    const message = clean(data.message || data.Message, 5000);
    const source = clean(data.source || "/contact-us", 200) || "/contact-us";

    if (!name || !email || !message) {
      return response(400, { ok: false, error: "Name, email, and message are required." }, origin);
    }
    if (!isValidEmail(email)) {
      return response(400, { ok: false, error: "Invalid email address." }, origin);
    }
    if (!RESEND_API_KEY || !TABLE_NAME) {
      console.error("Missing RESEND_API_KEY or TABLE_NAME");
      return response(500, { ok: false, error: "Server misconfigured." }, origin);
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          id,
          name,
          email,
          phone,
          message,
          source,
          createdAt,
        },
      })
    );

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `New website inquiry from ${name}`,
        text: [
          `New contact form submission`,
          ``,
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone || "(none)"}`,
          `Source: ${source}`,
          `Time: ${createdAt}`,
          ``,
          `Message:`,
          message,
          ``,
          `Submission ID: ${id}`,
        ].join("\n"),
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error", resendRes.status, errText);
      return response(502, { ok: false, error: "Failed to send email." }, origin);
    }

    const resendJson = await resendRes.json();
    return response(200, { ok: true, id, resendId: resendJson.id }, origin);
  } catch (err) {
    console.error(err);
    return response(500, { ok: false, error: "Unexpected server error." }, origin);
  }
}
