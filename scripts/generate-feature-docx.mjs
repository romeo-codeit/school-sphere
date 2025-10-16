import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun, AlignmentType } from 'docx';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const guideMdPath = path.join(root, 'FEATURE_GUIDE.md');
const outDocxPath = path.join(root, 'FEATURE_GUIDE.docx');

if (!fs.existsSync(guideMdPath)) {
  console.error('FEATURE_GUIDE.md not found');
  process.exit(1);
}

const md = fs.readFileSync(guideMdPath, 'utf8');

// Style helpers
const FONT = 'Poppins'; // Word falls back if not installed
const SIZE_P = 28; // 14pt (half-points)
const SIZE_H2 = 48; // 24pt
const SIZE_H3 = 36; // 18pt

function createParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 120 },
    indent: { left: 0, hanging: 0, right: 0, firstLine: 0 },
    children: [new TextRun({ text: String(text), font: FONT, size: SIZE_P })],
  });
}

function createHeading(text, level = 2) {
  const size = level === 2 ? SIZE_H2 : SIZE_H3;
  return new Paragraph({
    heading: level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    indent: { left: 0, hanging: 0, right: 0, firstLine: 0 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: String(text), bold: true, font: FONT, size })],
  });
}

function createHr() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { color: 'E5E7EB', space: 1, value: 'single', size: 6 } },
  });
}

async function createImageParagraph(imgPath) {
  try {
    let buffer;
    const ext = path.extname(imgPath).toLowerCase();
    if (ext === '.svg') {
      const svg = fs.readFileSync(imgPath);
      buffer = await sharp(svg).png({ quality: 90 }).toBuffer();
    } else {
      buffer = fs.readFileSync(imgPath);
    }

    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [new ImageRun({ data: buffer, transformation: { width: 800, height: 450 } })],
    });
  } catch {
    return createParagraph('[Image not available]');
  }
}

function createBullet(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    indent: { left: 0, hanging: 360 },
    children: [new TextRun({ text: String(text), font: FONT, size: SIZE_P })],
  });
}

function parseImagePath(line) {
  const m = line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
  return m ? m[1] : null;
}

async function buildDoc() {
  const lines = md.split(/\r?\n/);
  const children = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!line.trim()) {
      children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    if (/^\s*---\s*$/.test(line)) {
      children.push(createHr());
      continue;
    }

    if (line.startsWith('## ')) {
      children.push(createHeading(line.replace(/^##\s+/, ''), 2));
      continue;
    }
    if (line.startsWith('### ')) {
      children.push(createHeading(line.replace(/^###\s+/, ''), 3));
      continue;
    }

    if (line.startsWith('![')) {
      const rel = parseImagePath(line);
      const abs = rel ? (path.isAbsolute(rel) ? rel : path.join(root, rel)) : null;
      if (abs && fs.existsSync(abs)) {
        children.push(await createImageParagraph(abs));
      } else {
        children.push(createParagraph('[Image not found]'));
      }
      continue;
    }

    if (line.startsWith('- ')) {
      const content = line.replace(/^-\s+/, '');
      children.push(createBullet(content));
      continue;
    }

    if (/^\d+\)\s+/.test(line)) {
      const content = line.replace(/^\d+\)\s+/, '');
      children.push(createParagraph(content));
      continue;
    }

    const plain = line.replace(/\*\*(.*?)\*\*/g, '$1');
    children.push(createParagraph(plain));
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { left: 720, right: 720, top: 720, bottom: 720 } } }, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outDocxPath, buffer);
  console.log(`Wrote ${outDocxPath}`);
}

buildDoc();
