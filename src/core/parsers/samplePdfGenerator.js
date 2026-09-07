import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createSampleOfferLetterPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 750]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Header & Branding
  page.drawText('CONFIDENTIAL EMPLOYMENT AGREEMENT & OFFER', {
    x: 50,
    y: 700,
    size: 13,
    font: fontBold,
    color: rgb(0.16, 0.15, 0.14)
  });
  page.drawText('Apex Global Technologies Inc. - Strictly Private & Confidential', {
    x: 50,
    y: 684,
    size: 9,
    font: fontRegular,
    color: rgb(0.47, 0.44, 0.42)
  });
  page.drawLine({
    start: { x: 50, y: 672 },
    end: { x: 550, y: 672 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.89)
  });

  // Candidate Details
  page.drawText('Date: September 4, 2026', { x: 50, y: 648, size: 10, font: fontRegular, color: rgb(0.16, 0.15, 0.14) });
  page.drawText('Candidate: David M. Sterling', { x: 50, y: 628, size: 10, font: fontBold, color: rgb(0.16, 0.15, 0.14) });
  page.drawText('Home Address: 742 Evergreen Terrace, Suite 400, Seattle, WA 98101', { x: 50, y: 608, size: 10, font: fontRegular, color: rgb(0.16, 0.15, 0.14) });
  page.drawText('Social Security Number: 987-65-4320', { x: 50, y: 588, size: 10, font: fontBold, color: rgb(0.16, 0.15, 0.14) });
  page.drawText('Direct Phone: +1 (206) 555-0194 | Email: d.sterling@apexglobal.io', { x: 50, y: 568, size: 10, font: fontRegular, color: rgb(0.16, 0.15, 0.14) });

  // Terms & Position
  page.drawText('1. Position & Scope:', { x: 50, y: 536, size: 11, font: fontBold, color: rgb(0.16, 0.15, 0.14) });
  page.drawText('We are pleased to offer you the position of Principal Architect at Apex Global Technologies.', { x: 50, y: 518, size: 10, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });

  page.drawText('2. Compensation & Direct Deposit:', { x: 50, y: 486, size: 11, font: fontBold, color: rgb(0.16, 0.15, 0.14) });
  page.drawText('Fixed Annual Base Salary: 85,000 USD (paid semi-monthly on regular payroll cycles).', { x: 50, y: 468, size: 10, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
  page.drawText('Direct Deposit Payroll: Routing Number 021000021, Account Number 8492019482.', { x: 50, y: 450, size: 10, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
  page.drawText('One-time Executive Signing Bonus: 5,000 USD payable on your first pay cycle.', { x: 50, y: 432, size: 10, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });

  page.drawText('3. Confidentiality & Non-Disclosure:', { x: 50, y: 400, size: 11, font: fontBold, color: rgb(0.16, 0.15, 0.14) });
  page.drawText('You agree that all proprietary client data, source code, and trade secrets remain confidential.', { x: 50, y: 382, size: 10, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });

  // Signatures
  page.drawLine({
    start: { x: 50, y: 326 },
    end: { x: 550, y: 326 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.89)
  });
  page.drawText('Authorized Corporate Signature: Katherine Vance, VP Legal Operations', { x: 50, y: 300, size: 9.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Candidate Acceptance Signature: _______________________', { x: 50, y: 270, size: 9.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes], 'Sample_Executive_Offer.pdf', { type: 'application/pdf' });
}
