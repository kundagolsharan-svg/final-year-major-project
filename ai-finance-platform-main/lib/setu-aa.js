import { SignJWT, importPKCS8 } from 'jose';
import crypto from 'crypto';
import { db } from '@/lib/prisma';

const SETU_BASE_URL = process.env.SETU_AA_BASE_URL || 'https://fiu-sandbox.setu.co';
const CLIENT_ID = process.env.SETU_CLIENT_ID;
const PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;
const PRIVATE_KEY = process.env.FIU_PRIVATE_KEY;

/**
 * Generates a signed detached JWS token for authenticating with Setu APIs.
 */
async function generateDetachedJWS(payload) {
  if (!PRIVATE_KEY) throw new Error("FIU_PRIVATE_KEY is missing in environment variables.");
  const privateKey = await importPKCS8(PRIVATE_KEY, 'RS256');
  const jws = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  const parts = jws.split('.');
  return `${parts[0]}..${parts[2]}`;
}

/**
 * Create a Consent Request via Setu AA.
 */
export async function createConsentRequest(userId, phoneNumbers) {
  const payload = {
    Detail: {
      consentStart: new Date().toISOString(),
      consentExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      Customer: { id: phoneNumbers[0] + "@setu" },
      FIDataRange: {
        from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      consentMode: "STORE",
      consentTypes: ["TRANSACTIONS", "PROFILE", "SUMMARY"],
      fetchType: "ONETIME",
      Frequency: { unit: "HOUR", value: 1 },
      DataFilter: [{ type: "TRANSACTIONAMOUNT", operator: ">=", value: "0" }],
      DataLife: { unit: "MONTH", value: 6 },
      DataConsumer: { type: "FIU" },
      Purpose: {
        code: "101",
        refUri: "https://api.rebit.org.in/aa/purpose/101.xml",
        text: "Wealth management and personal finance",
        Category: { type: "string" }
      },
      fiTypes: ["DEPOSIT", "TERM_DEPOSIT", "CREDIT_CARD", "MUTUAL_FUNDS"]
    }
  };

  const signature = await generateDetachedJWS(payload);

  const response = await fetch(`${SETU_BASE_URL}/Consents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client_api_key": CLIENT_ID,
      "x-jws-signature": signature,
      "x-product-instance-id": PRODUCT_INSTANCE_ID
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Setu Consent Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    consentId: data.ConsentHandle,
    redirectUrl: `https://sandbox.setu.co/aa/consent/${data.ConsentHandle}?redirect_url=${encodeURIComponent((process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + "/dashboard")}`
  };
}

/**
 * Request FI Data (fetch transactions) after Consent is ACTIVE.
 */
export async function requestFiData(consentId, ecdhKeys) {
  const payload = {
    FIDataRange: {
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    Consent: { id: consentId },
    KeyMaterial: {
      cryptoAlg: "ECDH",
      curve: "Curve25519",
      params: "",
      DHPublicKey: {
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        Parameters: "",
        KeyValue: ecdhKeys.publicKey
      }
    }
  };

  const signature = await generateDetachedJWS(payload);

  const response = await fetch(`${SETU_BASE_URL}/FI/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client_api_key": CLIENT_ID,
      "x-jws-signature": signature,
      "x-product-instance-id": PRODUCT_INSTANCE_ID
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Setu FI Request Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.sessionId;
}

/**
 * Fetch FI Data payload using the session ID.
 */
export async function fetchFiData(sessionId) {
  const response = await fetch(`${SETU_BASE_URL}/FI/fetch/${sessionId}`, {
    method: "GET",
    headers: {
      "client_api_key": CLIENT_ID,
      "x-product-instance-id": PRODUCT_INSTANCE_ID
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Setu FI Fetch Error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * High-level entry point: creates a DB record for the bank connection,
 * calls Setu to generate a consent + redirect URL.
 * This is the function imported by the API route.
 */
export async function initiateBankConsent(userId, provider, phone) {
  const { consentId, redirectUrl } = await createConsentRequest(userId, [phone]);

  await db.bankConnection.create({
    data: {
      userId,
      provider,
      bankName: "Bank via Setu AA",
      status: "PENDING",
      consentId,
    },
  });

  return { consentId, redirectUrl };
}
