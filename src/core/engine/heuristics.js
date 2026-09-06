/**
 * Context-Aware Heuristics for Person Names & Organizations
 * Runs in <5ms with 0MB download and zero network latency.
 */

// Common English dictionary words, pronouns, and section headers that must NEVER be flagged as names
const STOP_WORDS = new Set([
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'Monday', 'Tuesday',
  'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Experience',
  'Education', 'Skills', 'Projects', 'Summary', 'Profile', 'Certifications',
  'University', 'College', 'School', 'Resume', 'Curriculum', 'Vitae',
  'JavaScript', 'TypeScript', 'Python', 'React', 'Node', 'Management',
  'Development', 'Engineer', 'Developer', 'Architect', 'Director',
  'United', 'States', 'Kingdom', 'India', 'Canada', 'Australia',
  'Personal', 'Confidential', 'Private', 'Limited', 'Company', 'Page',
  'Yours', 'Sincerely', 'Terms', 'Conditions', 'Dear', 'Thank',
  'We', 'I', 'You', 'They', 'He', 'She', 'It', 'Our', 'Your', 'Their',
  'Will', 'Shall', 'Would', 'Could', 'Should', 'Between', 'Agreement',
  'Notice', 'Service', 'Services', 'Employee', 'Employer', 'Candidate',
  'Applicant', 'Recipient', 'Signatory', 'Officer', 'Policy', 'Office'
]);

// ─── 1. Name Detection via Honorifics / Salutations ─────────────────────────────
const HONORIFIC_REGEX = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Prof\.?|Adv\.?|Advocate|CA|Shri|Smt\.?|Kumari|Hon\.?|Justice)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+)?)\b/g;

// ─── 2. Name Detection via Contextual Labels ────────────────────────────────────
const LABELLED_NAME_REGEX = /\b(?:Name|Full Name|Candidate Name|Patient Name|Client Name|Witness Name|Signatory|Signed by|Employee Name|Father(?:'s)?(?:\s+Name)?|Mother(?:'s)?(?:\s+Name)?|Husband(?:'s)?(?:\s+Name)?|Guardian(?:'s)?(?:\s+Name)?|S\/O|D\/O|W\/O|C\/O)[\s:]+([A-Z][a-z]+(?:[ \t]+[A-Z]\.?|[ \t]+[A-Z][a-z]+)*)\b/gi;

// ─── 3. Name Detection via Salutations ("Dear Sakthivel" or "Dear , Sakthivel") ─
const SALUTATION_NAME_REGEX = /\b(?:Dear|To|Attention|Attn|Kind Attn)\s*[,:]?\s*([A-Z][a-z]+)\b/g;

// ─── 4. Signatory Names in Business Letters (e.g. "Sarika Pradhan Vice President")
const SIGNATORY_NAME_REGEX = /(?:Yours\s+sincerely|Yours\s+faithfully|Sincerely|Warm\s+regards|Best\s+regards|Regards)[\s\S]{0,120}?(?:[_~-]{3,}|\bFor\b[\s\S]{0,80}?[_~-]{3,})\s*([A-Z][a-z]{2,20}\s+[A-Z][a-z]{2,20})\s+(?:Vice\s+President|President|Managing\s+Director|Director|Officer|Lead|Manager|Partner|Authorized\s+Signatory)/g;

// ─── 5. Organization / Company Detection ───────────────────────────────────────
const ORG_REGEX = /\b([A-Z][a-zA-Z0-9&]+(?:\s+(?:and|&|of|for|[A-Z][a-zA-Z0-9&]+)){0,6}\s+(?:Inc\.?|LLC\.?|Ltd\.?|Pvt\.?\s+Ltd\.?|Private\s+Limited|LLP\.?|Corp\.?|Corporation|GmbH|Bank|Technologies|Solutions|Enterprises|(?:IT|Financial|Consulting|Technical|Professional)\s+Services))\b/g;

/**
 * Extract names from email addresses found in the same document
 * e.g., "sakthivel.hsr06@gmail.com" -> extracts "Sakthivel"
 */
export function extractNamesFromEmails(text) {
  const emailRegex = /\b([a-zA-Z]{3,})(?:[._][a-zA-Z0-9]+)?@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  const inferredNames = new Set();
  let match;

  while ((match = emailRegex.exec(text)) !== null) {
    const rawPrefix = match[1];
    const capitalized = rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1).toLowerCase();
    if (capitalized.length >= 3 && !STOP_WORDS.has(capitalized)) {
      inferredNames.add(capitalized);
    }
  }

  return Array.from(inferredNames);
}

/**
 * Extract recipient or candidate name from the top header of a document
 * Checks the first 6 non-empty lines for lines matching person name format
 */
