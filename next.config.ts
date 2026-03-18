import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    proxyClientMaxBodySize: 60 * 1024 * 1024, // 60 MB for PDF + cover upload
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "bookify-book-companion.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "bookify-book-companion.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
