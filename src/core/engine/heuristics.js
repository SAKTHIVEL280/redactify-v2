/**
 * Context-Aware Heuristics for Person Names & Organizations
 * Runs in <5ms with 0MB download and zero network latency.
 */

// Common English dictionary words and section headers that must NEVER be flagged as names
const STOP_WORDS = new Set([
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'Monday', 'Tuesday',
  'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Experience',
  'Education', 'Skills', 'Projects', 'Summary', 'Profile', 'Certifications',
  'University', 'College', 'School', 'Resume', 'Curriculum', 'Vitae',
  'JavaScript', 'TypeScript', 'Python', 'React', 'Node', 'Management',
  'Development', 'Engineer', 'Developer', 'Architect', 'Director',
  'United', 'States', 'Kingdom', 'India', 'Canada', 'Australia'
]);

// ─── 1. Name Detection via Honorifics / Salutations ─────────────────────────────
const HONORIFIC_REGEX = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Prof\.?|Adv\.?|Advocate|CA|Shri|Smt\.?|Kumari|Hon\.?|Justice)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;

// ─── 2. Name Detection via Contextual Labels ────────────────────────────────────
const LABELLED_NAME_REGEX = /\b(?:Name|Full Name|Candidate Name|Patient Name|Client Name|Witness Name|Signatory|Signed by|Employee Name)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/gi;

// ─── 3. Organization / Company Detection ───────────────────────────────────────
const ORG_REGEX = /\b([A-Z][a-zA-Z0-9&]+(?:\s+[A-Z][a-zA-Z0-9&]+){0,4}\s+(?:Inc\.?|LLC\.?|Ltd\.?|Pvt\.?\s+Ltd\.?|LLP\.?|Corp\.?|Corporation|GmbH|Co\.?|Bank|Technologies|Solutions|Enterprises|Services))\b/g;

/**
 * Extract names from email addresses found in the same document
 * e.g., "alex.turner@acme.com" -> extracts "Alex Turner"
 */
export function extractNamesFromEmails(text) {
  const emailRegex = /\b([a-zA-Z]{2,})[._]([a-zA-Z]{2,})@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  const inferredNames = new Set();
  let match;

  while ((match = emailRegex.exec(text)) !== null) {
    const first = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    const last = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
    const fullName = `${first} ${last}`;
    if (!STOP_WORDS.has(first) && !STOP_WORDS.has(last)) {
      inferredNames.add(fullName);
    }
  }

  return Array.from(inferredNames);
}

/**
 * Run heuristic detection across the document
 */
export function detectContextualEntities(text) {
  const entities = [];

  // 1. Honorific names
  let match;
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

  // 2. Labelled names (e.g. "Full Name: Jane Doe")
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

  // 3. Email inferred names
  const inferredNames = extractNamesFromEmails(text);
  for (const name of inferredNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    let nMatch;
    while ((nMatch = regex.exec(text)) !== null) {
      entities.push({
        type: 'name',
        category: 'identity',
        value: nMatch[0],
        start: nMatch.index,
        end: nMatch.index + nMatch[0].length,
        confidence: 0.88,
        suggested: '[NAME REDACTED]'
      });
    }
  }

  // 4. Organizations
  while ((match = ORG_REGEX.exec(text)) !== null) {
    const orgName = match[1];
    entities.push({
      type: 'organization',
      category: 'business',
      value: orgName,
      start: match.index,
      end: match.index + orgName.length,
      confidence: 0.92,
      suggested: '[ORG REDACTED]'
    });
  }

  return entities;
}
