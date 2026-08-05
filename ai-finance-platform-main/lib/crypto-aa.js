import crypto from 'crypto';

/**
 * ReBIT ECC Cryptography Implementation for Account Aggregator
 * Reference: Sahamati / ReBIT FIU standards
 */

const CURVE = 'prime256v1'; // ReBIT specification uses prime256v1 (NIST P-256) or X25519
const ALGORITHM = 'aes-256-gcm';

/**
 * Generates an ECDH Key Pair for the FIU
 * You generate this right before requesting FI Data, and send the publicKey to the AA.
 */
export function generateECDHKeyPair() {
  const ecdh = crypto.createECDH(CURVE);
  ecdh.generateKeys();
  return {
    privateKey: ecdh.getPrivateKey('base64'),
    publicKey: ecdh.getPublicKey('base64')
  };
}

/**
 * Derives the shared secret and decrypts the payload from the FIP
 * @param {string} base64FIPPublicKey - The FIP's public key (from KeyMaterial sent by AA)
 * @param {string} base64FIUPrivateKey - Your FIU's private key (generated earlier)
 * @param {string} base64Nonce - The nonce sent by the FIP
 * @param {string} base64Data - The encrypted FI data payload
 */
export function decryptFIPData(base64FIPPublicKey, base64FIUPrivateKey, base64Nonce, base64Data) {
  try {
    const fiuEcdh = crypto.createECDH(CURVE);
    fiuEcdh.setPrivateKey(Buffer.from(base64FIUPrivateKey, 'base64'));

    const fipPublicKey = Buffer.from(base64FIPPublicKey, 'base64');
    
    // Derive shared secret
    const sharedSecret = fiuEcdh.computeSecret(fipPublicKey);

    // According to ReBIT specs, the shared secret must be XORed with the nonce to create the AES key
    const nonce = Buffer.from(base64Nonce, 'base64');
    
    // Key derivation (HKDF is often used, but some AA specs use direct XOR or HKDF-SHA256)
    // We'll use HKDF-SHA256 as per ReBIT Data Security Guidelines
    const hkdfKey = crypto.hkdfSync('sha256', sharedSecret, Buffer.alloc(0), nonce, 32);

    // The encrypted data contains the iv, authTag, and ciphertext.
    // Usually formatted as: IV (12 bytes) + CipherText + AuthTag (16 bytes)
    // You'll need to parse this depending on the exact FIP format (Setu / Finvu might pack it differently)
    
    // For this example, assuming standard packing: [12 bytes IV][Cipher Text][16 bytes Auth Tag]
    const encryptedBuffer = Buffer.from(base64Data, 'base64');
    
    const iv = encryptedBuffer.slice(0, 12);
    const authTag = encryptedBuffer.slice(encryptedBuffer.length - 16);
    const ciphertext = encryptedBuffer.slice(12, encryptedBuffer.length - 16);

    const decipher = crypto.createDecipheriv(ALGORITHM, hkdfKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error("FIP Data Decryption Failed:", error);
    throw new Error("Failed to decrypt Account Aggregator FI data.");
  }
}
