// Caption capture: harvest a player's cues into the sidebar.
//
// Three paths run together — read video.textTracks; hook XHR/fetch for any
// WEBVTT body; mirror the on-screen cue container as a last resort.
//
// The only module with cross-file dependencies: it reads what
// 20-caption-sidebar.js and 30-caption-sites.js publish on window.__cupShared.

  (function captionCapture() {
    // Published by 20-caption-sidebar.js and 30-caption-sites.js. build.sh
    // concatenates src/*.js in filename order, so both have already run — that
    // ordering is the whole reason these files are numbered.
    const shared = window.__cupShared || {};
    const createSubtitleUI = shared.createSubtitleUI;
    const CAPTION_SITES = shared.CAPTION_SITES;
    const resolveCaptionSite = shared.resolveCaptionSite;
    // The one behaviour this split adds. An earlier module failing at runtime
    // used to surface as a crash deep inside the harvest, a long way from the
    // cause; the bundle is fetched at runtime by every install, so say plainly
    // what is missing instead.
    if (typeof createSubtitleUI !== 'function' ||
        typeof resolveCaptionSite !== 'function' || !CAPTION_SITES) {
      console.warn('[captions] not installed — an earlier module in the bundle '
        + 'did not run (need 20-caption-sidebar.js and 30-caption-sites.js)');
      return;
    }
    const host = (location && location.host) || '';
    let site = resolveCaptionSite();
    // A DOM probe can miss on first run if the player hasn't rendered yet.
    // Bail only when there is no <video> either — re-injection on navigation
    // gives us another chance.
    if (!site && !document.querySelector('video')) return;
    if (!site) site = CAPTION_SITES[CAPTION_SITES.length - 1];
    // Version tag: bump whenever the snippet changes in a way that requires
    // tearing down the previous install (new UI, new state shape, etc).
    // The previous install's tear-down hook clears its sidebar + intervals.
    const CAPS_VERSION = 18;
    const prev = window.__cupCapsInstalled;
    if (prev && typeof prev === 'object' && prev.version >= CAPS_VERSION) return;
    if (prev && typeof prev === 'object' && typeof prev.teardown === 'function') {
      try { prev.teardown(); } catch (_) {}
    }
    const intervalIds = [];
    const installToken = { version: CAPS_VERSION, intervalIds, teardown };
    window.__cupCapsInstalled = installToken;
    function teardown() {
      for (const id of intervalIds) { try { clearInterval(id); } catch (_) {} }
      intervalIds.length = 0;
      const oldSidebar = document.querySelector('.cup-sub-sidebar');
      if (oldSidebar) oldSidebar.remove();
      document.body.classList.remove('cup-sub-split');
      // CSS-in-JS marker class we may have left on a player wrapper.
      document.querySelectorAll('.cup-shrink-target').forEach(el => el.classList.remove('cup-shrink-target'));
    }
    // Wrap setInterval so every timer this install starts can be cleared
    // by teardown later. Keeps the install fully self-contained.
    const ownSetInterval = (fn, ms) => {
      const id = setInterval(fn, ms);
      intervalIds.push(id);
      return id;
    };

    const ui = createSubtitleUI({
      bodyClass: 'cup-sub-split',
      shrinkSelectors: site.shrinkSelectors,
    });

    function isWatchPage() {
      // Sites that also serve non-video pages narrow this down; everywhere
      // else, the presence of a <video> is the only signal we have.
      if (typeof site.isWatchPage === 'function') {
        try { return !!site.isWatchPage(); } catch (_) { return true; }
      }
      return !!document.querySelector('video');
    }

    // ---- diagnostics: dump what we see every 4 s until we capture cues ----
    let diagN = 0, lastDiag = '';
    function diag() {
      diagN++;
      const v = document.querySelector('video');
      const tracks = v && v.textTracks ? v.textTracks : null;
      const tInfo = tracks
        ? Array.from(tracks).map(t =>
            (t.language || t.label || '?') + '/' + t.mode + '/cues=' + (t.cues ? t.cues.length : 'null'))
        : 'no-video';
      const line = 'video=' + !!v + ' watchPage=' + isWatchPage() +
                   ' tracks=' + (tracks ? tracks.length : 0) +
                   ' info=' + JSON.stringify(tInfo);
      if (line !== lastDiag) {
        lastDiag = line;
        console.log('[svt diag #' + diagN + ']', line);
        // First diag dump: also log a chunk of ancestor class names for
        // the <video> so we can tune shrinkSelectors against the real DOM.
        if (v && diagN < 4) {
          let el = v, chain = [];
          while (el && chain.length < 8) {
            const cls = (typeof el.className === 'string' && el.className) ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
            chain.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : ''));
            el = el.parentElement;
          }
          console.log('[svt video ancestors]', chain.join(' > '));
        }
      }
    }
    ownSetInterval(diag, 4000);
    setTimeout(diag, 500);

    // ---- 1) textTracks: read cues directly ----
    function harvestTrack(track) {
      if (!track || !track.cues) return 0;
      let n = 0;
      for (let i = 0; i < track.cues.length; i++) {
        const c = track.cues[i];
        if (!c || !c.text) continue;
        const text = String(c.text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        ui.addCue({ start: c.startTime || 0, end: c.endTime || (c.startTime || 0) + 3, text });
        n++;
      }
      return n;
    }

    function pumpTextTracks() {
      const v = document.querySelector('video');
      if (!v) return;
      ui.setVideoElement(v);
      const tracks = v.textTracks;
      if (!tracks || !tracks.length) return;
      for (let i = 0; i < tracks.length; i++) {
        const tt = tracks[i];
        // Only real caption tracks. Storyboard thumbnails ride in as
        // kind='metadata', and players leave those disabled on purpose — so
        // forcing them to 'hidden' below was actively creating the problem.
        // An empty kind is allowed: some players never set one.
        const kind = (tt.kind || '').toLowerCase();
        if (kind && kind !== 'subtitles' && kind !== 'captions') continue;
        // Mode 'disabled' = cues never populated. Switch to 'hidden' which
        // populates without forcing the on-screen subtitle UI.
        if (tt.mode === 'disabled') {
          try { tt.mode = 'hidden'; } catch (_) {}
        }
        const got = harvestTrack(tt);
        if (got) console.log('[caps] textTrack', tt.language || tt.label, 'gave', got, 'cues');
        // Future cues (live/streamed VTT segments) arrive via cuechange.
        if (!tt.__cupBound) {
          tt.__cupBound = true;
          tt.addEventListener('cuechange', () => harvestTrack(tt));
          tt.addEventListener('addtrack', () => harvestTrack(tt));
        }
      }
    }

    // Catch tracks added after our first scan.
    if (HTMLMediaElement.prototype.addTextTrack && !HTMLMediaElement.prototype.__cupSvtHooked) {
      const orig = HTMLMediaElement.prototype.addTextTrack;
      HTMLMediaElement.prototype.addTextTrack = function() {
        const t = orig.apply(this, arguments);
        setTimeout(pumpTextTracks, 100);
        return t;
      };
      HTMLMediaElement.prototype.__cupSvtHooked = true;
    }

    // ---- 2) XHR / fetch hook for sidecar WebVTT downloads ----
    function looksLikeVtt(text) {
      return text && /^﻿?WEBVTT/.test(text.substring(0, 50));
    }
    function parseAndPushVtt(text) {
      const lines = text.split(/\r?\n/);
      let i = 0, added = 0;
      while (i < lines.length) {
        const line = lines[i++];
        const m = line.match(/^(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)\s+-->\s+(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)/);
        if (!m) continue;
        const start = vttToSec(m[1]);
        const end = vttToSec(m[2]);
        const buf = [];
        while (i < lines.length && lines[i] !== undefined && lines[i].trim() !== '') {
          buf.push(lines[i++].replace(/<[^>]+>/g, ''));
        }
        const txt = buf.join(' ').replace(/\s+/g, ' ').trim();
        if (txt && !isThumbnailCue(txt)) { ui.addCue({ start, end, text: txt }); added++; }
      }
      if (added) console.log('[caps] VTT parsed:', added, 'cues');
    }
    function vttToSec(t) {
      const parts = t.split(':');
      let h = 0, m = 0, s = 0;
      if (parts.length === 3) { h = +parts[0]; m = +parts[1]; s = parseFloat(parts[2]); }
      else if (parts.length === 2) { m = +parts[0]; s = parseFloat(parts[1]); }
      else s = parseFloat(parts[0]);
      return h * 3600 + m * 60 + s;
    }

    (function hookNetwork() {
      const oOpen = XMLHttpRequest.prototype.open;
      const oSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(m, u) { this.__cupSvtUrl = String(u || ''); return oOpen.apply(this, arguments); };
      XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', () => {
          try {
            const t = this.responseText;
            if (looksLikeVtt(t)) parseAndPushVtt(t);
          } catch (_) {}
        });
        return oSend.apply(this, arguments);
      };
      const oFetch = window.fetch;
      if (oFetch) {
        window.fetch = function(input, init) {
          const url = typeof input === 'string' ? input : (input && input.url) || '';
          const p = oFetch.apply(this, arguments);
          p.then(r => r && r.clone && r.clone().text().then(t => {
            if (looksLikeVtt(t)) parseAndPushVtt(t);
          })).catch(() => {});
          return p;
        };
      }
    })();

    // ---- 3) DOM mirror — the only path needing per-site knowledge ----
    // The player paints the current cue into `site.domSelector`, optionally
    // into an inner `site.cueSelector`, usually with each line in its own
    // <span>. Timing comes from the video's clock, since the DOM says only
    // "this is on screen now".
    (function hookDom() {
      if (!site.domSelector) return;
      let lastText = '';
      let lastChangeAt = 0;
      ownSetInterval(() => {
        const container = document.querySelector(site.domSelector);
        if (!container) return;
        // Prefer the inner cue element (multiple lines) — fall back to the
        // container itself when the site has no inner wrapper.
        const cueEl = (site.cueSelector && container.querySelector(site.cueSelector)) || container;
        // Join <span> children with newlines so multi-line cues stay separated.
        let text;
        const spans = cueEl.querySelectorAll('span');
        if (spans.length) {
          const parts = [];
          spans.forEach(sp => {
            const t = (sp.innerText || sp.textContent || '').trim();
            if (t) parts.push(t);
          });
          text = parts.join('\n');
        } else {
          text = (cueEl.innerText || cueEl.textContent || '').trim();
        }
        text = text.replace(/[ \t]+/g, ' ').trim();
        if (!text || text === lastText) return;
        lastText = text;
        const now = Date.now();
        if (now - lastChangeAt < 200) return;
        lastChangeAt = now;
        const v = ui.currentVideo || document.querySelector('video');
        const start = v ? v.currentTime : 0;
        ui.addCue({ start, end: start + 3, text });
      }, 300);
    })();

    // ---- video discovery + split-view auto-toggle ----
    function findPlayerContainer(videoEl) {
      // Walk up from <video> looking for the outermost ancestor that is
      // visually a "player frame" — one whose bottom reaches near the
      // viewport bottom and which contains the video. SVT renders its
      // overlay controls inside this container; shrinking it shrinks the
      // controls with it.
      let best = videoEl;
      let el = videoEl.parentElement;
      let steps = 0;
      while (el && steps < 8) {
        const r = el.getBoundingClientRect();
        const vr = videoEl.getBoundingClientRect();
        // Container is at least as tall as the video and not body/html.
        if (el.tagName === 'BODY' || el.tagName === 'HTML') break;
        if (r.height >= vr.height && r.width >= vr.width) best = el;
        el = el.parentElement;
        steps++;
      }
      return best;
    }
    let lastMarked = null;
    ownSetInterval(() => {
      const v = document.querySelector('video');
      if (v) ui.setVideoElement(v);
      const want = isWatchPage() && !!v;
      if (want) ui.buildSidebar();
      ui.setSplit(want);
      if (want && v) {
        const wrap = findPlayerContainer(v);
        if (wrap && wrap !== lastMarked) {
          if (lastMarked) lastMarked.classList.remove('cup-shrink-target');
          wrap.classList.add('cup-shrink-target');
          lastMarked = wrap;
          console.log('[caps] shrink target =', wrap.tagName, wrap.className || '(no class)');
        }
      } else if (!want && lastMarked) {
        lastMarked.classList.remove('cup-shrink-target');
        lastMarked = null;
      }
      // Pump textTracks periodically — SVT may swap them on next-episode.
      pumpTextTracks();
    }, 1000);

    console.log('Cupitor caption capture installed v' + CAPS_VERSION + ' (site=', site.id, 'host=', host, ')');
  })();
