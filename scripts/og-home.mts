import { writeFileSync } from 'node:fs';
import * as mod from '../app/opengraph-image.tsx';
const Image = (mod as any).default?.default ?? (mod as any).default;
writeFileSync('/tmp/og-home.png', Buffer.from(await (await Image()).arrayBuffer())); console.log('ok');
