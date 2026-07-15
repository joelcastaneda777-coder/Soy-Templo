import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cuando se compile para Capacitor, cambiar a: output: "export"
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
