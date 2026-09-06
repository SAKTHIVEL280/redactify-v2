/**
 * Client-Side In-Memory DOCX Parser
 * Reads word/document.xml from ZIP container and extracts paragraphs and text runs.
 * Supports both Browser DOMParser and Isomorphic Node environments.
 */

import JSZip from 'jszip';

export async function parseAndExtractDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = await zip.file('word/document.xml')?.async('string');

  if (!docXml) {
    throw new Error('Invalid DOCX format: word/document.xml not found inside package.');
  }

  let textLines = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');
    const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));

    for (const p of paragraphs) {
      const textNodes = Array.from(p.getElementsByTagName('w:t'));
      const line = textNodes.map((t) => t.textContent).join('');
      if (line.trim().length > 0) {
        textLines.push(line);
      }
    }
  } else {
    // Isomorphic regex parser fallback
    const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    let pMatch;
    while ((pMatch = pRegex.exec(docXml)) !== null) {
      const pContent = pMatch[1];
      let line = '';
      let tMatch;
      while ((tMatch = tRegex.exec(pContent)) !== null) {
        line += tMatch[1];
      }
      if (line.trim().length > 0) {
        textLines.push(line);
      }
    }
  }

  const fullText = textLines.join('\n\n');

  return {
    rawText: fullText,
    numPages: 1
  };
}
