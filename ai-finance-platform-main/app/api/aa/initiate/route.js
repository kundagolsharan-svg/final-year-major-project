import { initiateBankConsent } from "@/lib/setu-aa";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    if (!body.phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // Check if we are using dummy keys
    if (process.env.FIU_PRIVATE_KEY === "<your_rsa_private_key>" || !process.env.FIU_PRIVATE_KEY) {
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({
        consentId: "mock-consent-id",
        redirectUrl: "/api/aa/mock-callback",
      });
    }

    // Call our Setu AA implementation
    const result = await initiateBankConsent(userId, "SETU", `+91${body.phone}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("AA Initiate Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
