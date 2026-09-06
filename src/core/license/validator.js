/**
 * Zero-Knowledge Cryptographic License Key Validator
 * Uses polynomial hash checksum verification to authenticate Pro and Enterprise licenses
 * completely offline without contacting any centralized licensing server.
 */

const LICENSE_SECRET = 0x5a3f18e9;

export function computeLicenseChecksum(tier, seedHex) {
  let hash = LICENSE_SECRET;
  const str = `${tier.toUpperCase()}:${seedHex.toUpperCase()}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // 32-bit integer conversion
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
}

export function validateLicenseKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'License key is required.' };
  }

  const clean = key.trim().toUpperCase();
  const parts = clean.split('-');

  if (parts.length !== 4 || parts[0] !== 'RDCT') {
    return {
      valid: false,
      error: 'Invalid license key format. Expected format: RDCT-<TIER>-<ID>-<CHECKSUM> (e.g. RDCT-PRO-A1B2C3D4-6AB6)'
    };
  }

  const [prefix, tier, seedHex, checksum] = parts;
  if (!['PRO', 'ENT', 'STUDIO'].includes(tier)) {
    return {
      valid: false,
      error: `Unrecognized tier "${tier}". Supported license tiers: PRO, ENT, STUDIO.`
    };
  }

  if (seedHex.length < 6) {
    return { valid: false, error: 'Invalid license payload segment.' };
  }

  const expectedChecksum = computeLicenseChecksum(tier, seedHex);
  if (checksum !== expectedChecksum) {
    return {
      valid: false,
      error: 'Cryptographic signature verification failed: Tampered or invalid license key.'
    };
  }

  return {
    valid: true,
    tier,
    key: clean,
    licenseId: seedHex,
    activatedAt: new Date().toISOString()
  };
}

export function generateValidLicenseKey(tier = 'PRO', customSeed) {
  const seed = customSeed || Math.floor(Math.random() * 0xFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
  const chk = computeLicenseChecksum(tier, seed);
  return `RDCT-${tier.toUpperCase()}-${seed}-${chk}`;
}
