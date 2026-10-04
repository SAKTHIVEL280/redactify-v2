/**
 * Sovereign Cryptographic License Key Validator
 * Uses HMAC-SHA256 signature verification to authenticate Pro and Enterprise licenses
 * completely offline without contacting any centralized licensing server.
 * Supports token payloads with expiration timestamps, customer identifiers, and tier verification.
 */

// Cryptographic signing salt for offline verification
const SIGNING_SALT = 'RDCT_SECURE_V2_b94e3a8f10c62d5e7149a0f512cb7e38';

// Pure JavaScript SHA-256 Implementation (Zero dependencies, Node & Browser compatible)
function sha256(ascii) {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeClearHex = '';
  for (let c = 0; c < ascii.length; c++) {
    compositeClearHex += ascii.charCodeAt(c).toString(16).padStart(2, '0');
  }

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << ((3 - (i % 4)) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << ((3 - ((asciiBitLength >> 3) % 4)) * 8);
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      const w15 = w[j - 15], w2 = w[j - 2];
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);

      w[j] = (j < 16) ? (w[j] | 0) : (w[j - 16] + s0 + w[j - 7] + s1) | 0;

      const a = hash[0], e = hash[4];
      const temp1 = (hash[7] +
        (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[j] +
        w[j]) | 0;

      const temp2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]))) | 0;

      hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, e, hash[5], hash[6]];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// Compute HMAC-SHA256 signature
export function hmacSha256(key, message) {
  let k = key;
  if (k.length > 64) {
    k = sha256(k);
  }
  const keyPad = [];
  for (let i = 0; i < 64; i++) {
    keyPad[i] = i < k.length ? k.charCodeAt(i) : 0;
  }
  const oKeyPad = String.fromCharCode(...keyPad.map(b => b ^ 0x5c));
  const iKeyPad = String.fromCharCode(...keyPad.map(b => b ^ 0x36));

  return sha256(oKeyPad + sha256(iKeyPad + message));
}

/**
 * Compute cryptographic license checksum
 * Returns an 8-character uppercase hex signature
 */
export function computeLicenseChecksum(tier, seedHex) {
  const message = `${tier.toUpperCase()}:${seedHex.toUpperCase()}`;
  const fullHmac = hmacSha256(SIGNING_SALT, message);
  return fullHmac.slice(0, 8).toUpperCase();
}

/**
 * Validates a license key string
 * Supports format: RDCT-<TIER>-<SEED_OR_TOKEN>-<CHECKSUM>
 * or RDCT.<TIER>.<PAYLOAD_HEX>.<CHECKSUM>
 */
export function validateLicenseKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'License key is required.' };
  }

  const clean = key.trim().toUpperCase();
  const sep = clean.includes('.') ? '.' : '-';
  const parts = clean.split(sep);

  if (parts.length < 4 || parts[0] !== 'RDCT') {
    return {
      valid: false,
      error: 'Invalid license key format. Expected format: RDCT-<TIER>-<PAYLOAD>-<CHECKSUM>'
    };
  }

  const [, tier, seedOrPayload, checksum] = parts;
  if (!['PRO', 'ENT', 'STUDIO'].includes(tier)) {
    return {
      valid: false,
      error: `Unrecognized tier "${tier}". Supported license tiers: PRO, ENT, STUDIO.`
    };
  }

  if (seedOrPayload.length < 6) {
    return { valid: false, error: 'Invalid license payload segment.' };
  }

  const expectedChecksum = computeLicenseChecksum(tier, seedOrPayload);
  if (checksum !== expectedChecksum) {
    return {
      valid: false,
      error: 'Cryptographic signature verification failed: Tampered or invalid license key.'
    };
  }

  // Attempt to decode optional structured JSON payload
  let payloadData = null;
  try {
    if (seedOrPayload.startsWith('P') && seedOrPayload.length > 16) {
      // Hex-encoded JSON payload
      const hexStr = seedOrPayload.slice(1);
      let jsonStr = '';
      for (let i = 0; i < hexStr.length; i += 2) {
        jsonStr += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
      }
      payloadData = JSON.parse(jsonStr);
    }
  } catch {
    // If not structured JSON, treat as raw random seed
  }

  // Check expiration if present in payload
  if (payloadData && payloadData.expiresAt) {
    const expiresAt = Number(payloadData.expiresAt);
    if (!isNaN(expiresAt) && expiresAt > 0 && Date.now() > expiresAt) {
      return {
        valid: false,
        error: `License expired on ${new Date(expiresAt).toLocaleDateString()}. Please renew your subscription.`
      };
    }
  }

  return {
    valid: true,
    tier,
    key: clean,
    licenseId: payloadData?.id || seedOrPayload,
    email: payloadData?.email || null,
    expiresAt: payloadData?.expiresAt || null,
    activatedAt: new Date().toISOString()
  };
}

/**
 * Generate a cryptographically valid license key
 * Used for license issuing, testing, and purchase fulfillment
 */
export function generateValidLicenseKey(tier = 'PRO', payloadOrSeed, options = {}) {
  let seedSegment;
  if (typeof payloadOrSeed === 'object' && payloadOrSeed !== null) {
    const payloadJson = JSON.stringify({
      id: payloadOrSeed.id || Math.floor(Math.random() * 0xFFFFFFF).toString(16).toUpperCase().padStart(8, '0'),
      tier: tier.toUpperCase(),
      email: payloadOrSeed.email || null,
      issuedAt: payloadOrSeed.issuedAt || Date.now(),
      expiresAt: payloadOrSeed.expiresAt || null
    });
    let hex = '';
    for (let i = 0; i < payloadJson.length; i++) {
      hex += payloadJson.charCodeAt(i).toString(16).padStart(2, '0');
    }
    seedSegment = 'P' + hex.toUpperCase();
  } else if (typeof payloadOrSeed === 'string' && payloadOrSeed.length >= 6) {
    seedSegment = payloadOrSeed.toUpperCase();
  } else {
    seedSegment = Math.floor(Math.random() * 0xFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
  }

  const checksum = computeLicenseChecksum(tier, seedSegment);
  const sep = options.useDotSeparator ? '.' : '-';
  return `RDCT${sep}${tier.toUpperCase()}${sep}${seedSegment}${sep}${checksum}`;
}
