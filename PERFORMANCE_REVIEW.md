# Review: CCTV local video playback performance

## Evidence from attached logs

- `v0-retro-cctv-dashboard-m3u2.vercel.app-1782402760587.log`: 66 repeated `ERR_FILE_NOT_FOUND` requests for local `blob:` video URLs.
- `v0-retro-cctv-dashboard-m3u2.vercel.app-1782402784956.log`: 396 console lines, including 330 `[Violation]` long handlers and the same 66 `blob:` failures.
- HAR: 39 network entries. JS transfer was about 798 KB, CSS about 50 KB, fonts about 120 KB. This is not the primary problem; the stutter is client-side video orchestration and React work during playback.
- Heap snapshot: about 12.34 MB. It does not point to a huge memory leak. The visible failure mode is CPU/main-thread pressure plus invalidated blob URLs.

## Root causes found in repo code

1. `TimestampOverlay.tsx` runs `setInterval(..., 1000)` per camera and calls React `setState` every second. With 4-16 cameras, that creates synchronized React renders during playback.
2. `VideoCell.tsx` starts every `<video>` immediately via `autoPlay`, `setTimeout(..., 0)`, and repeated `play()` calls from `canplay`/`loadeddata` paths. On weak CPUs this creates a decode/startup herd.
3. `CCTVGrid.tsx` revokes object URLs when a file is not in the currently visible grid slice. During grid changes/reorders, a video element can still hold that URL, causing `blob:... net::ERR_FILE_NOT_FOUND` loops.
4. `ResizeObserver` is active for every camera even when aspect ratio is `auto`, where it is not needed.
5. Performance mode only triggers at `<=4` logical cores or 3×3+ grids. Many old weak machines expose more than four logical cores but still choke on multiple video decoders.

## Fix set

- Shared clock for all timestamp overlays; updates text nodes directly instead of causing React re-render storms.
- Controlled video startup: no `autoPlay`, no repeated `play()` from JSX event handlers, staggered start, idle scheduling in performance mode.
- Safer blob URL lifecycle: revoke only when a file is removed from the selected folder, and delay revocation to let existing media elements detach cleanly.
- Disable `ResizeObserver` when aspect ratio is `auto`.
- Broader low-power detection: `<=6` logical cores, `<=4GB` device memory, reduced motion, or 3×3+ grid.
- Extra CSS disables nonessential animations/text glow inside `[data-performance-mode='true']`.

## Integration

Replace:

- `components/cctv/CCTVGrid.tsx`
- `components/cctv/VideoCell.tsx`
- `components/cctv/TimestampOverlay.tsx`

Append:

- `app/globals.performance-additions.css` to the end of `app/globals.css`.

Then run:

```bash
pnpm install
pnpm lint
pnpm build
```

I could not push a branch or open a PR because the GitHub connector reports read-only access to `program-perfect/cctv` (`pull: true`, `push: false`).
