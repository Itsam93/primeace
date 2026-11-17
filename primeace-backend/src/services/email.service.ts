import { Resend } from "resend";

import { env } from "../config/env.js";
import { ApiError } from "../shared/errors/ApiError.js";

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SendEmailResult {
  id: string;
}

const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  if (!resend || !env.EMAIL_FROM) {
    throw new ApiError(
      503,
      "Email service is not configured."
    );
  }

  const {
    to,
    subject,
    html,
    text,
    replyTo
  } = input;

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      ...(text !== undefined ? { text } : {}),
      ...(replyTo !== undefined ? { replyTo } : {})
    });

    if (error) {
      console.error("Resend email delivery error:", error);

      throw new ApiError(
        502,
        "The email provider could not accept the email."
      );
    }

    if (!data?.id) {
      throw new ApiError(
        502,
        "The email provider returned no message ID."
      );
    }

    return {
      id: data.id
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error("Email sending failed:", error);

    throw new ApiError(
      502,
      "Unable to send email at this time."
    );
  }
}
