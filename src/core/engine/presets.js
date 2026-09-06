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
      'aadhaar', 'pan', 'passport', 'voter_id', 'ssn', 'ein', 'nino',
      'sin', 'tfn', 'ip', 'dob', 'name', 'organization', 'url', 'address', 'pincode', 'date'
    ]
  },
  KYC: {
    id: 'kyc',
    name: 'Indian KYC & DPDP',
    description: 'Complies with UIDAI & DPDP: masks Aadhaar (first 8 digits), PAN cards, voter IDs, and passports.',
    icon: 'BadgeCheck',
    types: ['aadhaar', 'pan', 'passport', 'voter_id', 'phone', 'dob', 'name', 'address', 'pincode']
  },
  LEGAL: {
    id: 'legal',
    name: 'Legal & Court Filings',
    description: 'Sanitizes witness/party names, organizations, addresses, settlements, and contact details.',
    icon: 'Scale',
    types: ['name', 'organization', 'email', 'phone', 'ssn', 'aadhaar', 'dob', 'address', 'pincode', 'date']
  },
  FINANCIAL: {
    id: 'financial',
    name: 'Banking & PCI-DSS',
    description: 'Protects credit/debit cards, IBANs, IFSC codes, SWIFT numbers, and bank routing.',
    icon: 'Landmark',
    types: ['credit_card', 'iban', 'swift', 'routing', 'ifsc', 'email', 'phone']
  },
  MEDICAL: {
    id: 'medical',
    name: 'Medical & HIPAA',
    description: 'Redacts patient names, dates of birth, identification numbers, and contact information.',
    icon: 'Activity',
    types: ['name', 'dob', 'ssn', 'aadhaar', 'phone', 'email', 'address']
  },
  RESUME: {
    id: 'resume',
    name: 'Bias-Free Resume Screening',
    description: 'Redacts candidate name, email, phone, age, social URLs, and identifiers for blind merit recruitment.',
    icon: 'UserCheck',
    types: ['name', 'email', 'phone', 'dob', 'ip', 'url', 'address', 'pincode']
  }
};
