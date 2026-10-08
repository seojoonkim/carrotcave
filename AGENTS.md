# Carrot Cave delivery rules

## Latest Telegram post sync

When asked to sync the latest Telegram posts to the website:

1. Use the known source `https://t.me/s/carrotcave` and this repository immediately. Do not begin with broad filesystem, session, or web searches.
2. Read `data/sync-state.json`, fetch only the missing highest message IDs, and use `scripts/publish-single-message.mjs` for each reviewed message.
3. Add reviewed metadata overrides, publish in ascending ID order, run focused publication/content tests, then `npm run verify` once.
4. Commit and push once, verify the production deployment and exact newest titles once, then report completion.
5. On one acquisition failure, switch directly between the channel page and the direct embed URL. Do not restart broad discovery.

Target the shortest verified path. A normal three-post text-only sync should not include historical audits or unrelated research.

## Voice reader house rules (목소리 기본 룰)

Every published voice (`data/interviews.ts` `status: 'published'`) must have:

1. **Key sentences highlighted** — at least 10 core quotes from the main speaker (about 2–3 per chapter), one format only: `key-sentences.json` as `[{ "id": <integer>, "exact_quote": "<exact text>" }]` rendered by the shared `reader-runtime.js`, or `<mark class="key-sentence">` in static readers. No per-page `<strong>` emphasis or custom highlight CSS; the style lives in `reader-system.css`.
2. **Date line** right after `</h1>`: `<p class="hero-date">LABEL <time datetime="YYYY-MM-DD">YYYY년 M월 D일</time> · source</p>`. The label states what the date is (대담/인터뷰/공개/강연 영상 공개/회의/녹화), checked against the primary source.
3. **Hero photo** `<figure class="hero-portrait">`, shown without fade or desaturation.

`tests/voice-house-rules.test.mjs` enforces these in `npm run verify`, so a voice missing any rule cannot be released.

## Changing a post's category

Use `npm run recategorize -- <slug> <탐험|빌딩|낙서|소설>`. It updates `data/posts.ts` and the metadata override, then regenerates the ontology in the publish order (draft → build → audit). Running only `ontology:regen` leaves stale annotations and fails `npm run verify`.

## Link thumbnail rule

Every link that stands on its own line (bare URL, `라벨: URL`, `라벨 URL`, bullet, or markdown link) renders as a thumbnail card.
After publishing or editing a post, run `node --experimental-strip-types scripts/update-link-previews.mjs` so each link has preview data.
Pages without `og:image` automatically get a monogram tile, so a card is never text-only. `tests/link-thumbnail-rule.test.mjs` enforces this in `npm run verify`.

## Accent colors

Carrot orange (`--carrot-orange`) is for action and selection. Leaf green (`--leaf-pop`, #a6d36b) is the supporting accent for labels, discovery, and section kickers. Never use leaf for the selected menu or primary buttons.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
