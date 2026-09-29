// Renders share cards through the real route files (what production serves) to /tmp for review.
import { writeFileSync } from 'node:fs';
import { posts } from '../data/posts.ts';
import * as postRoute from '../app/posts/[slug]/opengraph-image.tsx';
import * as voiceRoute from '../app/voices/[slug]/opengraph-image.tsx';
import * as homeRoute from '../app/opengraph-image.tsx';
const fn = (m: any) => m.default?.default ?? m.default;
for (const slug of process.argv.slice(2)) {
  const res = slug === 'home'
    ? await fn(homeRoute)()
    : posts.some((p) => p.slug === slug)
      ? await fn(postRoute)({ params: Promise.resolve({ slug }) })
      : await fn(voiceRoute)({ params: Promise.resolve({ slug }) });
  writeFileSync(`/tmp/og2-${slug.slice(0, 24)}.png`, Buffer.from(await res.arrayBuffer()));
  console.log('ok', slug);
}
