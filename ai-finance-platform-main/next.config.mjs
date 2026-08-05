/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },

  // Prevent pdf-parse and pdfjs-dist from being bundled by Next.js SSR
  // This avoids the "Cannot find module pdf.worker.mjs" error
  serverExternalPackages: ["pdf-parse", "pdf-parse/node", "pdfjs-dist"],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "zod/v3": "zod",
    };
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    turbo: {
      resolveAlias: {
        "zod/v3": "zod",
      },
    },
  },
};

export default nextConfig;
