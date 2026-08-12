import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Per pdf-parse's own Next.js/Vercel guidance: keep it (and its native
  // @napi-rs/canvas dependency) out of the server bundle so Node resolves
  // them straight from node_modules in serverless too. The worker script
  // itself is handled separately via pdf-parse/worker's getData() in
  // app/api/resources/extract-text/route.ts — bundling was rewriting its
  // runtime file path and breaking worker setup in both dev and prod.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
