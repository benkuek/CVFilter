import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const cspDomains = process.env.CSP_DOMAINS?.split(',');
    if (!cspDomains) return [];
    
    const domains = cspDomains.join(' ');
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `script-src 'self' 'unsafe-inline' ${domains}; font-src 'self' data: ${domains};`
          }
        ]
      }
    ];
  }
};

export default nextConfig;
