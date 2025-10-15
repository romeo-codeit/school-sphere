import fs from 'fs';
const md = fs.readFileSync('FEATURE_GUIDE.md','utf8');
// Lightweight HTML wrapper for PDF export
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SchoolSphere — Client User Guide</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; line-height: 1.5; padding: 24px; }
  h1,h2,h3 { color: #0f172a; }
  img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0; }
  code, pre { background: #f8fafc; padding: 2px 4px; border-radius: 4px; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
</style>
</head><body>
<article>
${md
  .replace(/^##\s(.+)$/gm,'<h2>$1</h2>')
  .replace(/^###\s(.+)$/gm,'<h3>$1</h3>')
  .replace(/^---$/gm,'<hr/>')
  .replace(/^\-\s(.+)$/gm,'<li>$1</li>')
  .replace(/\n<li>/g,'<ul><li>')
  .replace(/<\/li>\n(?!<li>)/g,'</li></ul>')
  .replace(/^\d\)\s/gm,'')
  .replace(/^!(?:\[.*?\])\((.*?)\)$/gm,'<img src="$1"/>')
  .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
  .replace(/\n\n/g,'<br/><br/>')
}
</article>
</body></html>`;
fs.writeFileSync('FEATURE_GUIDE.html', html);
console.log('Wrote FEATURE_GUIDE.html; convert to PDF with your preferred tool.');
