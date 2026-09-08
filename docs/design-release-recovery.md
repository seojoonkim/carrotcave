# Design release recovery

## Observed facts
- deleg_27830e12 returned max_iterations after 419.23 seconds, 26 API calls. Model reported gpt-6-astra. Full transcript retained at /Users/gimseojun/.hermes/profiles/sano/cache/delegation/live/deleg_27830e12/task-0.log (private local evidence, not included in deployment assets).
- Worker left a 21-line CSS override and design audit. No commit or deployment. Existing tests/build passed according to its result, not visual acceptance.
- Parent inspected git status and diff before continuing. Unrelated sync/media evidence remains excluded.
- A real headless Chrome 390px capture showed two-column title/summary compression and excessive empty card space.
- New browser regression scripts/verify-design.mjs failed on prior build: expected 0px border, actual 1px. This reproduces a concrete mismatch with the accepted borderless direction.
- A parent diagnostic used ambiguous `header` locator, failed strict mode because page has a site header and semantic section header. Corrected to `.cc-header` and reran successfully; durable probe asserts exactly one site header.

## Cause and correction
The orchestration combined audit, implementation, QA and publication into one bounded worker. Turn exhaustion stranded publication; ordinary green tests did not encode the new visual requirements. This is not evidence of a provider or network fault.

Recovery is a strict CSS/audit-only slice. Parent retains responsive browser regression, visual review, final build, source publication, deployment and canonical readback. The profile-local delegated-agent-failure-retrospective skill now explicitly requires actual-diff review and mobile title/summary regression after this failure shape.

## Verification
The browser probe is parameterized with APP_URL and checks real mobile/desktop layout, navigation, reader video playback, footer asset decode and reduced-motion card behavior. Its red result against the prior build is preserved above; passing local/live evidence is recorded separately by the same probe during release.

## Boundaries
Historical tool error counts alone provide no root-cause evidence. They are not claimed repaired. The missing eslint executable is a separate dependency boundary; no security or tool-service configuration was changed or restarted. No unsupported service-level repair is claimed.
