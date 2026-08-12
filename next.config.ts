import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in pdfjs-dist, which loads its worker script via a
  // runtime-relative dynamic import — bundling it rewrites that path and
  // breaks the lookup ("Cannot find module '.../pdf.worker.mjs'"). Keeping
  // it external means Node resolves it straight from node_modules instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
