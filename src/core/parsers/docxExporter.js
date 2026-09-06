/**
 * Format-Preserving DOCX Redaction Engine
 * Directly modifies OOXML DOM inside a ZIP container to preserve 100% of Word formatting.
 * Supports both Browser DOMParser and Isomorphic fallback.
 */

import JSZip from 'jszip';

export async function exportRedactedDOCX({
  fileArrayBuffer,
  redactions,
  style = { label: '[REDACTED]' },
  isPro = false
}) {
  const zip = await JSZip.loadAsync(fileArrayBuffer);
  const documentXmlPath = 'word/document.xml';
  let docXmlContent = await zip.file(documentXmlPath)?.async('string');

  if (!docXmlContent) {
    throw new Error('Invalid DOCX structure: word/document.xml not found');
  }

  // Filter active text redactions
  const activeItems = redactions
    .filter(r => r.redact && r.value && r.value.trim().length > 0)
    // Sort longer values first to prevent partial substring collision
    .sort((a, b) => b.value.length - a.value.length);

  let newXml = '';

  if (typeof DOMParser !== 'undefined' && typeof XMLSerializer !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXmlContent, 'application/xml');
    const tNodes = Array.from(xmlDoc.getElementsByTagName('w:t'));

    for (const item of activeItems) {
      const targetValue = item.value;
      const replacement = item.suggested || style.label || '[REDACTED]';

      for (const node of tNodes) {
        if (node.textContent && node.textContent.includes(targetValue)) {
          node.textContent = node.textContent.replaceAll(targetValue, replacement);
        }
      }
    }

    // Free Tier limitation: Add trial header banner if not Pro
    if (!isPro) {
      const body = xmlDoc.getElementsByTagName('w:body')[0];
      if (body) {
        const trialParagraph = xmlDoc.createElement('w:p');
        const r = xmlDoc.createElement('w:r');
        const t = xmlDoc.createElement('w:t');
        t.textContent = 'Trial Version — Redacted with Redactify (redactify.daeq.in) — Upgrade to Pro for Clean Commercial Exports';
        r.appendChild(t);
        trialParagraph.appendChild(r);
        body.insertBefore(trialParagraph, body.firstChild);
      }
    }

    const serializer = new XMLSerializer();
    newXml = serializer.serializeToString(xmlDoc);
  } else {
    // Isomorphic regex-safe replacement inside <w:t> tags
    newXml = docXmlContent.replace(/<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g, (match, attrs, content) => {
      let updated = content;
      for (const item of activeItems) {
        const targetValue = item.value;
        const replacement = item.suggested || style.label || '[REDACTED]';
        if (updated.includes(targetValue)) {
          updated = updated.replaceAll(targetValue, replacement);
        }
      }
      return `<w:t${attrs}>${updated}</w:t>`;
    });

    if (!isPro) {
      const trialXml = `<w:p><w:r><w:t>Trial Version — Redacted with Redactify (redactify.daeq.in) — Upgrade to Pro for Clean Commercial Exports</w:t></w:r></w:p>`;
      newXml = newXml.replace(/<w:body>/, `<w:body>${trialXml}`);
    }
  }

  zip.file(documentXmlPath, newXml);
  const outputBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  return outputBlob;
}
