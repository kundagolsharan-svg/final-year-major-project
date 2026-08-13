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
      // Allow requests from VS Code port forwarding tunnels, local network mobile access, etc.
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "127.0.0.1:3000",
        "127.0.0.1:3001",
        // VS Code Dev Tunnels - all regions (inc1, use1, etc.)
        "*.inc1.devtunnels.ms",
        "*.use1.devtunnels.ms",
        "*.asse.devtunnels.ms",
        "*.euw.devtunnels.ms",
        "*.vscode.devtunnels.ms",
        "*.devtunnels.ms",
        // GitHub Codespaces
        "*.github.dev",
        "*.app.github.dev",
        // Local network mobile access (e.g. 192.168.x.x:3000)
        "192.168.*",
        "10.0.*",
        // ngrok tunnels
        "*.ngrok.io",
        "*.ngrok-free.app",
      ],
    },
    turbo: {
      resolveAlias: {
        "zod/v3": "zod",
      },
    },
  },
};

export default nextConfig;
