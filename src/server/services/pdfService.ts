import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function createCoverLetterPDF(
  company: string,
  title: string,
  content: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
  const { width, height } = page.getSize();
  const margin = 55;
  const contentWidth = width - margin * 2;

  let y = height - margin;

  // 1. Date at top (as shown in reference cover letter: e.g. "07th October, 2026")
  const today = new Date();
  const day = today.getDate();
  const daySuffix = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const formattedDate = `${String(day).padStart(2, '0')}${daySuffix} ${monthNames[today.getMonth()]}, ${today.getFullYear()}`;

  page.drawText(formattedDate, {
    x: margin,
    y,
    size: 11,
    font: timesRoman,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 35;

  // 2. Recipient block
  page.drawText('Hiring Team,', {
    x: margin,
    y,
    size: 11,
    font: timesRomanBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 16;

  page.drawText(company || 'Company Name', {
    x: margin,
    y,
    size: 11,
    font: timesRomanBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 16;

  page.drawText('Berlin, Germany', {
    x: margin,
    y,
    size: 11,
    font: timesRoman,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 30;

  // 3. Salutation
  page.drawText('Dear Hiring Team,', {
    x: margin,
    y,
    size: 11,
    font: timesRomanBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 22;

  // 4. Body Content Word Wrapping
  const fontSize = 10.5;
  const lineHeight = 16;

  // Filter out any lines that are already part of header or footer if the AI included them
  const rawParagraphs = content.split('\n');
  const cleanedParagraphs: string[] = [];

  for (const p of rawParagraphs) {
    const trimmed = p.trim();
    if (
      trimmed.startsWith('Dear Hiring') ||
      trimmed.startsWith('Hiring Team') ||
      trimmed.startsWith('Kind regards') ||
      trimmed.startsWith('Sincerely') ||
      trimmed.startsWith('Karan Joshi') ||
      trimmed.includes('karan.joshi.87@outlook.com') ||
      trimmed.includes('+49 179 1700714') ||
      trimmed.includes('Berlin, Germany') && trimmed.length < 25 ||
      trimmed.includes('LinkedIn') && trimmed.includes('Portfolio') ||
      trimmed.match(/^\d{2}(st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4}$/)
    ) {
      continue;
    }
    cleanedParagraphs.push(trimmed);
  }

  for (const paragraph of cleanedParagraphs) {
    if (paragraph.length === 0) {
      y -= lineHeight * 0.75;
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
      const textWidth = timesRoman.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > contentWidth && currentLine.length > 0) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0.12, 0.12, 0.12),
        });
        y -= lineHeight;
        currentLine = word;

        if (y < margin + 110) {
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.length > 0 && y >= margin + 110) {
      page.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font: timesRoman,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= lineHeight * 1.5;
    }
  }

  // 5. Sign-off Footer (Matching Karan Joshi's Reference Letter)
  y = Math.min(y, height - 670); // Ensure proper bottom placement
  if (y < margin + 90) y = margin + 90;

  page.drawText('Kind regards,', {
    x: margin,
    y,
    size: 11,
    font: timesRoman,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 18;

  page.drawText('Karan Joshi', {
    x: margin,
    y,
    size: 11,
    font: timesRomanBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 16;

  page.drawText('karan.joshi.87@outlook.com', {
    x: margin,
    y,
    size: 10,
    font: timesRoman,
    color: rgb(0.15, 0.3, 0.7),
  });
  y -= 15;

  page.drawText('+49 179 1700714', {
    x: margin,
    y,
    size: 10,
    font: timesRoman,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 15;

  page.drawText('Berlin, Germany', {
    x: margin,
    y,
    size: 10,
    font: timesRoman,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 15;

  page.drawText('LinkedIn · Portfolio · XING', {
    x: margin,
    y,
    size: 10,
    font: timesRoman,
    color: rgb(0.15, 0.3, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
