import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@ifcwise/shared"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  turbopack: {
    // @thatopen/fragments feature-checks WebGPU-only members on `import * as THREE from "three"`
    // (THREE.MRTNode, THREE.NodeMaterial, …), which three only exports from three/webgpu. Vite tolerates
    // missing namespace members; Turbopack reports them. They resolve to undefined and the WebGL path is used.
    ignoreIssue: [{ path: /@thatopen[\\/]fragments/, title: /Export \w+ doesn't exist in target module/ }],
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
