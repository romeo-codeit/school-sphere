import fs from 'fs';
const md = fs.readFileSync('FEATURE_GUIDE.md','utf8');
// Lightweight HTML wrapper (no left text indentation, Poppins font if available)
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SchoolSphere — Client User Guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Poppins', Arial, Helvetica, sans-serif; color: #111; line-height: 1.6; padding: 24px; }
  h1,h2,h3 { color: #0f172a; margin: 0 0 8px 0; }
  p { margin: 0 0 10px 0; }
  li { margin: 0 0 6px 0; }
  img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0; display: block; }
  code, pre { background: #f8fafc; padding: 2px 4px; border-radius: 4px; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
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
  .replace(/\n\n/g,'<br/>')
}
</article>
</body></html>`;
fs.writeFileSync('FEATURE_GUIDE.html', html);
console.log('Wrote FEATURE_GUIDE.html; convert to PDF with your preferred tool.');
