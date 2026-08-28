import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import { applyTheme, prefersDark, resolveMode } from "./lib/theme";
import { getMode, getTone } from "./lib/userPreferences";
import "./index.css";

// Apply the saved theme before the first render to avoid a color flash
applyTheme(getTone(), resolveMode(getMode(), prefersDark()));

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