export function extractTopHeaderNames(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const found = [];

  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (
      line.includes('@') ||
      line.includes('http') ||
      line.includes('+') ||
      line.startsWith('Page') ||
      line.includes('Confidential') ||
      line.includes('August') ||
      line.includes('January') ||
      line.includes('Agreement')
    ) {
      continue;
    }

    // Matches e.g. "Sakthivel E" or "Alexander Vance"
    const nameMatch = /^([A-Z][a-zA-Z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z]+)?)$/.exec(line);
    if (nameMatch && !STOP_WORDS.has(nameMatch[1])) {
      found.push(nameMatch[1]);
    }
  }

  return found;
}

/**
 * Run heuristic detection across the document
 */
export function detectContextualEntities(text) {
  const entities = [];

  // 1. Top Header Names (e.g. "Sakthivel E")
  const headerNames = extractTopHeaderNames(text);
  for (const name of headerNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    let m;
    while ((m = regex.exec(text)) !== null) {
      entities.push({
        type: 'name',
        category: 'identity',
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
        confidence: 0.96,
        suggested: '[NAME REDACTED]'
      });
    }
  }

  // 2. Salutation Names (e.g. "Dear Sakthivel")
  let match;
  while ((match = SALUTATION_NAME_REGEX.exec(text)) !== null) {
    const namePart = match[1];
    const matchIndex = match.index + match[0].lastIndexOf(namePart);
    if (!STOP_WORDS.has(namePart) && namePart.length > 2) {
      entities.push({
        type: 'name',
        category: 'identity',
        value: namePart,
        start: matchIndex,
        end: matchIndex + namePart.length,
        confidence: 0.94,
        suggested: '[NAME REDACTED]'
      });

      // Also match everywhere else in the document
      const escaped = namePart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const docRegex = new RegExp(`\\b${escaped}(?:\\s+[A-Z]\\.?)?\\b`, 'g');
      let dm;
      while ((dm = docRegex.exec(text)) !== null) {
        if (dm.index !== matchIndex) {
          entities.push({
            type: 'name',
            category: 'identity',
            value: dm[0],
            start: dm.index,
            end: dm.index + dm[0].length,
            confidence: 0.93,
            suggested: '[NAME REDACTED]'
          });
        }
      }
    }
  }

  // 3. Signatory Names in Business Letters (e.g. "Sarika Pradhan")
  while ((match = SIGNATORY_NAME_REGEX.exec(text)) !== null) {
    const namePart = match[1];
    const words = namePart.split(/\s+/);
    if (words.some(w => STOP_WORDS.has(w))) continue;
    const matchIndex = match.index + match[0].indexOf(namePart);
    entities.push({
      type: 'name',
      category: 'identity',
      value: namePart,
      start: matchIndex,
      end: matchIndex + namePart.length,
      confidence: 0.95,
      suggested: '[SIGNATORY REDACTED]'
    });
  }

  // 4. Honorific names (e.g. "Mr. Alexander Vance")
  while ((match = HONORIFIC_REGEX.exec(text)) !== null) {
    const fullMatch = match[0];
    const namePart = match[1];
    if (!STOP_WORDS.has(namePart)) {
      entities.push({
        type: 'name',
        category: 'identity',
        value: fullMatch,
        start: match.index,
        end: match.index + fullMatch.length,
        confidence: 0.95,
        suggested: '[NAME REDACTED]'
      });
    }
  }

  // 5. Labelled names (e.g. "Full Name: Jane Doe")
  while ((match = LABELLED_NAME_REGEX.exec(text)) !== null) {
    const namePart = match[1];
    const matchIndex = match.index + match[0].lastIndexOf(namePart);
    if (!STOP_WORDS.has(namePart)) {
      entities.push({
        type: 'name',
        category: 'identity',
        value: namePart,
        start: matchIndex,
        end: matchIndex + namePart.length,
        confidence: 0.90,
        suggested: '[NAME REDACTED]'
      });
    }
  }

  // 6. Email inferred names
  const inferredNames = extractNamesFromEmails(text);
  for (const name of inferredNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}(?:\\s+[A-Z]\\.?)?(?:\\s+[A-Z][a-z]+)?\\b`, 'g');
    let nMatch;
    while ((nMatch = regex.exec(text)) !== null) {
      entities.push({
        type: 'name',
        category: 'identity',
        value: nMatch[0],
        start: nMatch.index,
        end: nMatch.index + nMatch[0].length,
        confidence: 0.92,
        suggested: '[NAME REDACTED]'
      });
    }
  }

  // 7. Organizations
  while ((match = ORG_REGEX.exec(text)) !== null) {
    let orgName = match[1];
    let startIndex = match.index;
    if (/^(?:For|To|At)\s+/i.test(orgName)) {
      const prefixMatch = orgName.match(/^(?:For|To|At)\s+/i)[0];
      orgName = orgName.slice(prefixMatch.length);
      startIndex += prefixMatch.length;
    }
    entities.push({
      type: 'organization',
      category: 'business',
      value: orgName,
      start: startIndex,
      end: startIndex + orgName.length,
      confidence: 0.92,
      suggested: '[ORG REDACTED]'
    });
  }

  return entities;
}
