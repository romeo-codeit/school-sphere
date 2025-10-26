// Polyfill for globalThis for old Android WebViews
(window as any).globalThis = window;
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/jitsi-custom.css";

createRoot(document.getElementById("root")!).render(<App />);
