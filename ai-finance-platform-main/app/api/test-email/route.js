import { NextResponse } from "next/server";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    console.log("Sending REAL test welcome email to:", user.email);

    const result = await sendEmail({
      to: user.email,
      subject: `✨ Welcome to SAMPAT, ${user.name || "Sharan"}!`,
      react: EmailTemplate({
        userName: user.name || "Sharan",
        type: "welcome",
      }),
    });

    return NextResponse.json({ success: true, emailTo: user.email, result });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
