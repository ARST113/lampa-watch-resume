# ARX Player Tools for Lampa

**Version:** 0.1.0 (experimental). Independent JavaScript plugin for the **internal Lampa HTML5 player**; does not modify ARX TPlayer APK or the existing watch-resume plugin.

## Installation

Lampa → Settings → Extensions → Add plugin:

https://arst113.github.io/lampa-watch-resume/arx_player_tools.js

Source: [arx_player_tools.js](arx_player_tools.js). New settings section: **ARX Player Tools**. Leave automatic skipping off initially.

## Features implemented in 0.1.0

- Intro / recap / credits / next-episode preview / embedded ad segment support; individual toggles. Ads and previews off by default.
- Public metadata APIs: [SkipDB](https://skipdb.tv/docs), [IntroDB](https://introdb.app/docs/api), [TheIntroDB](https://theintrodb.org/docs). Missing and blocked requests fail open.
- Prefer skip segments provided by Lampa's launching app; playlist segments should have duration_ms in milliseconds, with segment start/end in **seconds**.
- Per-episode source consensus: two matching independent sources, or high-confidence SkipDB data, may be eligible for optional automatic skip. Uncertain matches are manual only.
- Undo button (nine seconds), opt-in red TV remote key, optional remaining-time overlay.
- Pause timer (15–90 minutes), plus pause on ended; interaction with Lampa auto-next still requires device validation.
- Per-episode 24-hour cache via Lampa.Storage. Does not overwrite file_view or sync_view playback history.
- Optional OpenSubtitles RU loading from the unmodified upstream https://m3dfatboi.github.io/lampa-opensubtitles-ru/opensubtitles_ru.js. Default OFF. Avoid duplicate injection if already installed; change this setting before restarting Lampa.

## Limitations

1. Skip UI and seek require **Lampa's internal HTML5 player**. External ARX TPlayer / Just+ / mpv / VLC have independent video engines: ordinary JavaScript cannot seek inside their processes.
2. Streaming sources must expose a seekable video.currentTime. DRM and unseekable streams may not support skip.
3. Different cuts/editions can offset timestamps. Verify playback before enabling auto-skip. Large mismatches in duration for playlist-supplied segments are rejected.
4. APIs can enforce CORS, change response schema or availability. Live Lampa / Android TV validation is pending.
5. Smart TV browsers differ in remote focus support. Red remote key mode is an alternative to the on-screen button.
6. This plugin does not decode embedded MKV subtitle tracks. OpenSubtitles RU handles external subtitle lookup. [Improved Subtitles](https://github.com/adambenhassen/lampa-improved-subtitles) provides a separate dual-subtitle solution for some browsers and file types. Running multiple subtitle-control plugins concurrently may conflict.
7. Native Dolby Vision, audio passthrough, AC3/EAC3/DTS decode, 4K decoders, picture render controls, HDMI refresh matching and hardware fallbacks **cannot be added by plain Lampa JavaScript**.

## Data and privacy

The plugin sends public IMDb / TMDB identifiers, episode numbers and optionally video duration to providers. It does **not** send private torrent stream URLs, TorrServer addresses, credentials or viewing history. OpenSubtitles RU is loaded from a third-party server only when explicitly enabled.

SkipDB API/data are subject to its ODbL 1.0 + reciprocity terms; responses here are transient local cached playback metadata. Respect the separate terms of other providers.

## Automated testing

Workflow: [.github/workflows/arx-player-tools.yml](.github/workflows/arx-player-tools.yml). Tests: [tests/arx_player_tools.test.js](tests/arx_player_tools.test.js). Automated syntax tests and mock payload/unit logic cannot establish real TV compatibility.

**Device acceptance:** test intro/recap/end credits against a known TV episode; verify undo and red remote key; navigate next episode to check cache isolation; verify no crash with disabled internet and with an external player; check subtitle duplication if the optional upstream loader is enabled.

## Next iterations

Extend to the remaining Just+ data sources, draw verified segments on the player timeline, add manual correction of timestamps, chapters and subtitle-derived suggestions, enhance timer UI, integrate subtitle priority and dual-track presentation where supported, and test Android TV, WebOS and Tizen independently.
