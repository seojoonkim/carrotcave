import type { NextConfig } from "next";
import aliases from './data/post-route-aliases.json';

const nextConfig: NextConfig = {
  // Menu taps reuse prefetched pages instead of waiting on the server again.
  experimental: { staleTimes: { dynamic: 120, static: 300 } },
  async redirects() {
    // Old numeric post URLs keep working in both languages.
    return [...aliases, ...aliases.map((a) => ({ ...a, source: `/en${a.source}`, destination: `/en${a.destination}` }))];
  },
  outputFileTracingIncludes: {
    '/': [
      './public/voices/liang-wenfeng/long-reader-ko.json',
      './public/voices/liang-wenfeng/key-sentences.json',
      './public/voices/liao-heng/transcript-ko.json',
      './public/voices/liao-heng/key-sentences.json',
      './public/voices/sam-altman-startup-school-2026/transcript-ko.json',
      './public/voices/yang-zhilin/transcript-ko.json',
    ],
  },
};

export default nextConfig;
