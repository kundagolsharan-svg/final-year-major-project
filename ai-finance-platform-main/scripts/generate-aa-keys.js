const crypto = require('crypto');

// Generate 2048-bit RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log("=== PUBLIC KEY (To upload to Setu / FIP) ===");
console.log(publicKey);
console.log("\n=== PRIVATE KEY (PKCS#8 for .env FIU_PRIVATE_KEY) ===");
console.log(privateKey);
