import { writeFileSync } from 'node:fs';
import { posts } from '../data/posts.ts';
import { interviews } from '../data/interviews.ts';
import { archiveImageUrl } from '../lib/social-metadata.ts';
import { ogCard, localImage } from '../lib/og-card.tsx';
const pick = process.argv.slice(2);
for (const slug of pick) {
  const p = posts.find((x) => x.slug === slug);
  const v = interviews.find((x) => x.slug === slug);
  const res = await (p
    ? ogCard({ kicker: p.category, title: p.title, summary: p.summary, image: await localImage(archiveImageUrl(p)) })
    : ogCard({ kicker: '목소리', byline: v!.name, title: v!.title, summary: v!.summary, image: await localImage(v!.thumbnailUrl) }));
  writeFileSync(`/tmp/og-${slug.slice(0, 24)}.png`, Buffer.from(await res.arrayBuffer()));
  console.log('ok', slug);
}
