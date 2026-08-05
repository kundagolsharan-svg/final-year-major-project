import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requestFiData } from "@/lib/setu-aa";
import { generateECDHKeyPair } from "@/lib/crypto-aa";

/**
 * Webhook endpoint for Setu Account Aggregator
 * Receives notifications about Consent status changes and FI Data readiness.
 */
export async function POST(request) {
  try {
    const payload = await request.json();
    
    // Setu sends a webhook when consent status changes
    if (payload.type === "CONSENT_STATUS_UPDATE") {
      const { consentId, status } = payload.data;
      
      const connection = await db.bankConnection.findUnique({
        where: { consentId }
      });

      if (!connection) {
        return NextResponse.json({ error: "Connection not found" }, { status: 404 });
      }

      // Update status in DB
      await db.bankConnection.update({
        where: { id: connection.id },
        data: { status: status === "ACTIVE" ? "ACTIVE" : "FAILED" }
      });

      // If user approved the consent, immediately request FI data
      if (status === "ACTIVE") {
        // Generate Keys for this specific FI fetch session
        const keys = generateECDHKeyPair();
        
        // Save the private key temporarily to use when decrypting (In production, use secure KMS)
        await db.bankConnection.update({
          where: { id: connection.id },
          data: { /* Store keys securely in production */ }
        });

        // Request the data from the FIP
        const sessionId = await requestFiData(consentId, keys);
        
        // Track the job
        await db.fiDataJob.create({
          data: {
            connectionId: connection.id,
            status: "PENDING_FETCH", // Waiting for FI_DATA_READY webhook
          }
        });
      }
    }
    
    // Setu sends this when the Bank (FIP) has prepared and encrypted the data
    if (payload.type === "FI_DATA_READY") {
      const { sessionId, consentId } = payload.data;
      
      // At this point, you would trigger an Inngest background job to:
      // 1. Call fetchFiData(sessionId)
      // 2. Call decryptFIPData(...)
      // 3. Save transactions to DB
      
      console.log(`FI Data Ready for Session: ${sessionId}`);
      // await inngest.send({ name: "aa.sync", data: { sessionId, consentId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AA Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
