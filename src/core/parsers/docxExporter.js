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
    const xmlTarget = (targetValue.includes('&') || targetValue.includes('<') || targetValue.includes('>'))
      ? targetValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      : null;

    while (true) {
      let matchStart = pText.indexOf(targetValue, searchIndex);
      let matchLen = targetValue.length;

      if (matchStart === -1 && xmlTarget) {
        matchStart = pText.indexOf(xmlTarget, searchIndex);
        matchLen = xmlTarget.length;
      }
      if (matchStart === -1) break;
      const matchEnd = matchStart + matchLen;

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

function processXmlFile(content, activeItems, defaultLabel, addTrialBanner = false) {
  if (typeof DOMParser !== 'undefined' && typeof XMLSerializer !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'application/xml');
    const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));

    for (const p of paragraphs) {
      const tNodes = Array.from(p.getElementsByTagName('w:t'));
      if (tNodes.length === 0) continue;

      for (const item of activeItems) {
        const targetValue = item.value;
        const replacement = item.suggested || defaultLabel || '[REDACTED]';
        redactNodesInParagraph(tNodes, targetValue, replacement);
      }
    }

    if (addTrialBanner) {
      const body = xmlDoc.getElementsByTagName('w:body')[0];
      if (body) {
        const trialParagraph = xmlDoc.createElement('w:p');
        const r = xmlDoc.createElement('w:r');
        const t = xmlDoc.createElement('w:t');
        t.textContent = 'Trial Version: Redacted with Redactify (redactify.daeq.in). Upgrade to Pro for clean exports';
        r.appendChild(t);
        trialParagraph.appendChild(r);
        body.insertBefore(trialParagraph, body.firstChild);
      }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  } else {
    let newXml = content.replace(/<w:p\b([^>]*)>([\s\S]*?)<\/w:p>/g, (pMatch) => {
      return redactParagraphXml(pMatch, activeItems, defaultLabel || '[REDACTED]');
    });

    if (addTrialBanner) {
      const trialXml = `<w:p><w:r><w:t>Trial Version: Redacted with Redactify (redactify.daeq.in). Upgrade to Pro for clean exports</w:t></w:r></w:p>`;
      newXml = newXml.replace(/<w:body>/, `<w:body>${trialXml}`);
    }
    return newXml;
  }
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

  // 1. Redact main document
  const redactedDocXml = processXmlFile(docXmlContent, activeItems, style.label, !isPro);
  zip.file(documentXmlPath, redactedDocXml);

  // 2. Redact auxiliary XMLs (headers, footers, footnotes)
  const auxiliaryFiles = zip.file(/^word\/(header\d*|footer\d*|footnotes\d*)\.xml$/);
  for (const auxFile of auxiliaryFiles) {
    try {
      const auxXml = await auxFile.async('string');
      const redactedAuxXml = processXmlFile(auxXml, activeItems, style.label, false);
      zip.file(auxFile.name, redactedAuxXml);
    } catch (err) {
      // Non-critical auxiliary parsing error
    }
  }

  // 3. Strict Metadata Sanitization: Strip author & company from docProps
  try {
    const corePropsPath = 'docProps/core.xml';
    let coreXml = await zip.file(corePropsPath)?.async('string');
    if (coreXml) {
      coreXml = coreXml
        .replace(/<dc:creator\b[^>]*>[\s\S]*?<\/dc:creator>/gi, '<dc:creator>Redactify Zero-Trust Engine</dc:creator>')
        .replace(/<cp:lastModifiedBy\b[^>]*>[\s\S]*?<\/cp:lastModifiedBy>/gi, '<cp:lastModifiedBy>Redactify Zero-Trust Engine</cp:lastModifiedBy>')
        .replace(/<dc:title\b[^>]*>[\s\S]*?<\/dc:title>/gi, '<dc:title>Redacted Document</dc:title>');
      zip.file(corePropsPath, coreXml);
    }

    const appPropsPath = 'docProps/app.xml';
    let appXml = await zip.file(appPropsPath)?.async('string');
    if (appXml) {
      appXml = appXml
        .replace(/<Company\b[^>]*>[\s\S]*?<\/Company>/gi, '<Company>Sanitized via Redactify</Company>')
        .replace(/<Manager\b[^>]*>[\s\S]*?<\/Manager>/gi, '');
      zip.file(appPropsPath, appXml);
    }
  } catch (metaErr) {
    // Metadata stripping non-fatal
  }

  const outputBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  return outputBlob;
}
