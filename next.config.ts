import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
