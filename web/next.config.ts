import type { NextConfig } from "next";


const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const urlHost = appUrl.replace(/^https?:\/\//, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    urlHost,
    "localhost:3000",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        urlHost,
      ],
    },
  },
};

export default nextConfig;
