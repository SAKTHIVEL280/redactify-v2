/**
 * Industry-Specific Redaction Presets
 * Pre-configured sets of rules for targeted compliance workflows.
 */

export const PRESETS = {
  ALL: {
    id: 'all',
    name: 'Universal Full Scan',
    description: 'Scans and redacts all international PII, financial, identity, addresses, and contact information.',
    icon: 'ShieldAlert',
    types: [
      'email', 'phone', 'credit_card', 'iban', 'swift', 'routing',
      'aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'ssn', 'ein', 'nino',
      'sin', 'tfn', 'ip', 'dob', 'name', 'organization', 'url', 'address', 'pincode',
      'date', 'salary', 'education', 'gpa', 'location', 'reference_id',
      'gstin', 'epfo_uan', 'bank_account', 'vehicle_registration', 'nhs',
      'medical_record', 'health_insurance', 'secret_key', 'crypto_wallet',
      'itin', 'npi', 'dea', 'utr', 'sort_code', 'eu_vat', 'dni', 'nir',
      'codice_fiscale', 'idnr', 'medicare', 'nric', 'api_token'
    ]
  },
  US_COMPLIANCE: {
    id: 'us_compliance',
    name: 'US Compliance (HIPAA & GLBA)',
    description: 'Complies with US federal regulations: SSN, ITIN, EIN, US Routing, NPI, DEA, MRN, Health Insurance, Credit Cards.',
    icon: 'ShieldAlert',
    types: ['ssn', 'itin', 'ein', 'routing', 'credit_card', 'npi', 'dea', 'medical_record', 'health_insurance', 'phone', 'email', 'dob', 'name', 'address', 'bank_account']
  },
  EU_UK_GDPR: {
    id: 'eu_uk_gdpr',
    name: 'EU & UK GDPR',
    description: 'Strict GDPR compliance: UK NINO, NHS, Sort Code, UTR, EU VAT, Spanish DNI, French NIR, Italian Codice Fiscale, German IdNr, IBAN.',
    icon: 'Scale',
    types: ['nino', 'nhs', 'sort_code', 'utr', 'eu_vat', 'dni', 'nir', 'codice_fiscale', 'idnr', 'iban', 'swift', 'email', 'phone', 'name', 'address', 'dob', 'bank_account']
  },
  APAC_COMPLIANCE: {
    id: 'apac_compliance',
    name: 'APAC & Australia Privacy',
    description: 'Complies with Privacy Act & regional laws: India Aadhaar/PAN/GSTIN, Singapore NRIC/FIN, Australia TFN & Medicare.',
    icon: 'BadgeCheck',
    types: ['aadhaar', 'pan', 'gstin', 'epfo_uan', 'nric', 'tfn', 'medicare', 'phone', 'email', 'name', 'address', 'bank_account', 'passport']
  },
  SECRETS_DEV: {
    id: 'secrets_dev',
    name: 'DevOps & Cloud Secrets',
    description: 'Scans for leaked API keys, tokens, AWS keys, GitHub tokens, Slack/Stripe keys, PEM private keys, and crypto wallets.',
    icon: 'ShieldAlert',
    types: ['secret_key', 'api_token', 'crypto_wallet', 'ip']
  },
  KYC: {
    id: 'kyc',
    name: 'Indian KYC & DPDP',
    description: 'Complies with UIDAI & DPDP: masks Aadhaar (first 8 digits), PAN cards, voter IDs, and passports.',
    icon: 'BadgeCheck',
    types: ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'phone', 'dob', 'name', 'address', 'pincode', 'location', 'date', 'reference_id', 'gstin', 'epfo_uan', 'bank_account', 'vehicle_registration']
  },
  LEGAL: {
    id: 'legal',
    name: 'Legal & Court Filings',
    description: 'Sanitizes witness/party names, organizations, addresses, settlements, and contact details.',
    icon: 'Scale',
    types: ['name', 'organization', 'email', 'phone', 'ssn', 'aadhaar', 'dob', 'address', 'pincode', 'date', 'salary', 'location', 'reference_id', 'bank_account']
  },
  FINANCIAL: {
    id: 'financial',
    name: 'Banking & PCI-DSS',
    description: 'Protects credit/debit cards, IBANs, IFSC codes, SWIFT numbers, and bank routing.',
    icon: 'Landmark',
    types: ['credit_card', 'iban', 'swift', 'routing', 'ifsc', 'email', 'phone', 'salary', 'pan', 'aadhaar', 'gstin', 'bank_account', 'crypto_wallet']
  },
  MEDICAL: {
    id: 'medical',
    name: 'Medical & HIPAA',
    description: 'Redacts patient names, dates of birth, identification numbers, and contact information.',
    icon: 'Activity',
    types: ['name', 'dob', 'ssn', 'npi', 'dea', 'aadhaar', 'phone', 'email', 'address', 'date', 'nhs', 'medical_record', 'health_insurance']
  },
  RESUME: {
    id: 'resume',
    name: 'Bias-Free Resume Screening',
    description: 'Redacts candidate name, email, phone, age, social URLs, and identifiers for blind merit recruitment.',
    icon: 'UserCheck',
    types: ['name', 'email', 'phone', 'dob', 'ip', 'url', 'address', 'pincode', 'education', 'gpa', 'salary', 'location', 'date']
  }
};

