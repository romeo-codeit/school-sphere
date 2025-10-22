import { Express } from 'express';
import { registerAuthRoutes } from './auth';
import { registerAdminRoutes } from './admin';
import { registerCBTRoutes } from './cbt';
import { registerDebugRoutes } from './debug';
import { registerAttendanceRoutes } from './attendance';
import { registerPaymentRoutes } from './payments';

export const registerRoutes = async (app: Express) => {
  // Register all domain-specific routes
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerCBTRoutes(app);
  registerDebugRoutes(app);
  registerAttendanceRoutes(app);
  registerPaymentRoutes(app);

  // Masked redirect for external answer URLs
  app.get('/api/answers/r', (req, res) => {
    try {
      const u = String(req.query.u || '');
      if (!u) return res.status(400).json({ message: 'Missing url' });
      // Basic validation and allow-listing to avoid open-redirect abuse
      const parsed = new URL(u);
      if (!/^https?:$/.test(parsed.protocol)) return res.status(400).json({ message: 'Invalid protocol' });
      const allowedHosts = new Set([
        'myschool.ng',
        'www.myschool.ng',
      ]);
      if (!allowedHosts.has(parsed.hostname)) {
        return res.status(400).json({ message: 'Host not allowed' });
      }
      // Use 302 Found to redirect; add no-store headers
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, parsed.toString());
    } catch {
      return res.status(400).json({ message: 'Invalid url' });
    }
  });

  // Inline fetch for external answer URLs (sanitized HTML)
  app.get('/api/answers/fetch', async (req, res) => {
    try {
      const u = String(req.query.u || '');
      if (!u) return res.status(400).json({ message: 'Missing url' });
      const parsed = new URL(u);
      if (!/^https?:$/.test(parsed.protocol)) return res.status(400).json({ message: 'Invalid protocol' });
      const allowedHosts = new Set([
        'myschool.ng',
        'www.myschool.ng',
      ]);
      if (!allowedHosts.has(parsed.hostname)) {
        return res.status(400).json({ message: 'Host not allowed' });
      }
      // Fetch the page server-side
      const resp = await fetch(parsed.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      } as any);
      const html = await resp.text();
      // Basic sanitize: strip scripts/styles/forms/iframes and inline on* handlers
      const removeScripts = (s: string) => s.replace(/<script[\s\S]*?<\/script>/gi, '');
      const removeStyles = (s: string) => s.replace(/<style[\s\S]*?<\/style>/gi, '');
      const removeIframes = (s: string) => s.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
      const removeForms = (s: string) => s.replace(/<\/?form[^>]*>/gi, '');
      const removeOnHandlers = (s: string) => s.replace(/ on[a-z]+="[^"]*"/gi, '');
      // Rewrite absolute-root src/href to absolute URL
      const origin = `${parsed.protocol}//${parsed.host}`;
      const rewriteSrcHref = (s: string) => s
        .replace(/\s(src|href)="\/(?!\/)/gi, ` $1="${origin}/`);
      // Remove anchor hrefs to avoid navigation
      const stripAnchorHrefs = (s: string) => s.replace(/<a\s+([^>]*?)href="[^"]*"([^>]*)>/gi, '<a $1$2>');
      let sanitized = html;
      sanitized = removeScripts(sanitized);
      sanitized = removeStyles(sanitized);
      sanitized = removeIframes(sanitized);
      sanitized = removeForms(sanitized);
      sanitized = removeOnHandlers(sanitized);
      sanitized = rewriteSrcHref(sanitized);
      sanitized = stripAnchorHrefs(sanitized);
      // Optionally, extract a main container by common selectors (best-effort)
      // Keep full sanitized HTML for now
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ html: sanitized });
    } catch (e) {
      return res.status(400).json({ message: 'Failed to fetch answer content' });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  return app;
};