// Polyfill for globalThis for old Android WebViews
(window as any).globalThis = window;
import { createRoot } from "react-dom/client";
import { installDebugOverlay } from '@/lib/debug';
import App from "./App";
import "./index.css";
import "./styles/jitsi-custom.css";

if ((import.meta as any)?.env?.VITE_DEBUG_OVERLAY === 'true') {
	try { installDebugOverlay(); } catch {}
}

createRoot(document.getElementById("root")!).render(<App />);
