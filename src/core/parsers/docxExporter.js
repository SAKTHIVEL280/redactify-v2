/**
 * Format-Preserving DOCX Redaction Engine
 * Directly modifies OOXML DOM inside a ZIP container to preserve 100% of Word formatting.
 * Reliably handles multi-run split text across <w:r><w:t> nodes.
 * Supports both Browser DOMParser and Isomorphic fallback.
 */

import JSZip from 'jszip';

/**
 * Redacts targetValue across an array of DOM <w:t> nodes belonging to a single paragraph.
 * Handles split runs (e.g. <w:t>Sakthi</w:t><w:t>vel E</w:t>).
 */
function redactNodesInParagraph(tNodes, targetValue, replacement) {
  if (!targetValue || tNodes.length === 0) return;

  let pText = '';
  const spans = [];
  for (const node of tNodes) {
    const text = node.textContent || '';
    const start = pText.length;
    pText += text;
    spans.push({ node, start, end: pText.length });
  }

  let searchIndex = 0;
  while (true) {
    const matchStart = pText.indexOf(targetValue, searchIndex);
    if (matchStart === -1) break;
    const matchEnd = matchStart + targetValue.length;

    const overlapping = spans.filter(s => s.start < matchEnd && s.end > matchStart);
    if (overlapping.length === 1) {
      const s = overlapping[0];
      const relStart = matchStart - s.start;
      const relEnd = matchEnd - s.start;
      s.node.textContent = s.node.textContent.slice(0, relStart) + replacement + s.node.textContent.slice(relEnd);
    } else if (overlapping.length > 1) {
      // First overlapping node gets prefix + replacement
      const first = overlapping[0];
      const relFirstStart = matchStart - first.start;
      first.node.textContent = first.node.textContent.slice(0, relFirstStart) + replacement;

      // Middle overlapping nodes are emptied
      for (let i = 1; i < overlapping.length - 1; i++) {
        overlapping[i].node.textContent = '';
      }

      // Last overlapping node keeps suffix after matchEnd
      const last = overlapping[overlapping.length - 1];
      const relLastEnd = matchEnd - last.start;
      last.node.textContent = last.node.textContent.slice(relLastEnd);
    }

    // Rebuild pText and re-index span offsets for any subsequent occurrences
    pText = '';
    for (const s of spans) {
      const cur = s.node.textContent || '';
      s.start = pText.length;
      pText += cur;
      s.end = pText.length;
    }
    searchIndex = matchStart + replacement.length;
  }
}

/**
 * Isomorphic regex fallback to redact multi-run text in raw XML <w:p> blocks.
 */
function redactParagraphXml(pXml, activeItems, defaultLabel) {
  const tTagRegex = /<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g;
  const tNodes = [];
  let m;
  while ((m = tTagRegex.exec(pXml)) !== null) {
    tNodes.push({
      fullMatch: m[0],
      attrs: m[1],
      textContent: m[2],
      matchIndex: m.index
    });
  }
  if (tNodes.length === 0) return pXml;

  for (const item of activeItems) {
    const targetValue = item.value;
    const replacement = item.suggested || defaultLabel || '[REDACTED]';

    let pText = '';
    const spans = [];
    for (const node of tNodes) {
      const start = pText.length;
      pText += node.textContent;
      spans.push({ node, start, end: pText.length });
    }

    let searchIndex = 0;
    while (true) {
      const matchStart = pText.indexOf(targetValue, searchIndex);
      if (matchStart === -1) break;
      const matchEnd = matchStart + targetValue.length;

      const overlapping = spans.filter(s => s.start < matchEnd && s.end > matchStart);
      if (overlapping.length === 1) {
        const s = overlapping[0];
        const relStart = matchStart - s.start;
        const relEnd = matchEnd - s.start;
        s.node.textContent = s.node.textContent.slice(0, relStart) + replacement + s.node.textContent.slice(relEnd);
      } else if (overlapping.length > 1) {
        const first = overlapping[0];
        const relFirstStart = matchStart - first.start;
        first.node.textContent = first.node.textContent.slice(0, relFirstStart) + replacement;

        for (let i = 1; i < overlapping.length - 1; i++) {
          overlapping[i].node.textContent = '';
        }

        const last = overlapping[overlapping.length - 1];
        const relLastEnd = matchEnd - last.start;
        last.node.textContent = last.node.textContent.slice(relLastEnd);
      }

      pText = '';
      for (const s of spans) {
        s.start = pText.length;
        pText += s.node.textContent;
        s.end = pText.length;
      }
      searchIndex = matchStart + replacement.length;
    }
  }

  let reconstructed = '';
  let lastIdx = 0;
  for (const node of tNodes) {
    reconstructed += pXml.slice(lastIdx, node.matchIndex);
    reconstructed += `<w:t${node.attrs}>${node.textContent}</w:t>`;
    lastIdx = node.matchIndex + node.fullMatch.length;
  }
  reconstructed += pXml.slice(lastIdx);
  return reconstructed;
}

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

  // Filter active text redactions and sort longer values first
  const activeItems = redactions
    .filter(r => r.redact && r.value && r.value.trim().length > 0)
    .sort((a, b) => b.value.length - a.value.length);

  let newXml = '';

  if (typeof DOMParser !== 'undefined' && typeof XMLSerializer !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXmlContent, 'application/xml');
    const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));

    for (const p of paragraphs) {
      const tNodes = Array.from(p.getElementsByTagName('w:t'));
      if (tNodes.length === 0) continue;

      for (const item of activeItems) {
        const targetValue = item.value;
        const replacement = item.suggested || style.label || '[REDACTED]';
        redactNodesInParagraph(tNodes, targetValue, replacement);
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
    // Isomorphic multi-run replacement inside <w:p> blocks
    newXml = docXmlContent.replace(/<w:p\b([^>]*)>([\s\S]*?)<\/w:p>/g, (pMatch) => {
      return redactParagraphXml(pMatch, activeItems, style.label || '[REDACTED]');
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
