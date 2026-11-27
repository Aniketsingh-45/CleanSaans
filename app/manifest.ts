import type { MetadataRoute } from "next";

/**
 * PWA Web App Manifest for CleanSaans.
 * Configured with teal brand theme, standalone mobile display,
 * and 192/512 PNG and SVG brand icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CleanSaans",
    short_name: "CleanSaans",
    description: "Saaf saans, sabke saath. Mobile-first winter smog assistant for Indian families.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
