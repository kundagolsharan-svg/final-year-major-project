"use server";

import nodemailer from "nodemailer";
import { render } from "@react-email/components";

export async function sendEmail({ to, subject, react }) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error("SMTP Configuration Error: EMAIL_USER or EMAIL_PASS is missing in environment variables.");
    return { success: false, error: "SMTP configuration is incomplete." };
  }

  try {
    // Render the React Email component to a clean HTML string
    const html = await render(react);

    // Configure the SMTP transporter for Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"Sampat App" <${emailUser}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Mail] Email successfully sent to ${to}. Message ID: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
    return { success: false, error: error.message || error };
  }
}
