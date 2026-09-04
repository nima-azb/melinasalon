import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.ir-thr-at1.arvanstorage.ir",
        pathname: "/melina-salon/**",
      },
    ],
  },
};

export default nextConfig;
