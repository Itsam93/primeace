import { env } from "../../config/env.js";

interface ReviewInvitationEmailInput {
  clientName: string;
  projectReference: string;
  token: string;
  expiresAt: Date;
}

interface ReviewInvitationEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character] ?? character;
  });
}

function formatExpiryDate(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Lagos"
  }).format(date);
}

export function buildReviewInvitationEmail(
  input: ReviewInvitationEmailInput
): ReviewInvitationEmail {
  const clientName = escapeHtml(input.clientName);
  const projectReference = escapeHtml(input.projectReference);

  const reviewUrl = new URL(
    `/review/${encodeURIComponent(input.token)}`,
    env.FRONTEND_URL
  ).toString();

  const safeReviewUrl = escapeHtml(reviewUrl);
  const expiryDate = formatExpiryDate(input.expiresAt);

  const subject = "Share your feedback with PrimeAce";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Share your feedback</title>
      </head>

      <body style="margin:0;padding:32px 16px;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;"
        >
          <tr>
            <td style="padding:32px 36px;background-color:#174ea6;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;font-weight:700;">
                PrimeAce
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:36px;">
              <h2 style="margin:0 0 20px;font-size:22px;color:#111827;">
                We'd appreciate your feedback
              </h2>

              <p style="margin:0 0 16px;line-height:1.7;">
                Hello ${clientName},
              </p>

              <p style="margin:0 0 16px;line-height:1.7;">
                Thank you for choosing PrimeAce. We would appreciate
                a few minutes of your time to share your experience
                with our service.
              </p>

              <p style="margin:0 0 24px;line-height:1.7;">
                Your feedback helps us understand what went well
                and where we can improve.
              </p>

              <p style="margin:0 0 24px;line-height:1.7;">
                <strong>Project reference:</strong>
                ${projectReference}
              </p>

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin:0 0 28px;"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#174ea6"
                    style="border-radius:5px;"
                  >
                    <a
                      href="${safeReviewUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-weight:600;"
                    >
                      Submit your review
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#4b5563;">
                This review link expires on
                <strong>${escapeHtml(expiryDate)}</strong>
                (West Africa Time).
              </p>

              <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">
                If the button does not work, copy this link into
                your browser:
              </p>

              <p style="margin:12px 0 0;word-break:break-all;font-size:13px;">
                <a href="${safeReviewUrl}" style="color:#174ea6;">
                  ${safeReviewUrl}
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                Thank you for trusting PrimeAce.
              </p>

              <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">
                PrimeAce
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = [
    "PrimeAce - Share your feedback",
    "",
    `Hello ${input.clientName},`,
    "",
    "Thank you for choosing PrimeAce. We would appreciate a few minutes of your time to share your experience with our service.",
    "",
    `Project reference: ${input.projectReference}`,
    "",
    `Submit your review: ${reviewUrl}`,
    "",
    `This review link expires on ${expiryDate} (West Africa Time).`,
    "",
    "Thank you for trusting PrimeAce."
  ].join("\n");

  return {
    subject,
    html,
    text
  };
}
