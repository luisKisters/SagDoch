import withSerwistInit from "@serwist/next";
import { buildContent, writeContent } from "./scripts/content";

// Content-Build: data/*.csv → public/data/content.json, plus die Content-Version im Bundle.
// Läuft bei `next dev` und `next build`. `next start` braucht es nicht (nur Auslieferung).
// Fehler im Inhalt (unbekanntes Pack, kaputter Platzhalter, ...) lassen den Build scheitern.
const isServe = process.argv.includes("start");
let contentVersion = "";
if (!isServe) {
  const { content, errors, warnings } = buildContent();
  warnings.forEach((w) => console.warn(`[content] ${w}`));
  if (errors.length > 0) {
    throw new Error(`[content] Inhalt ungültig:\n  ${errors.join("\n  ")}`);
  }
  contentVersion = writeContent(content);
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  // Nur das, was die App offline braucht. Die Screenshots (2 MB, nur für den Install-Dialog im Manifest)
  // und Template-SVGs sollen beim ersten Start nicht gegen Fragen und App-Code um Bandbreite konkurrieren.
  globPublicPatterns: ["data/**/*", "icons/**/*", "manifest.json", "favicon.ico"],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: contentVersion ? { NEXT_PUBLIC_CONTENT_VERSION: contentVersion } : {},
};

export default withSerwist(nextConfig);
