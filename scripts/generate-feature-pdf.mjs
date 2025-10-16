import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import svgToPdf from 'svg-to-pdfkit';

// Simple generator: converts FEATURE_GUIDE.md to FEATURE_GUIDE.pdf with SVG images.
// Constraint: DO NOT INDENT ANYTHING IN THE PDF. All text is flush-left.

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(scriptDir, '..');
const guideMdPath = path.join(root, 'FEATURE_GUIDE.md');
const outPdfPath = path.join(root, 'FEATURE_GUIDE.pdf');

if (!fs.existsSync(guideMdPath)) {
  console.error('FEATURE_GUIDE.md not found');
  process.exit(1);
}

const md = fs.readFileSync(guideMdPath, 'utf8');

// Attempt to load Poppins font if available locally; fallback to Helvetica
const fontsDir = path.join(root, 'docs', 'fonts');
const poppinsRegular = path.join(fontsDir, 'Poppins-Regular.ttf');
const poppinsBold = path.join(fontsDir, 'Poppins-Bold.ttf');
const hasPoppins = fs.existsSync(poppinsRegular) && fs.existsSync(poppinsBold);

// PDF setup with sensible page margins; no paragraph indentation
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 42, bottom: 42, left: 48, right: 48 },
});

const stream = fs.createWriteStream(outPdfPath);
doc.pipe(stream);

// Layout helpers
const { left: marginLeft, right: marginRight } = doc.page.margins;
const pageWidth = doc.page.width;
const usableWidth = pageWidth - marginLeft - marginRight; // text flush-left within margins
const lineGap = 4; // compact spacing

function ensureSpace(extraHeight = 24) {
  if (doc.y + extraHeight > doc.page.height) {
    doc.addPage();
  }
}

function writeText(text, fontSize = 11, options = {}) {
  doc.font(hasPoppins ? poppinsRegular : 'Helvetica');
  doc.fontSize(fontSize);
  ensureSpace(fontSize + lineGap);
  doc.text(String(text), undefined, undefined, { width: usableWidth, align: 'left', lineGap, paragraphGap: 6, indent: 0, ...options });
}

function writeRule() {
  ensureSpace(16);
  const y = doc.y + 6;
  doc.moveTo(marginLeft, y).lineTo(marginLeft + usableWidth, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.moveDown(0.5);
}

function writeSvgImage(svgPath) {
  // Draw SVG scaled to fit content width while maintaining 16:9 default ratio
  const raw = fs.readFileSync(svgPath, 'utf8');
  const width = usableWidth;
  const height = Math.round(width * (9 / 16));
  ensureSpace(height + 20);
  const yStart = doc.y + 8;
  svgToPdf(doc, raw, marginLeft, yStart, { width });
  // Optional border to distinguish image from background
  doc.save().lineWidth(0.5).strokeColor('#dddddd').rect(marginLeft, yStart, width, height).stroke().restore();
  // Advance cursor
  doc.y = yStart + height;
  doc.moveDown(0.75);
}

function parseImagePath(line) {
  // Markdown image: ![alt](path)
  const m = line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
  return m ? m[1] : null;
}

// Render the document
const lines = md.split(/\r?\n/);
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];

  if (!line.trim()) {
    // Blank line => small vertical space
    ensureSpace(10);
    doc.moveDown(0.3);
    continue;
  }

  // Horizontal rule ---
  if (/^\s*---\s*$/.test(line)) {
    writeRule();
    continue;
  }

  // Headings
  if (line.startsWith('## ')) {
    // Heading level 2
    if (hasPoppins) doc.font(poppinsBold);
    writeText(line.replace(/^##\s+/, ''), 22);
    continue;
  }
  if (line.startsWith('### ')) {
    if (hasPoppins) doc.font(poppinsBold);
    writeText(line.replace(/^###\s+/, ''), 16);
    continue;
  }

  // Image
  if (line.startsWith('![')) {
    const imgRel = parseImagePath(line);
    if (imgRel) {
      const imgAbs = path.isAbsolute(imgRel) ? imgRel : path.join(root, imgRel);
      if (fs.existsSync(imgAbs)) {
        if (imgAbs.toLowerCase().endsWith('.svg')) {
          writeSvgImage(imgAbs);
        } else if (/(\.png|\.jpg|\.jpeg)$/i.test(imgAbs)) {
          // Raster image fallback (fixed-height placeholder)
          const width = usableWidth;
          const yStart = doc.y + 8;
          ensureSpace(200);
          doc.image(imgAbs, 0, yStart, { width });
          doc.y = yStart + 200;
          doc.moveDown(0.5);
        }
      }
    }
    continue;
  }

  // Bulleted list line: start with "- " — render bullet without indent
  if (line.startsWith('- ')) {
    const content = line.replace(/^-\s+/, '');
    writeText(`• ${content}`, 11);
    continue;
  }

  // Numeric list like "1) " — render flush-left text
  if (/^\d+\)\s+/.test(line)) {
    const content = line.replace(/^\d+\)\s+/, '');
    writeText(content, 11);
    continue;
  }

  // Bold-only lines (**text**) -> remove asterisks, keep content
  if (/^\*\*.*\*\*$/.test(line.trim())) {
    const content = line.trim().replace(/^\*\*(.*)\*\*$/, '$1');
    if (hasPoppins) doc.font(poppinsBold);
    writeText(content, 12);
    continue;
  }

  // Fallback: normal paragraph (strip inline bold markers)
  writeText(line.replace(/\*\*(.*?)\*\*/g, '$1'), 11);
}

doc.end();

stream.on('finish', () => {
  console.log(`Wrote ${outPdfPath}`);
});
