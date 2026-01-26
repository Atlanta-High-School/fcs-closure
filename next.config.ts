import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false, // Disable React Compiler for Vercel compatibility
  output: 'standalone', // Ensure proper output directory structure
  distDir: '.next', // Explicitly set output directory
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;
