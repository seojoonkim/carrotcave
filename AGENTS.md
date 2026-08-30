# Carrot Cave delivery rules

## Latest Telegram post sync

When asked to sync the latest Telegram posts to the website:

1. Use the known source `https://t.me/s/carrotcave` and this repository immediately. Do not begin with broad filesystem, session, or web searches.
2. Read `data/sync-state.json`, fetch only the missing highest message IDs, and use `scripts/publish-single-message.mjs` for each reviewed message.
3. Add reviewed metadata overrides, publish in ascending ID order, run focused publication/content tests, then `npm run verify` once.
4. Commit and push once, verify the production deployment and exact newest titles once, then report completion.
5. On one acquisition failure, switch directly between the channel page and the direct embed URL. Do not restart broad discovery.

Target the shortest verified path. A normal three-post text-only sync should not include historical audits or unrelated research.
