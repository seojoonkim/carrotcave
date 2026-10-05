// Renders share cards through the real route files (home, a post, a voice) without tsx: jiti + automatic JSX. Usage: node scripts/og-preview.mjs <post-slug>
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs';
import { writeFileSync } from 'node:fs';
import * as React from '../node_modules/react/index.js';
globalThis.React = React.default ?? React;
const jiti = createJiti(import.meta.url, { jsx: { runtime: 'automatic' }, alias: { '@': new URL('..', import.meta.url).pathname.replace(/\/$/, '') } });
const R = new URL('..', import.meta.url).pathname;
const fn = (m) => m.default?.default ?? m.default;
const home = await jiti.import(R + 'app/opengraph-image.tsx');
const post = await jiti.import(R + 'app/posts/[slug]/opengraph-image.tsx');
const voice = await jiti.import(R + 'app/voices/[slug]/opengraph-image.tsx');
for (const [name, res] of [['home', await fn(home)()], ['post', await fn(post)({ params: Promise.resolve({ slug: process.argv[2] }) })], ['voice', await fn(voice)({ params: Promise.resolve({ slug: 'liao-heng' }) })]]) {
  writeFileSync(`${process.env.OUT || '/tmp'}/og-${name}.png`, Buffer.from(await res.arrayBuffer())); console.log('ok', name);
}
