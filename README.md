# CCTV performance fix

Replace these files in the repo:

- `components/cctv/CCTVGrid.tsx`
- `components/cctv/VideoCell.tsx`
- `components/cctv/TimestampOverlay.tsx`

Then append the contents of:

- `app/globals.performance-additions.css`

...to the end of the real `app/globals.css`.

Main changes:

1. Local video playback is no longer launched by every `<video autoplay>` at once. Starts are staggered and, in performance mode, scheduled during idle time.
2. Timestamp updates no longer call React `setState` in every camera once per second. One shared timer updates only text nodes.
3. Object URLs are no longer revoked while a video element may still be using them. Revocation is delayed and tied to removed files, not grid visibility.
4. ResizeObserver is disabled unless a non-auto aspect ratio is used.
5. Performance mode now triggers on weak devices (`<=6` logical cores, `<=4GB` device memory, or reduced motion) and for 3×3+ grids.
