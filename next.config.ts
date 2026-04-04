import path from 'path';
import type {NextConfig} from 'next';

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: projectRoot,
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/pdf-parse/dist/**/*",
      "node_modules/pdfjs-dist/**/*",
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        dns: false,
      };
    }
    return config;
  },
};

export default nextConfig;
