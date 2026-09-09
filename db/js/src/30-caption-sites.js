// Which players the caption capture understands, and how to find their cues.
//
// This is the configuration surface. It is served from gh-pages and fetched
// at runtime, so adding a player or repairing a layout that changed is an
// edit here — never an app release.
(function () {
  const shared = window.__cupShared || (window.__cupShared = {});
  // -----------------------------------------------------------------------
  // Caption capture module
  //
  // Three capture paths, all running together:
  //   1) Read existing video.textTracks. If any has cues populated (or we
  //      can force mode='hidden' to populate them), we get the full
  //      transcript with accurate timing — best case.
  //   2) XHR/fetch hook: any response body starting with `WEBVTT` is a
  //      subtitle file. Parse it and push every cue.
  //   3) DOM observer fallback: mirror the on-screen cue container if the
  //      first two miss. This is the only path that needs per-site knowledge.
  //
  // CAPTION_SITES is the configuration surface. This file is served from
  // gh-pages and fetched at runtime, so adding a player or repairing a
  // changed layout is an edit here — no app release.
  //
  //   host          match the site by domain
  //   domProbe      match the site by the presence of this element, whatever
  //                 the domain (players identifiable by their own markup)
  //   domSelector   where the on-screen cue text lives, once matched
  //   cueSelector   optional inner element inside domSelector holding the cue
  //   shrinkSelectors  player frame(s) to shrink for split view
  //   isWatchPage   optional — restrict the sidebar to real video pages
  //
  // An entry needs `host` or `domProbe` to match. `domSelector` is only
  // needed for path 3; entries without one still get paths 1 and 2.
  // -----------------------------------------------------------------------
  const CAPTION_SITES = [
    {
      id: 'svt',
      host: /(^|\.)svtplay\.se$|(^|\.)svt\.se$/,
      // SVT uses obfuscated CSS-in-JS class names ("vp_b", "css-dgqlcd")
      // but reliable data-rt attributes for everything important.
      // Outermost player frame is data-rt="video-player-fullscreen".
      shrinkSelectors: [
        '[data-rt="video-player-fullscreen"]',
        '[data-rt="video-player-container"]',
        '[data-rt="video-player-frame"]',
      ],
      domSelector: '[data-rt="subtitles-container"]',
      cueSelector: '.vtt-cue-teletext',
      isWatchPage: () =>
        /\/video\//.test(location.pathname) ||
        /\/(klipp|kanaler)\//.test(location.pathname),
    },
    {
      id: 'urplay',
      host: /(^|\.)urplay\.se$/,
      domSelector: '.jw-text-track-display',
      shrinkSelectors: ['.jwplayer', '.jw-wrapper'],
    },
    {
      // Any JW Player page, whatever the domain — the markup identifies it.
      id: 'jwplayer',
      domProbe: '.jw-text-track-display',
      domSelector: '.jw-text-track-display',
      shrinkSelectors: ['.jwplayer', '.jw-wrapper'],
    },
    {
      id: 'youtube',
      host: /(^|\.)youtube\.com$/,
      domSelector: '.ytp-caption-window-container',
      cueSelector: '.ytp-caption-segment',
      shrinkSelectors: ['#movie_player', '.html5-video-player'],
    },
    {
      // Fallback: no DOM knowledge, but native TextTracks and sidecar WebVTT
      // still work, which covers most standard HTML5 players.
      id: 'native',
      domProbe: 'video',
    },
  ];

  function resolveCaptionSite() {
    const host = (location && location.host) || '';
    for (const s of CAPTION_SITES) {
      if (s.host && s.host.test(host)) return s;
    }
    // Host didn't match — fall back to identifying the player by its markup.
    for (const s of CAPTION_SITES) {
      if (s.domProbe) {
        try {
          if (document.querySelector(s.domProbe)) return s;
        } catch (_) {}
      }
    }
    return null;
  }
  shared.CAPTION_SITES = CAPTION_SITES;
  shared.resolveCaptionSite = resolveCaptionSite;
})();
