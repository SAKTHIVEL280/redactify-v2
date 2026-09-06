/**
 * Client-Side In-Memory DOCX Parser
 * Reads word/document.xml from ZIP container and extracts paragraphs and text runs.
 * Supports both Browser DOMParser and Isomorphic Node environments.
 */

import JSZip from 'jszip';

function extractTextFromXml(xmlString) {
  let lines = [];
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));
    for (const p of paragraphs) {
      const textNodes = Array.from(p.getElementsByTagName('w:t'));
      const line = textNodes.map((t) => t.textContent).join('');
      if (line.trim().length > 0) {
        lines.push(line);
      }
    }
  } else {
    const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    let pMatch;
    while ((pMatch = pRegex.exec(xmlString)) !== null) {
      const pContent = pMatch[1];
      let line = '';
      let tMatch;
      while ((tMatch = tRegex.exec(pContent)) !== null) {
        line += tMatch[1];
      }
      if (line.trim().length > 0) {
        lines.push(line);
      }
    }
  }
  return lines;
}

export async function parseAndExtractDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = await zip.file('word/document.xml')?.async('string');

  if (!docXml) {
    throw new Error('Invalid DOCX format: word/document.xml not found inside package.');
  }

  let textLines = extractTextFromXml(docXml);

  // Also extract text from headers, footers, and footnotes
  const auxiliaryFiles = zip.file(/^word\/(header\d*|footer\d*|footnotes\d*)\.xml$/);
  for (const auxFile of auxiliaryFiles) {
    try {
      const auxXml = await auxFile.async('string');
      const auxLines = extractTextFromXml(auxXml);
      textLines.push(...auxLines);
    } catch (e) {
      // Ignore non-critical auxiliary XML read errors
    }
  }

  const fullText = textLines.join('\n\n');

  return {
    rawText: fullText,
    numPages: 1
  };
}
