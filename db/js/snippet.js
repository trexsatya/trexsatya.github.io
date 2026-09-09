// GENERATED FILE — DO NOT EDIT.
//
// Built from db/js/src/*.js by db/js/build.sh. Edit the sources there and
// re-run that script; anything written here is lost on the next build.

// Riksdagen video pinner.
//
// riksdagen.se scrolls its player out of view while you read the transcript.
// Nothing else in the snippet depends on this, and it depends on nothing.
(function () {
  // ---------- riksdagen video pinner ----------
  function pinVideo() {
    let videoEl = null;
    let host = new URL(document.location.href).host;
    if (host === 'www.riksdagen.se') {
      videoEl = document.querySelector('video-js');
      let el = videoEl?.parentElement?.parentElement?.parentElement?.parentElement;
      console.log(el);
      if (el && el.style) {
        el.style.position = 'fixed';
        el.style.zIndex = 2000;
        el.style.top = '5px';
        el.style.left = '10px';
        el.style.width = '100%';
        el.style.height = '10%';
      }
      console.log(el.style.position);
    }
  }
  try { setTimeout(pinVideo, 3000); } catch (e) { alert('Error' + e); }
})();
// The caption sidebar: split view, draggable divider, time-synced highlight,
// click-to-seek rows, tappable words that post to CaptionHandler for lookup,
// selection + Send to a playlist, replay passes and translation.
//
// One factory over one shared `state`, which is why it is one file: its ~45
// functions are closures over that state, so they cannot be separated without
// threading a context object through all of them.
//
// Site modules feed it through the object it returns (addCue, buildSidebar,
// setSplit, setVideoElement); it knows nothing about any particular site.
(function () {
  const shared = window.__cupShared || (window.__cupShared = {});
  // -----------------------------------------------------------------------
  // Shared subtitle UI: split-view sidebar with draggable divider, time-
  // synced highlight, click-to-seek on cue rows, and clickable words that
  // post to window.CaptionHandler → opens dialog1 for word lookup.
  // Site-specific modules (SVT Play below) populate state.cues via addCue.
  // -----------------------------------------------------------------------
  function createSubtitleUI(opts) {
    const state = {
      cues: [],
      // Selection for "send to the app". Holds stable cue ids, not indices:
      // addCue splices into the middle, so indices shift under us.
      picking: false,
      selected: new Set(),
      nextCueId: 1,
      sidebar: null,
      listEl: null,
      currentVideo: null,
      activeIdx: -1,
      autoScroll: true,
      splitActive: false,
      bodyClass: opts.bodyClass || 'cup-sub-split',
      shrinkSelectors: opts.shrinkSelectors || ['video'],

      // Translation state
      translationEnabled: false,
      translationSource: opts.translationSource || 'sv',
      translationTarget: opts.translationTarget || 'en',
      nextTrId: 1,
      pendingTr: Object.create(null), // id → cue index
      // Strategies:
      //   1 = play through, translate as cues arrive
      //   2 = pause until current cue is translated
      //   3 = chunked replay, single pass at 1x
      //   4 = chunked replay, configurable repeats and per-repeat speeds
      strategy: 1,
      linesPerChunk: 5,
      // Strategy 3/4/5 bookkeeping. Chunk progression is PLAYBACK-driven:
      // we count cues the playhead actually enters, NOT cues harvested into
      // the list. SVT streams text-track cues into the buffer ahead of the
      // playhead, so counting on arrival made chunks fire instantly and the
      // video skipped forward without ever playing.
      chunkStartIdx: null,     // cue index where the current chunk began
      chunkStart: null,        // time of the first cue in the current chunk
      chunkEnd: null,          // end time of the last cue in the current chunk
      chunkReplaying: false,   // true while paused or in replay phase
      // Don't start a fresh chunk before this time — set to chunkEnd after a
      // replay completes so we don't immediately re-chunk the region we just
      // replayed (which would loop forever).
      chunkFloor: 0,
      // Strategy 4 / 5
      repeatCount: 1,          // how many replays after the original pass
      replaySchedule: '1-0.7', // speed per pass, "-" separated; last value extends
      currentPass: 0,          // 0 = original; 1+ = replay pass #
      // Strategy 5 only — gap in seconds inserted between passes.
      replayGap: 1,
      gapTimer: null,
      // User-pause tracking — true if the user (not our code) paused the
      // video. We refuse to auto-resume in that case so manual pauses stick.
      userOverrode: false,
      // Count of programmatic pauses awaiting their `pause` event. Each
      // ourPause() increments; the pause handler decrements. >0 means
      // "this pause is ours". A counter is race-free; the previous
      // timestamp window lost under JS-thread stalls >300ms.
      expectedPauses: 0,
      // Same idea for play — ourPlay() bumps this so the play handler
      // doesn't misclassify a synthetic resume as user-initiated.
      expectedPlays: 0,
      // Timestamp of our last programmatic seek. replayTick uses
      // a 500 ms grace after this to avoid advancing on stale timeupdates
      // (currentTime can still read the pre-seek value for a brief moment).
      lastSeekAt: 0,
      // Listener bindings we attached to the current video — kept so we
      // can remove them when SVT swaps the <video> element (ad breaks /
      // source switches). Without cleanup, old listeners keep firing on
      // detached video elements and double-advance the strategy state.
      videoListeners: null,
      // Bumped every replay pass start; a passToken captured at schedule
      // time lets the gap timer abort if the user / a new chunk moved on.
      passToken: 0,
      // Debug flag. When true (toggle via window.cupSubDebug=true in the
      // console, or via the settings dialog), strategy transitions log to
      // the console so we can diagnose misbehavior from a real session.
      debug: false,
    };
    try {
      if (typeof window !== 'undefined' && window.cupSubDebug) state.debug = true;
    } catch (_) {}
    function dlog(){
      if (!state.debug) return;
      try { console.log.apply(console, ['[cup-sub]'].concat([].slice.call(arguments))); } catch (_) {}
    }

    // Restore persisted prefs early so the buttons start in the right state.
    try {
      const saved = JSON.parse(localStorage.getItem('cupSubPrefs') || '{}');
      if (typeof saved.translationEnabled === 'boolean') state.translationEnabled = saved.translationEnabled;
      if (typeof saved.strategy === 'number') state.strategy = saved.strategy;
      if (typeof saved.linesPerChunk === 'number') state.linesPerChunk = saved.linesPerChunk;
      if (typeof saved.translationSource === 'string') state.translationSource = saved.translationSource;
      if (typeof saved.translationTarget === 'string') state.translationTarget = saved.translationTarget;
      if (typeof saved.repeatCount === 'number') state.repeatCount = saved.repeatCount;
      if (typeof saved.replaySchedule === 'string') state.replaySchedule = saved.replaySchedule;
      if (typeof saved.replayGap === 'number') state.replayGap = saved.replayGap;
      if (typeof saved.debug === 'boolean') state.debug = saved.debug;
    } catch (_) {}

    function persistPrefs() {
      try {
        localStorage.setItem('cupSubPrefs', JSON.stringify({
          translationEnabled: state.translationEnabled,
          strategy: state.strategy,
          linesPerChunk: state.linesPerChunk,
          translationSource: state.translationSource,
          translationTarget: state.translationTarget,
          repeatCount: state.repeatCount,
          replaySchedule: state.replaySchedule,
          replayGap: state.replayGap,
          debug: state.debug,
        }));
      } catch (_) {}
    }

    // Parse a "1-0.5-0.7" style schedule into a list of positive numbers.
    // Falls back to [1] on garbage input. Last value extends.
    function parseSchedule(str) {
      const arr = (str || '1').split('-').map(s => {
        const n = parseFloat(s);
        return (isFinite(n) && n >= 0.25 && n <= 4) ? n : 1;
      });
      return arr.length ? arr : [1];
    }
    function speedForPass(passIdx) {
      // Strategy 3 is "play N lines then replay once at normal speed".
      if (state.strategy === 3) return 1;
      const sched = parseSchedule(state.replaySchedule);
      return sched[Math.min(passIdx, sched.length - 1)];
    }
    // Max replay passes for the active strategy. Strategy 3 = exactly one.
    function maxPasses() {
      return state.strategy === 3 ? 1 : Math.max(0, state.repeatCount);
    }

    function injectCss() {
      if (document.getElementById('cup-sub-css')) return;
      const s = document.createElement('style');
      s.id = 'cup-sub-css';
      // Build per-site CSS. The host module also marks the player wrapper
      // at runtime with .cup-shrink-target so we shrink the *container*
      // (which holds overlay controls) rather than just the <video>
      // element. Otherwise the player's bottom control bar lands behind
      // our sidebar.
      const shrinkRule = ['.cup-shrink-target'].concat(state.shrinkSelectors)
        .map(sel => 'body.' + state.bodyClass + ' ' + sel)
        .join(', ');
      s.textContent = `
        body.${state.bodyClass} { --cup-vid-h: 50vh; }
        ${shrinkRule} {
          height: var(--cup-vid-h) !important;
          max-height: var(--cup-vid-h) !important;
          bottom: auto !important;
        }
        body.${state.bodyClass} video { max-height: 100% !important; }
        body.${state.bodyClass} .cup-sub-sidebar { display: flex !important; }

        .cup-sub-sidebar {
          display: none;
          position: fixed; left: 0; right: 0; bottom: 0;
          width: 100vw;
          height: calc(100vh - var(--cup-vid-h, 50vh));
          z-index: 2147483646;
          background: #111; color: #eee;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 15px;
          flex-direction: column;
          border-top: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 -2px 10px rgba(0,0,0,0.6);
        }
        .cup-sub-head {
          padding: 6px 8px; display: flex; gap: 4px; align-items: center;
          background: #1a1a1a; border-bottom: 1px solid rgba(255,255,255,0.1);
          user-select: none; flex: 0 0 auto;
        }
        .cup-sub-head button {
          background: none; border: 1px solid rgba(255,255,255,0.18);
          color: #eee; cursor: pointer; padding: 3px 7px;
          font-size: 14px; line-height: 1; border-radius: 3px;
        }
        .cup-sub-head button:hover { background: rgba(255,255,255,0.12); }
        .cup-sub-head button.cup-on { background: rgba(120,200,120,0.25); border-color: rgba(120,200,120,0.5); }
        .cup-sub-status {
          font-size: 11px; color: #ffd479; padding: 0 6px;
          font-variant-numeric: tabular-nums;
        }
        .cup-sub-list { padding: 8px 10px; overflow-y: auto; flex: 1; line-height: 1.45; }
        .cup-sub-cue {
          display: flex; gap: 8px; align-items: flex-start;
          padding: 4px 6px; margin: 2px 0;
          border-radius: 4px; cursor: pointer;
          opacity: 0.55; transition: background 0.1s ease;
        }
        .cup-sub-cue:hover { background: rgba(255,255,255,0.06); opacity: 0.85; }
        .cup-sub-cue.cup-active { opacity: 1; background: rgba(255,255,255,0.12); }
        .cup-sub-time {
          flex: 0 0 auto; min-width: 56px;
          color: #7aa6e8; font-size: 12px; font-variant-numeric: tabular-nums;
          padding-top: 2px; user-select: none;
        }
        .cup-sub-text { flex: 1; word-break: break-word; }
        /* Selection checkboxes are always rendered but only shown while
           picking, so entering select mode costs no re-render. */
        .cup-sub-pick { display: none; flex: 0 0 auto; margin: 3px 0 0 0; cursor: pointer; }
        .cup-picking .cup-sub-pick { display: inline-block; width: 17px; height: 17px; }
        /* The whole row is the selection target while selecting, so it should
           look like one. */
        .cup-picking .cup-sub-cue { cursor: pointer; }
        .cup-sub-cue.cup-picked { background: rgba(120,200,120,0.18); opacity: 1; }
        .cup-sub-tr {
          margin-top: 2px; font-size: 13px; color: #b8d4ff;
          font-style: italic; opacity: 0.85;
        }
        .cup-sub-tr.cup-tr-pending { color: #888; }
        .cup-sub-modal {
          position: fixed; inset: 0; z-index: 2147483647;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.7);
        }
        .cup-sub-modal-box {
          background: #222; color: #eee; padding: 16px 18px;
          border-radius: 6px; min-width: 280px; max-width: 90vw;
          box-shadow: 0 6px 30px rgba(0,0,0,0.7);
        }
        .cup-sub-modal-box h3 { margin: 0 0 10px; font-size: 15px; }
        .cup-sub-modal-box label { display: block; margin: 8px 0; font-size: 13px; }
        .cup-sub-modal-box select, .cup-sub-modal-box input[type=number] {
          width: 100%; padding: 4px 6px; background: #1a1a1a; color: #eee;
          border: 1px solid rgba(255,255,255,0.2); border-radius: 3px;
          font-size: 13px;
        }
        .cup-sub-modal-actions {
          display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;
        }
        .cup-sub-modal-actions button { padding: 5px 12px; font-size: 13px; }
        .cup-w { cursor: pointer; padding: 0 1px; }
        .cup-w:hover, .cup-w:active {
          background: rgba(255,220,80,0.45); border-radius: 2px; color: #fff;
        }
        .cup-sub-drag {
          position: absolute; top: -6px; left: 0; right: 0;
          height: 12px; cursor: ns-resize;
          z-index: 2; touch-action: none;
          display: flex; justify-content: center; align-items: center;
        }
        .cup-sub-drag::before {
          content: ''; width: 60px; height: 4px;
          background: rgba(255,255,255,0.35); border-radius: 2px;
          transition: background 0.15s ease;
        }
        .cup-sub-drag:hover::before,
        .cup-sub-drag.cup-dragging::before { background: rgba(120,200,255,0.7); }
        body.cup-sub-dragging { cursor: ns-resize !important; user-select: none !important; }
      `;
      (document.head || document.documentElement).appendChild(s);
    }

    function buildSidebar() {
      if (state.sidebar && document.body.contains(state.sidebar)) return;
      injectCss();
      const sb = document.createElement('div');
      sb.className = 'cup-sub-sidebar';
      sb.innerHTML = `
        <div class="cup-sub-drag" title="Drag to resize"></div>
        <div class="cup-sub-head">
          <button data-act="split" class="cup-on" title="Toggle split view">⇋</button>
          <button data-act="scroll" class="cup-on" title="Auto-scroll">⇩</button>
          <button data-act="translate" title="Toggle translation">🌐</button>
          <button data-act="settings" title="Strategy &amp; settings">⚙</button>
          <button data-act="prev" title="Previous cue">⟨</button>
          <button data-act="next" title="Next cue">⟩</button>
          <button data-act="copy" title="Copy transcript">⧉</button>
          <button data-act="clear" title="Clear transcript">🗑</button>
          <button data-act="pick" title="Select lines">☑</button>
          <button data-act="all" title="Select all / none" style="display:none">⊞</button>
          <button data-act="send" title="Send selected to Cupitor" style="display:none">⤴</button>
          <span class="cup-sub-status" data-r="status"></span>
        </div>
        <div class="cup-sub-list"></div>
      `;
      (document.body || document.documentElement).appendChild(sb);
      state.sidebar = sb;
      state.listEl = sb.querySelector('.cup-sub-list');

      sb.querySelector('[data-act="split"]').onclick = (e) => {
        setSplit(!state.splitActive);
        e.currentTarget.classList.toggle('cup-on', state.splitActive);
      };
      sb.querySelector('[data-act="scroll"]').onclick = (e) => {
        state.autoScroll = !state.autoScroll;
        e.currentTarget.classList.toggle('cup-on', state.autoScroll);
      };
      sb.querySelector('[data-act="translate"]').onclick = (e) => {
        state.translationEnabled = !state.translationEnabled;
        e.currentTarget.classList.toggle('cup-on', state.translationEnabled);
        persistPrefs();
        if (state.translationEnabled) {
          // Backfill: request translation for every cue that doesn't yet have one.
          for (let i = 0; i < state.cues.length; i++) {
            if (!state.cues[i].translation) requestTranslation(i);
          }
        }
      };
      syncPickUi();
      sb.querySelector('[data-act="settings"]').onclick = () => openSettingsDialog();
      sb.querySelector('[data-act="prev"]').onclick = () => seekRelative(-1);
      sb.querySelector('[data-act="next"]').onclick = () => seekRelative(+1);
      sb.querySelector('[data-act="copy"]').onclick = () => {
        const txt = state.cues.map(c => {
          const line = fmtTime(c.start) + '\t' + c.text;
          return c.translation ? line + '\n\t' + c.translation : line;
        }).join('\n');
        try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch (_) {}
      };
      sb.querySelector('[data-act="pick"]').onclick = (e) => {
        setPicking(!state.picking);
        e.currentTarget.classList.toggle('cup-on', state.picking);
      };
      sb.querySelector('[data-act="all"]').onclick = () => {
        // Every harvested cue, not just the ones that have played. On sites
        // whose whole track is fetched up front this is the full transcript.
        const all = state.cues.map(c => c.id);
        const full = all.length && all.every(id => state.selected.has(id));
        state.selected = full ? new Set() : new Set(all);
        syncPickUi();
      };
      sb.querySelector('[data-act="send"]').onclick = () => sendSelected();
      sb.querySelector('[data-act="clear"]').onclick = () => {
        state.cues = []; state.activeIdx = -1;
        state.selected = new Set();
        if (state.listEl) state.listEl.innerHTML = '';
        syncPickUi();
      };

      if (state.cues.length && state.listEl) {
        for (let i = 0; i < state.cues.length; i++) renderCue(state.cues[i], i);
      }
      installDragHandle(sb.querySelector('.cup-sub-drag'));
      // Reflect persisted prefs in the button states.
      sb.querySelector('[data-act="translate"]').classList.toggle('cup-on', state.translationEnabled);
    }

    function setSplit(on) {
      state.splitActive = on;
      document.body.classList.toggle(state.bodyClass, on);
      if (on) restoreSplitPosition();
      try { window.dispatchEvent(new Event('resize')); } catch (_) {}
    }

    const SPLIT_KEY = 'cupSubVidH';
    const MIN_VID_VH = 20, MAX_VID_VH = 85;
    function applySplitVh(vh) {
      vh = Math.max(MIN_VID_VH, Math.min(MAX_VID_VH, vh));
      document.body.style.setProperty('--cup-vid-h', vh + 'vh');
      try { window.dispatchEvent(new Event('resize')); } catch (_) {}
      return vh;
    }
    function restoreSplitPosition() {
      try {
        const saved = parseFloat(localStorage.getItem(SPLIT_KEY));
        if (isFinite(saved) && saved > 0) applySplitVh(saved);
      } catch (_) {}
    }
    function installDragHandle(handleEl) {
      if (!handleEl) return;
      let dragging = false;
      function onMove(clientY) {
        if (!dragging) return;
        applySplitVh((clientY / window.innerHeight) * 100);
      }
      function onDown(e) {
        dragging = true;
        handleEl.classList.add('cup-dragging');
        document.body.classList.add('cup-sub-dragging');
        e.preventDefault();
      }
      function onUp() {
        if (!dragging) return;
        dragging = false;
        handleEl.classList.remove('cup-dragging');
        document.body.classList.remove('cup-sub-dragging');
        try {
          const v = parseFloat(getComputedStyle(document.body).getPropertyValue('--cup-vid-h'));
          if (isFinite(v) && v > 0) localStorage.setItem(SPLIT_KEY, String(v));
        } catch (_) {}
      }
      handleEl.addEventListener('mousedown', onDown);
      handleEl.addEventListener('touchstart', onDown, { passive: false });
      document.addEventListener('mousemove', (e) => onMove(e.clientY));
      document.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        const t = e.touches[0];
        if (t) onMove(t.clientY);
      }, { passive: false });
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchend', onUp);
      document.addEventListener('touchcancel', onUp);
    }

    const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    const escHtml = s => String(s).replace(/[&<>"']/g, c => HTML_ESC[c]);

    function fmtTime(sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      const pad = n => (n < 10 ? '0' + n : '' + n);
      return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
    }

    function tokenize(text) {
      return text.split(/(\s+)/).map(tok => {
        if (/^\s+$/.test(tok)) return tok;
        const m = tok.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}][\p{L}\p{N}'’\-]*)(.*)$/u);
        if (!m) return escHtml(tok);
        return escHtml(m[1])
          + '<span class="cup-w" data-w="' + escHtml(m[2]) + '">' + escHtml(m[2]) + '</span>'
          + escHtml(m[3]);
      }).join('');
    }

    function attachWordClicks(scope) {
      scope.querySelectorAll('.cup-w').forEach(el => {
        if (el.__cupBound) return;
        el.__cupBound = true;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          // Words swallow the click, so without this a tap on any word would
          // look the word up instead of selecting — leaving the checkbox as
          // the only target that worked.
          if (state.picking) { togglePickRow(el.closest('.cup-sub-cue')); return; }
          const w = el.getAttribute('data-w') || el.textContent || '';
          try { window.CaptionHandler && window.CaptionHandler.postMessage(w); } catch (_) {}
        });
      });
    }

    function normalizeText(s) {
      return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    // Is this cue a duplicate of an existing one within a small time window?
    // Scans backward through the sorted cue list. Matches:
    //   - exact normalized-text match within ±3s
    //   - containment within ±3s, but ONLY when the new text starts with
    //     the existing one (a prefix being extended in place — SVT's
    //     "first line, then full two-line" pattern). The old "either
    //     contains the other anywhere" check collapsed unrelated sentences
    //     that happened to share a substring, undercounting the chunk and
    //     making linesPerChunk drift.
    function findDup(cue) {
      const norm = normalizeText(cue.text);
      if (!norm) return true;
      const WINDOW = 3;
      for (let i = state.cues.length - 1; i >= 0; i--) {
        const c = state.cues[i];
        if (c.start < cue.start - 30) break;
        if (Math.abs(c.start - cue.start) > WINDOW) continue;
        const ct = normalizeText(c.text);
        if (ct === norm) return true;
        // Same speaker continuing — only treat as same cue if one string
        // is a strict PREFIX of the other and the shorter has at least
        // 8 chars (otherwise short common openers like "ja" / "och" would
        // eat unrelated lines).
        const shorter = ct.length < norm.length ? ct : norm;
        const longer  = ct.length < norm.length ? norm : ct;
        if (shorter.length >= 8 && longer.startsWith(shorter)) {
          if (norm.length > ct.length) {
            state.cues[i] = Object.assign({}, c, { text: cue.text, translation: '', trPending: false });
            rerenderCue(i);
            if (state.translationEnabled) requestTranslation(i);
          }
          return true;
        }
      }
      return false;
    }

    // Storyboard / thumbnail tracks are WEBVTT too, and their cue payload is
    // an image URL — usually with a #xywh= spatial fragment picking one frame
    // out of a sprite sheet. They are timed, so they parse perfectly as cues,
    // but they are not speech and must never reach the panel.
    function isThumbnailCue(text) {
      const t = (text || '').trim();
      if (!t) return true;
      if (/#xywh=/i.test(t)) return true;
      // A cue that is nothing but an image reference. Anchored and
      // whitespace-free, so a spoken line that merely mentions a filename
      // ("open cat.jpg then") still gets through.
      if (/^\S+\.(jpe?g|png|webp|avif|gif)(\?|#|$)/i.test(t)) return true;
      return false;
    }

    function addCue(cue) {
      if (!normalizeText(cue.text)) return;
      if (isThumbnailCue(cue.text)) return;
      if (findDup(cue)) return;
      // Stable identity for selection — list positions shift as cues are
      // spliced in, but this doesn't.
      if (cue.id == null) cue.id = state.nextCueId++;
      let i = state.cues.length;
      while (i > 0 && state.cues[i - 1].start > cue.start) i--;
      state.cues.splice(i, 0, cue);
      // Keep pendingTr's indices in sync — inserting at position i bumps
      // every later index by one.
      const newPending = Object.create(null);
      for (const id in state.pendingTr) {
        const oldIdx = state.pendingTr[id];
        newPending[id] = oldIdx >= i ? oldIdx + 1 : oldIdx;
      }
      state.pendingTr = newPending;
      // activeIdx is recomputed every syncHighlight, so we don't bump it. But
      // chunkStartIdx is a stored anchor — shift it if we inserted before it
      // so it keeps pointing at the same cue.
      if (state.chunkStartIdx != null && i <= state.chunkStartIdx) state.chunkStartIdx++;
      if (state.listEl) renderCue(cue, i);
      if (state.translationEnabled) requestTranslation(i);
      // NOTE: chunk progression is intentionally NOT driven from here — see
      // onPlayheadCue(). Harvested cues stream ahead of the playhead; counting
      // them on arrival made chunks fire on unwatched cues.
    }

    // Selection is only offered inside Cupitor: without the channel there is
    // nowhere to send, so the button would be a dead control in a browser.
    function canSend() {
      try {
        return !!(window.CaptionCollector &&
                  typeof window.CaptionCollector.postMessage === 'function');
      } catch (_) { return false; }
    }

    function setPicking(on) {
      state.picking = !!on;
      // Leaving select mode drops the selection; re-entering starts clean
      // rather than resurrecting ticks the user can no longer see.
      if (!state.picking) state.selected = new Set();
      syncPickUi();
    }

    function syncPickUi() {
      const sb = state.sidebar;
      if (!sb) return;
      sb.classList.toggle('cup-picking', state.picking);
      // Outside Cupitor there is nowhere to send, so selecting is a dead end
      // — hide the entry point rather than offering a button that does nothing.
      const pickBtn = sb.querySelector('[data-act="pick"]');
      if (pickBtn) pickBtn.style.display = canSend() ? '' : 'none';
      const allBtn = sb.querySelector('[data-act="all"]');
      const sendBtn = sb.querySelector('[data-act="send"]');
      // Both are meaningless outside select mode, so they stay out of the
      // header entirely and normal use looks exactly as it did.
      if (allBtn) allBtn.style.display = state.picking ? '' : 'none';
      if (sendBtn) sendBtn.style.display = (state.picking && canSend()) ? '' : 'none';
      if (sendBtn) sendBtn.disabled = state.selected.size === 0;
      if (state.listEl) {
        const rows = state.listEl.children;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const id = Number(row.dataset.cueId);
          const on = state.selected.has(id);
          const box = row.querySelector('.cup-sub-pick');
          if (box) box.checked = on;
          row.classList.toggle('cup-picked', state.picking && on);
        }
      }
      const status = sb.querySelector('[data-r="status"]');
      if (status && state.picking) {
        status.textContent = state.selected.size + ' selected';
      }
    }

    // Flip one line's selection. syncPickUi repaints the checkbox and the
    // count, so callers don't touch either.
    function togglePickRow(row) {
      if (!row) return;
      const id = Number(row.dataset.cueId);
      if (!Number.isFinite(id)) return;
      if (state.selected.has(id)) state.selected.delete(id);
      else state.selected.add(id);
      syncPickUi();
    }

    function sendSelected() {
      if (!state.selected.size || !canSend()) return;
      const lines = state.cues
        .filter(c => state.selected.has(c.id))
        .map(c => {
          const line = { start: c.start, end: c.end, text: c.text };
          if (c.translation) line.translation = c.translation;
          return line;
        });
      if (!lines.length) return;
      const payload = {
        title: (document.title || '').trim(),
        url: location.href,
        lang: state.translationSource || '',
        lines,
      };
      try {
        window.CaptionCollector.postMessage(JSON.stringify(payload));
        console.log('[caps] sent', lines.length, 'lines');
        setPicking(false);
        const pickBtn = state.sidebar && state.sidebar.querySelector('[data-act="pick"]');
        if (pickBtn) pickBtn.classList.remove('cup-on');
      } catch (e) {
        console.warn('[caps] send failed', e);
      }
    }

    function renderCue(cue, idx) {
      if (!state.listEl) return;
      const row = document.createElement('div');
      row.className = 'cup-sub-cue';
      row.dataset.start = String(cue.start);
      row.dataset.end = String(cue.end);
      const trHtml = cue.translation
        ? '<div class="cup-sub-tr">' + escHtml(cue.translation) + '</div>'
        : (cue.trPending ? '<div class="cup-sub-tr cup-tr-pending">…</div>' : '');
      row.dataset.cueId = String(cue.id);
      row.innerHTML =
        '<input type="checkbox" class="cup-sub-pick">' +
        '<span class="cup-sub-time">' + fmtTime(cue.start) + '</span>' +
        '<div class="cup-sub-text">' + tokenize(cue.text) + trHtml + '</div>';
      const pick = row.querySelector('.cup-sub-pick');
      pick.checked = state.selected.has(cue.id);
      // Outside select mode a row tap seeks and a word tap looks the word up.
      // Inside it, every tap anywhere on the row toggles that line: the
      // checkbox alone is too small a target to be the only way in.
      pick.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pick.checked) state.selected.add(cue.id);
        else state.selected.delete(cue.id);
        syncPickUi();
      });
      row.addEventListener('click', (e) => {
        // The checkbox has already handled itself.
        if (e.target === pick) return;
        if (state.picking) { togglePickRow(row); return; }
        if (e.target.classList && e.target.classList.contains('cup-w')) return;
        if (state.currentVideo) {
          state.currentVideo.currentTime = cue.start;
          try { state.currentVideo.play(); } catch (_) {}
        }
        // Find this row's current index (insertion may have shifted things).
        const children = state.listEl.children;
        for (let i = 0; i < children.length; i++) if (children[i] === row) { focusCueRow(i); break; }
      });
      attachWordClicks(row);
      const children = state.listEl.children;
      if (idx >= children.length) state.listEl.appendChild(row);
      else state.listEl.insertBefore(row, children[idx]);
    }

    function rerenderCue(idx) {
      if (!state.listEl) return;
      const cue = state.cues[idx];
      const row = state.listEl.children[idx];
      if (!cue || !row) return;
      const wasActive = row.classList.contains('cup-active');
      // Cheaper than re-creating: rewrite the inner blocks.
      const textBlock = row.querySelector('.cup-sub-text');
      if (textBlock) {
        const trHtml = cue.translation
          ? '<div class="cup-sub-tr">' + escHtml(cue.translation) + '</div>'
          : (cue.trPending ? '<div class="cup-sub-tr cup-tr-pending">…</div>' : '');
        textBlock.innerHTML = tokenize(cue.text) + trHtml;
        attachWordClicks(textBlock);
      }
      if (wasActive) row.classList.add('cup-active');
    }

    function focusCueRow(idx) {
      if (!state.listEl) return;
      if (state.activeIdx >= 0) {
        const prev = state.listEl.children[state.activeIdx];
        if (prev) prev.classList.remove('cup-active');
      }
      state.activeIdx = idx;
      const el = state.listEl.children[idx];
      if (el) {
        el.classList.add('cup-active');
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
      }
    }

    function seekRelative(delta) {
      if (!state.currentVideo || !state.cues.length) return;
      const t = state.currentVideo.currentTime;
      let cueIdx = -1;
      if (delta > 0) {
        cueIdx = state.cues.findIndex(c => c.start > t + 0.3);
        if (cueIdx < 0) cueIdx = state.cues.length - 1;
      } else {
        for (let i = state.cues.length - 1; i >= 0; i--) {
          if (state.cues[i].start < t - 0.3) { cueIdx = i; break; }
        }
        if (cueIdx < 0) cueIdx = 0;
      }
      const cue = state.cues[cueIdx];
      if (cue) {
        state.currentVideo.currentTime = cue.start;
        try { state.currentVideo.play(); } catch (_) {}
        // Don't wait for timeupdate — scroll + highlight right now.
        focusCueRow(cueIdx);
      }
    }

    // -------- translation bridge --------
    function requestTranslation(idx) {
      const cue = state.cues[idx];
      if (!cue || cue.translation || cue.trPending) return;
      if (!window.TranslateRequest || typeof window.TranslateRequest.postMessage !== 'function') return;
      const id = state.nextTrId++;
      state.pendingTr[id] = idx;
      cue.trPending = true;
      rerenderCue(idx);
      try {
        window.TranslateRequest.postMessage(JSON.stringify({
          id,
          text: cue.text,
          source: state.translationSource,
          target: state.translationTarget,
        }));
      } catch (_) {
        delete state.pendingTr[id];
        cue.trPending = false;
      }
    }

    // Flutter calls this back. (Optional 3rd arg is an error message.)
    window.__cupTranslated = function(id, result, err) {
      const idx = state.pendingTr[id];
      delete state.pendingTr[id];
      if (idx == null) return;
      const cue = state.cues[idx];
      if (!cue) return;
      cue.trPending = false;
      if (err) { cue.translation = '(err)'; }
      else cue.translation = String(result || '');
      rerenderCue(idx);
      onTranslationDone(idx);
    };

    // -------- strategy hooks (PLAYBACK-driven) --------
    // Called from syncHighlight when the playhead ENTERS cue `idx` (the
    // active cue changed). This is the single trigger for chunk progression
    // — replacing the old cue-arrival trigger, which fired off buffered
    // cues the user hadn't watched yet and made the video skip forward.
    function onPlayheadCue(idx) {
      if (idx < 0) return;
      const cue = state.cues[idx];
      if (!cue || !state.currentVideo) return;

      if (state.strategy === 2) {
        if (!state.translationEnabled) return;
        // Pause if the cue under the playhead isn't translated yet.
        if (!cue.translation) { dlog('strategy2: untranslated cue', idx, '→ pause'); ourPause(); }
        return;
      }
      if (state.strategy !== 3 && state.strategy !== 4 && state.strategy !== 5) return;
      if (state.chunkReplaying) return;
      // Ignore cues inside a region we already replayed this session.
      if (cue.start < state.chunkFloor - 0.01) return;

      // (Re)anchor the chunk to this cue if we have no anchor, the anchor is
      // ahead of us (shouldn't happen), or the anchor predates the floor.
      if (state.chunkStartIdx == null ||
          idx < state.chunkStartIdx ||
          !state.cues[state.chunkStartIdx] ||
          state.cues[state.chunkStartIdx].start < state.chunkFloor - 0.01) {
        state.chunkStartIdx = idx;
      }
      const watched = idx - state.chunkStartIdx + 1;
      dlog('playhead@cue', idx, 'watched', watched, '/', state.linesPerChunk);
      if (watched >= state.linesPerChunk) {
        state.chunkStart = state.cues[state.chunkStartIdx].start;
        state.chunkEnd = cue.end || cue.start + 3;
        state.chunkReplaying = true;
        state.currentPass = 0;
        dlog('chunk full [', state.chunkStart.toFixed(2), ',', state.chunkEnd.toFixed(2), '] → replay');
        ourPause();
        // Translations for this chunk may already be in (fast translator), in
        // which case no onTranslationDone fires — try to start the replay now.
        checkChunkAndReplay();
      }
    }

    // Reset the in-flight chunk/replay state. Does NOT clear chunkFloor — the
    // caller decides whether the just-replayed region should be re-chunkable.
    function resetChunk() {
      dlog('resetChunk (was pass', state.currentPass, '/', maxPasses(), ')');
      state.chunkReplaying = false;
      state.chunkStartIdx = null;
      state.chunkStart = null;
      state.chunkEnd = null;
      state.currentPass = 0;
      // Invalidate any in-flight gap-timer callback.
      state.passToken++;
      if (state.gapTimer != null) {
        clearTimeout(state.gapTimer);
        state.gapTimer = null;
      }
    }

    function startReplayPass(passIdx) {
      const rate = speedForPass(passIdx);
      state.currentPass = passIdx;
      state.lastSeekAt = Date.now();
      dlog('startReplayPass', passIdx, '/', state.repeatCount, 'rate=', rate,
           'seek→', state.chunkStart);
      try {
        state.currentVideo.currentTime = state.chunkStart;
        state.currentVideo.playbackRate = rate;
      } catch (_) {}
      ourPlay();
    }

    // Schedule starting a replay pass after an optional gap. Strategy 5 uses
    // the configured replayGap; strategies 3/4 fire immediately. A passToken
    // captured at schedule time lets the timer abort if the user / a reset
    // moved on while we were waiting.
    function startReplayPassWithGap(passIdx) {
      const gapSec = (state.strategy === 5) ? Math.max(0, state.replayGap || 0) : 0;
      if (gapSec <= 0) { startReplayPass(passIdx); return; }
      ourPause();
      if (state.gapTimer != null) clearTimeout(state.gapTimer);
      const token = ++state.passToken;
      dlog('gap', gapSec, 's before pass', passIdx, '(token', token, ')');
      state.gapTimer = setTimeout(() => {
        state.gapTimer = null;
        if (token !== state.passToken) { dlog('gap fired but token stale; abort'); return; }
        if (!state.chunkReplaying || state.chunkStart == null) return;
        startReplayPass(passIdx);
      }, gapSec * 1000);
      updateStatus();
    }

    // Start replaying the current chunk once every cue inside it is
    // translated (when translation is on). Shared by strategies 3/4/5 —
    // strategy 3 is just maxPasses()===1 at 1x. Pass progression past the
    // first pass is driven by replayTick() as each pass reaches chunkEnd.
    function checkChunkAndReplay() {
      if (state.strategy !== 3 && state.strategy !== 4 && state.strategy !== 5) return;
      if (!state.chunkReplaying || !state.currentVideo || state.chunkStart == null) return;
      if (state.translationEnabled) {
        for (let i = 0; i < state.cues.length; i++) {
          const c = state.cues[i];
          if (c.start < state.chunkStart - 0.01) continue;      // before chunk
          if (c.start > state.chunkEnd + 0.01) break;            // past chunk
          if (c.trPending) { dlog('replay waiting on translations'); return; }
        }
      }
      startReplayPassWithGap(1);
    }

    // Replay-pass progression for strategies 3/4/5: invoked from syncHighlight
    // on every timeupdate. When the current pass crosses chunkEnd, either
    // advance to the next pass (more repeats configured) or wrap up: set
    // chunkFloor to chunkEnd (so we don't re-chunk this region) and resume
    // 1x forward play. Also detects user seeks outside the chunk and abandons
    // the replay so navigation works freely.
    function replayTick() {
      if (state.strategy !== 3 && state.strategy !== 4 && state.strategy !== 5) return;
      if (!state.chunkReplaying) return;
      if (state.currentPass < 1) return;
      if (state.chunkEnd == null || state.chunkStart == null || !state.currentVideo) return;
      // Don't double-fire while we're waiting out a strategy-5 gap.
      if (state.gapTimer != null) return;
      // Defensive: re-apply our expected rate every timeupdate. SVT's player
      // has its own speed selector that can reset video.playbackRate
      // mid-pass; without this our schedule silently stops being honored.
      const expectedRate = speedForPass(state.currentPass);
      if (Math.abs((state.currentVideo.playbackRate || 1) - expectedRate) > 0.01) {
        try { state.currentVideo.playbackRate = expectedRate; } catch (_) {}
      }
      // Skip the post-seek window — stale timeupdates can fire with the
      // pre-seek currentTime and falsely trip the chunkEnd check.
      if (Date.now() - state.lastSeekAt < 500) return;
      const t = state.currentVideo.currentTime;
      // User dragged the scrubber outside the chunk → exit replay cleanly and
      // allow re-chunking from wherever they landed.
      if (t < state.chunkStart - 5 || t > state.chunkEnd + 5) {
        dlog('playhead left chunk (t=', t.toFixed(2), ') → abandon replay');
        try { state.currentVideo.playbackRate = 1; } catch (_) {}
        state.chunkFloor = 0;
        resetChunk();
        return;
      }
      if (t < state.chunkEnd) return;
      const next = state.currentPass + 1;
      dlog('chunkEnd reached at t=', t.toFixed(2), '→ pass', next, '/', maxPasses());
      if (next > maxPasses()) {
        // All repeats done; resume normal forward play at 1x. Block this
        // region from re-triggering a chunk so we move on instead of looping.
        try { state.currentVideo.playbackRate = 1; } catch (_) {}
        state.chunkFloor = state.chunkEnd;
        resetChunk();
        return;
      }
      // Mark currentPass = next BEFORE scheduling. Otherwise a second
      // timeupdate from the same boundary (browsers can deliver two with
      // the same currentTime) would also see currentPass=old and bump
      // again, double-advancing through the schedule.
      state.currentPass = next;
      startReplayPassWithGap(next);
    }

    function onTranslationDone(idx) {
      if (state.strategy === 2) {
        // If nothing is still pending for any cue at-or-before currentTime, play.
        if (!state.currentVideo) return;
        const t = state.currentVideo.currentTime;
        let blocking = false;
        for (let i = 0; i < state.cues.length; i++) {
          const c = state.cues[i];
          if (c.start > t + 0.5) break;
          if (c.trPending) { blocking = true; break; }
        }
        if (!blocking) ourPlay();
      } else if (state.strategy === 3 || state.strategy === 4 || state.strategy === 5) {
        checkChunkAndReplay();
      }
    }

    // Update the small status indicator in the header (`Pass i/N · Zx`).
    // Shown only while in a replay phase; cleared when forward play resumes.
    function updateStatus() {
      if (!state.sidebar) return;
      // While selecting, the status span carries the selection count; the
      // replay indicator would otherwise clear it on the next tick.
      if (state.picking) return;
      const el = state.sidebar.querySelector('[data-r="status"]');
      if (!el) return;
      const inReplay = state.chunkReplaying && state.currentPass >= 1;
      if (!inReplay) {
        if (el.textContent) el.textContent = '';
        return;
      }
      const total = state.repeatCount;
      const rate = state.currentVideo
        ? (state.currentVideo.playbackRate || 1)
        : speedForPass(state.currentPass);
      const gap = (state.strategy === 5 && state.gapTimer != null) ? ' · gap' : '';
      const txt = 'Pass ' + state.currentPass + '/' + total + ' · ' +
                  rate.toFixed(2).replace(/\.?0+$/, '') + '×' + gap;
      if (el.textContent !== txt) el.textContent = txt;
    }

    // -------- settings modal --------
    function openSettingsDialog() {
      injectCss();
      const wrap = document.createElement('div');
      wrap.className = 'cup-sub-modal';
      wrap.innerHTML = `
        <div class="cup-sub-modal-box">
          <h3>Subtitles · settings</h3>
          <label>Translation
            <input type="checkbox" data-f="enabled" ${state.translationEnabled ? 'checked' : ''}>
          </label>
          <label>Source language
            <input type="text" data-f="source" value="${escHtml(state.translationSource)}" placeholder="sv">
          </label>
          <label>Target language
            <input type="text" data-f="target" value="${escHtml(state.translationTarget)}" placeholder="en">
          </label>
          <label>Strategy
            <select data-f="strategy">
              <option value="1" ${state.strategy===1?'selected':''}>1 · Keep playing, translate as cues arrive</option>
              <option value="2" ${state.strategy===2?'selected':''}>2 · Pause until current cue is translated</option>
              <option value="3" ${state.strategy===3?'selected':''}>3 · Play N lines, then replay with translations</option>
              <option value="4" ${state.strategy===4?'selected':''}>4 · Like 3, but configurable replay speed &amp; repeats</option>
              <option value="5" ${state.strategy===5?'selected':''}>5 · Like 4, plus configurable gap between passes</option>
            </select>
          </label>
          <label data-show-for="3 4 5">Lines per chunk
            <input type="number" data-f="lines" min="1" max="50" value="${state.linesPerChunk}">
          </label>
          <label data-show-for="4 5">Repeats
            <input type="number" data-f="repeatCount" min="0" max="10" value="${state.repeatCount}">
          </label>
          <label data-show-for="4 5" title="Hyphen-separated speeds, one per pass. First value is the original (pass 0); subsequent values are repeats. Last value extends. Examples: '1' (no slowdown), '1-0.7' (default — repeat at 0.7x), '1-0.5-1' (0.5x first repeat, 1x after), '1-0.5-0.7' (0.5x then 0.7x)">Speed schedule
            <input type="text" data-f="schedule" value="${escHtml(state.replaySchedule)}" placeholder="1-0.7">
          </label>
          <label data-show-for="5" title="Pause this many seconds between consecutive passes (replays). 0 = no gap.">Gap seconds
            <input type="number" data-f="gap" min="0" max="30" step="0.5" value="${state.replayGap}">
          </label>
          <label title="Log strategy transitions to the console — useful when reporting bugs.">Debug logging
            <input type="checkbox" data-f="debug" ${state.debug ? 'checked' : ''}>
          </label>
          <div class="cup-sub-modal-actions">
            <button data-act="cancel">Cancel</button>
            <button data-act="save">Save</button>
          </div>
        </div>
      `;
      document.body.appendChild(wrap);
      wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
      // Per-strategy field visibility — update on initial render and whenever
      // the strategy <select> changes so unused inputs disappear cleanly.
      const stratSel = wrap.querySelector('[data-f="strategy"]');
      function applyVisibility() {
        const cur = String(stratSel.value);
        wrap.querySelectorAll('[data-show-for]').forEach(el => {
          const allowed = el.getAttribute('data-show-for').split(/\s+/);
          el.style.display = allowed.includes(cur) ? '' : 'none';
        });
      }
      stratSel.addEventListener('change', applyVisibility);
      applyVisibility();
      wrap.querySelector('[data-act="cancel"]').onclick = () => wrap.remove();
      wrap.querySelector('[data-act="save"]').onclick = () => {
        const get = sel => wrap.querySelector('[data-f="' + sel + '"]');
        state.translationEnabled = get('enabled').checked;
        state.translationSource  = (get('source').value || 'sv').trim();
        state.translationTarget  = (get('target').value || 'en').trim();
        state.strategy           = parseInt(get('strategy').value, 10) || 1;
        state.linesPerChunk      = Math.max(1, Math.min(50, parseInt(get('lines').value, 10) || 5));
        state.repeatCount        = Math.max(0, Math.min(10, parseInt(get('repeatCount').value, 10) || 1));
        state.replaySchedule     = (get('schedule').value || '1-0.7').trim();
        state.replayGap          = Math.max(0, Math.min(30, parseFloat(get('gap').value) || 0));
        state.debug              = !!get('debug').checked;
        try { window.cupSubDebug = state.debug; } catch (_) {}
        // Changing strategy/chunk settings starts fresh: drop any in-flight
        // chunk and let a new one anchor from the current playhead.
        if (state.currentVideo) { try { state.currentVideo.playbackRate = 1; } catch (_) {} }
        state.chunkFloor = 0;
        resetChunk();
        persistPrefs();
        wrap.remove();
        // Reflect on the translate button
        const btn = state.sidebar && state.sidebar.querySelector('[data-act="translate"]');
        if (btn) btn.classList.toggle('cup-on', state.translationEnabled);
        if (state.translationEnabled) {
          for (let i = 0; i < state.cues.length; i++) {
            if (!state.cues[i].translation) requestTranslation(i);
          }
        }
      };
    }

    function syncHighlight() {
      if (!state.currentVideo) return;
      // Pass-progression for an in-flight replay runs first so a chunk-end
      // transition takes effect immediately.
      replayTick();
      updateStatus();
      // Find the cue under the playhead (binary search on sorted cues). This
      // drives BOTH chunk progression (onPlayheadCue) and the row highlight,
      // so it runs even when there's no list element.
      const t = state.currentVideo.currentTime;
      let lo = 0, hi = state.cues.length - 1, idx = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const c = state.cues[mid];
        if (t < c.start) hi = mid - 1;
        else if (t > c.end) lo = mid + 1;
        else { idx = mid; break; }
      }
      if (idx === state.activeIdx) return;
      // Active cue changed → advance chunk progression for the new cue.
      onPlayheadCue(idx);
      if (!state.listEl) { state.activeIdx = idx; return; }
      if (state.activeIdx >= 0) {
        const prev = state.listEl.children[state.activeIdx];
        if (prev) prev.classList.remove('cup-active');
      }
      state.activeIdx = idx;
      if (idx >= 0) {
        const el = state.listEl.children[idx];
        if (el) {
          el.classList.add('cup-active');
          if (state.autoScroll) {
            try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
          }
        }
      }
    }

    function setVideoElement(v) {
      if (!v || v === state.currentVideo) return;
      // SVT swaps the <video> across ad breaks / source switches. Strip
      // listeners from the previous element so they don't fire on a
      // detached node and double-advance the strategy state.
      if (state.currentVideo && state.videoListeners) {
        const old = state.currentVideo, l = state.videoListeners;
        try { old.removeEventListener('timeupdate', l.timeupdate); } catch (_) {}
        try { old.removeEventListener('pause', l.pause); } catch (_) {}
        try { old.removeEventListener('play', l.play); } catch (_) {}
      }
      // Swap aborts any in-flight chunk — its indices/floor belong to the old
      // element's timeline and would mis-fire against the new one.
      if (state.chunkReplaying || state.chunkStartIdx != null) {
        dlog('video element swapped; resetting chunk state');
        resetChunk();
      }
      state.chunkFloor = 0;
      state.expectedPauses = 0;
      state.expectedPlays = 0;
      state.userOverrode = false;
      state.currentVideo = v;
      const listeners = {
        timeupdate: syncHighlight,
        pause: () => {
          if (state.expectedPauses > 0) {
            state.expectedPauses--;
            dlog('pause: ours (remaining expected =', state.expectedPauses, ')');
            return;
          }
          state.userOverrode = true;
          dlog('pause: user → userOverrode=true');
        },
        play: () => {
          if (state.expectedPlays > 0) {
            state.expectedPlays--;
            dlog('play: ours (remaining expected =', state.expectedPlays, ')');
            return;
          }
          // User resume — clear the override AND drop any pending replay
          // state so we don't fight them.
          if (state.chunkReplaying) {
            dlog('play: user during replay → abandoning replay');
            try { state.currentVideo.playbackRate = 1; } catch (_) {}
            resetChunk();
          }
          state.userOverrode = false;
        },
      };
      state.videoListeners = listeners;
      v.addEventListener('timeupdate', listeners.timeupdate);
      v.addEventListener('pause', listeners.pause);
      v.addEventListener('play', listeners.play);
    }

    // Wrappers that mark our own pause/play with a counter so the
    // listeners above can tell user actions from automation without a
    // racy time window.
    function ourPause() {
      if (!state.currentVideo) return;
      if (state.currentVideo.paused) {
        // No pause event will fire — don't bump the counter or a future
        // user pause will be mis-attributed to us.
        return;
      }
      state.expectedPauses++;
      try { state.currentVideo.pause(); } catch (e) { state.expectedPauses--; }
    }
    function ourPlay() {
      if (!state.currentVideo) return;
      if (state.userOverrode) { dlog('ourPlay suppressed (userOverrode)'); return; }
      if (!state.currentVideo.paused) return; // already playing, no event would fire
      state.expectedPlays++;
      const p = state.currentVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => { state.expectedPlays = Math.max(0, state.expectedPlays - 1); });
    }

    return {
      addCue, buildSidebar, setSplit, setVideoElement,
      get currentVideo() { return state.currentVideo; },
    };
  }
  shared.createSubtitleUI = createSubtitleUI;
})();
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
// Page error capture.
//
// A page that renders nothing usually threw on the way there, and the console
// shim only forwards the snippet's own output — so the page's own failures are
// invisible from the app, which turns "it is blank" into guesswork.

  // ---- Page error capture -------------------------------------------------
  //
  // A page that renders nothing usually threw on the way. The console shim
  // only forwards snippet.js's own output, so the page's failures are
  // invisible from the app — which turns "it is blank" into guesswork.
  // Kept to a handful so an ad-heavy page cannot flood the log.
  (function pageErrors() {
    if (window.__cupPageErrors) return;
    const seen = [];
    window.__cupPageErrors = seen;
    const MAX = 10;
    function note(kind, message, where) {
      if (seen.length >= MAX) return;
      const line = kind + ': ' + String(message || '').slice(0, 300) +
        (where ? ' @ ' + String(where).slice(0, 160) : '');
      seen.push(line);
      console.warn('[pageerr]', line);
    }
    window.addEventListener('error', (ev) => {
      try {
        note('error', ev.message || (ev.error && ev.error.message),
          (ev.filename || '') + ':' + (ev.lineno || ''));
      } catch (_) {}
    }, true);
    window.addEventListener('unhandledrejection', (ev) => {
      try {
        const r = ev.reason;
        note('unhandled', (r && (r.message || r)) || 'rejection', '');
      } catch (_) {}
    });
  })();
// Frame reach: run a feature in the top document and in every frame that can
// be reached from it.
//
// A same-origin frame is reachable through contentDocument. A cross-origin one
// is not, by design, and no JavaScript changes that — that case is what
// frame-boot.js exists for, injected natively at document start.
//
// Publishes window.cupInFrames(name, fn) and window.cupFrameReport().

  // ---- Frame reach -------------------------------------------------------
  //
  // snippet.js is injected with runJavaScript, which evaluates in the TOP
  // frame only. Anything living in an iframe — an e-book reader, an embedded
  // player — is therefore invisible to every feature in this file. Studora
  // renders its reader into <iframe id="readeriframe-...">, so nothing here
  // reaches the book text.
  //
  // A same-origin frame can be reached from the top document through
  // contentDocument. A cross-origin one cannot, by design, and no amount of
  // JavaScript changes that — that case needs WebView-level injection.
  //
  // Features register with cupInFrames(name, fn). fn(doc, win) runs once per
  // document: the top one, every reachable frame, frames that appear later,
  // and nested frames. Frames that cannot be reached are reported once each,
  // so the logs say plainly whether a site is workable.
  (function frameReach() {
    if (window.__cupFramesInstalled) return;
    window.__cupFramesInstalled = true;

    const MAX_DEPTH = 4;          // a reader inside a player is plausible; deeper is not
    const features = [];          // { name, fn, seen: WeakSet<Document> }
    const reportedBlocked = new Set();

    function label(frame) {
      try {
        return frame.getAttribute('src') || frame.id || frame.name || '(inline)';
      } catch (_) { return '(unreadable)'; }
    }

    // The try/catch IS the same-origin test: reading contentDocument across
    // origins throws.
    function reach(frame) {
      try { return frame.contentDocument || null; } catch (_) { return null; }
    }

    // Each feature tracks its own documents, so registering a second feature
    // does not re-run the first one where it has already installed.
    function install(doc, win, where, stats) {
      if (!doc || !doc.body) return;
      for (const f of features) {
        if (f.seen.has(doc)) continue;
        f.seen.add(doc);
        stats.installs++;
        try {
          f.fn(doc, win);
        } catch (e) {
          console.warn('[frames]', f.name, 'threw in', where, e);
        }
      }
    }

    function visit(doc, depth, stats) {
      if (depth > MAX_DEPTH) return;
      let frames;
      try { frames = doc.querySelectorAll('iframe, frame'); } catch (_) { return; }
      frames.forEach((frame) => {
        const name = label(frame);
        const inner = reach(frame);
        if (!inner) {
          stats.blocked++;
          if (!reportedBlocked.has(name)) {
            reportedBlocked.add(name);
            console.log('[frames] cross-origin, cannot reach:', name);
          }
          return;
        }
        // The element can exist before its document does. Install on load
        // rather than dropping the frame.
        if (!inner.body || inner.readyState === 'loading') {
          if (!frame.__cupFrameWait) {
            frame.__cupFrameWait = true;
            frame.addEventListener('load', sweep, { once: true });
          }
          stats.pending++;
          return;
        }
        install(inner, frame.contentWindow, name, stats);
        visit(inner, depth + 1, stats);
      });
    }

    function sweep() {
      const stats = { installs: 0, blocked: 0, pending: 0 };
      install(document, window, 'top', stats);
      visit(document, 0, stats);
      return stats;
    }

    window.cupInFrames = function (name, fn) {
      if (typeof fn !== 'function') return;
      features.push({ name: name, fn: fn, seen: new WeakSet() });
      const stats = sweep();
      console.log('[frames]', name, '→', stats.installs, 'document(s),',
        stats.blocked, 'blocked,', stats.pending, 'pending');
    };

    // Frames appear long after load on SPA sites.
    // Debounced: sweep() runs querySelectorAll across the top document and
    // every reachable frame, and this observer sees every mutation batch on
    // the page — including the ones our own panel makes when it re-renders.
    let sweepTimer = null;
    function sweepSoon() {
      if (sweepTimer) return;
      sweepTimer = setTimeout(() => { sweepTimer = null; sweep(); }, 250);
    }
    try {
      new MutationObserver(sweepSoon).observe(document.documentElement, {
        childList: true, subtree: true,
      });
    } catch (_) {}
    // A frame can also swap its document without its element being touched,
    // which no observer on this document reports. Cheap because it returns
    // immediately on the overwhelming majority of pages, which have no frames.
    setInterval(() => {
      if (!document.querySelector('iframe, frame')) return;
      sweep();
    }, 2000);

    // Diagnostic, for reading in the snippet logs while sizing up a site.
    window.cupFrameReport = function () {
      const rows = [];
      (function walk(doc, depth) {
        if (depth > MAX_DEPTH) return;
        let frames;
        try { frames = doc.querySelectorAll('iframe, frame'); } catch (_) { return; }
        frames.forEach((frame) => {
          const inner = reach(frame);
          rows.push({
            frame: label(frame),
            depth: depth,
            reachable: !!inner,
            ready: inner ? inner.readyState : null,
            chars: inner && inner.body ? (inner.body.innerText || '').length : 0,
          });
          if (inner) walk(inner, depth + 1);
        });
      })(document, 0);
      // Piggybacked here on purpose: the app's "Page & frame report" embeds
      // whatever this returns, so the page-capture counters reach the screen
      // without an app rebuild to add a field.
      try {
        rows.push({ pagecap: (window.__cupPcDiag && window.__cupPcDiag()) || 'not installed' });
      } catch (_) {}
      console.log('[frames] report ' + JSON.stringify(rows));
      return rows;
    };

    const first = sweep();
    console.log('[frames] reach installed —', first.blocked, 'blocked,',
      first.pending, 'pending,', document.querySelectorAll('iframe, frame').length,
      'frame(s) in top document');
  })();
// Page sentence capture: collect sentences from any page — including inside a
// cross-origin e-book reader — and send them to the language webapp as manual
// playlist items.
//
// Rides the caption-capture pipeline: CaptionCollector -> the host -> a
// cupitorCaptionCapture event carrying source:'page'. One validated host path
// and one webapp listener serve both sources.
//
// Publishes window.__cupitorSetCaptureMode(bool) for the app's capture chip,
// window.__cupSelection() for the host's lookup button, and window.__cupPcDiag().

  // ---- Page sentence capture ---------------------------------------------
  //
  // Select text anywhere on the page — including inside a same-origin reader
  // iframe — collect it, and send the collection to the language webapp as
  // manual playlist items.
  //
  // It rides the caption-capture pipeline: CaptionCollector → the host →
  // a cupitorCaptionCapture event carrying source:'page'. So there is one
  // validated host path and one webapp listener for both sources.
  //
  // Deliberately built on the WebView's own text selection rather than on
  // tapping words. Selection needs no DOM mutation, which is what makes it
  // safe on a React-rendered page that rebuilds its nodes underneath us.
  (function pageCapture() {
    // The UI lives in the top frame: a panel rendered inside the reader
    // iframe would be clipped by it. Frames only contribute selections.
    if (window.top !== window) return;
    if (window.__cupPageCaptureInstalled) return;

    // Outside Cupitor there is nowhere to send, so the whole feature stays
    // invisible rather than offering dead controls.
    function canSend() {
      try {
        return !!(window.CaptionCollector &&
                  typeof window.CaptionCollector.postMessage === 'function');
      } catch (_) { return false; }
    }
    if (!canSend()) return;
    if (typeof window.cupInFrames !== 'function') return;
    window.__cupPageCaptureInstalled = true;

    const MIN_CHARS = 2;
    // tapMode is armed from the app's existing capture chip, via
    // __cupitorSetCaptureMode below — no extra floating button in the page.
    const state = { pending: '', pendingFrom: null, items: [], open: false,
                    tapMode: false, hint: '' };
    // Bumped on every arm change, so a poller that already consumed a
    // selection re-considers it once the mode changes underneath it.
    let armGen = 0;
    let hintTimer = null;
    let root = null;

    // Diagnostics, because there is no console to read inside a cross-origin
    // reader on a phone and "it doesn't work" has at least four distinct
    // causes: the frame agent never ran, arm never arrived, events never
    // reached it, or resolution failed. These counters surface in the app's
    // "Page & frame report".
    //
    // `msgs` is the decisive one: zero means no frame agent ever reached us,
    // so nothing downstream of it is worth reading.
    const topDiag = { msgs: 0, hellos: 0, adds: 0, sels: 0, misses: 0,
                      diags: 0, rejected: 0, ownAdds: 0, ownPolls: 0,
                      ownSel: 0 };
    const frameDiag = {};
    window.__cupPcDiag = () => ({
      armed: state.tapMode,
      items: state.items.length,
      pending: state.pending.slice(0, 60),
      open: state.open,
      top: topDiag,
      frames: frameDiag,
    });

    function ensureUi() {
      if (root) return;
      const st = document.createElement('style');
      st.textContent = `
        .cup-pc { position: fixed; right: 12px; bottom: 12px; z-index: 2147483000;
                  font: 13px/1.35 system-ui, -apple-system, sans-serif;
                  display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
                  /* A page that blanket-disables pointer events must not take
                     our controls with it. */
                  pointer-events: auto; }
        .cup-pc * { pointer-events: auto; }
        .cup-pc button { font: inherit; border: 0; border-radius: 16px; padding: 8px 13px;
                  background: #1f6feb; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.35);
                  cursor: pointer; }
        .cup-pc button[data-act="basket"] { background: #444c56; }
        .cup-pc-panel { background: #0d1117; color: #e6edf3; border: 1px solid #30363d;
                  border-radius: 10px; padding: 8px; width: min(78vw, 340px);
                  max-height: 46vh; overflow: auto; box-shadow: 0 4px 18px rgba(0,0,0,.45); }
        .cup-pc-row { display: flex; gap: 6px; align-items: flex-start; padding: 5px 2px;
                  border-bottom: 1px solid #21262d; }
        .cup-pc-row:last-child { border-bottom: 0; }
        .cup-pc-row span { flex: 1 1 auto; }
        .cup-pc-row button { background: transparent; color: #f85149; padding: 0 4px;
                  box-shadow: none; border-radius: 4px; }
        .cup-pc-foot { display: flex; gap: 6px; justify-content: flex-end; padding-top: 6px; }
        /* Pushed to the far left of the footer: it is a mode switch, not an
           action, and should not sit next to Clear and Send. */
        .cup-pc button[data-act="tap"] { background: #30363d; margin-right: auto; }
        .cup-pc button[data-act="tap"][data-on="1"] { background: #1f6feb; }
        .cup-pc-empty { opacity: .7; padding: 6px 2px; }
      `;
      (document.head || document.documentElement).appendChild(st);

      root = document.createElement('div');
      root.className = 'cup-pc';
      root.innerHTML =
        '<div class="cup-pc-panel" hidden>' +
          '<div data-r="list"></div>' +
          '<div class="cup-pc-foot">' +
            '<button data-act="tap"></button>' +
            '<button data-act="clear">Clear</button>' +
            '<button data-act="send">Send</button>' +
          '</div>' +
        '</div>' +
        '<button data-act="basket" hidden></button>' +
        '<button data-act="add" hidden>+ Add sentence</button>';
      // Into <body>, NOT documentElement. A node parented to <html> outside
      // <body> paints correctly but hit-tests unreliably in Blink, which shows
      // up as a control you can see and cannot tap.
      (document.body || document.documentElement).appendChild(root);

      // Capture phase and touchend as well as click: readers install their own
      // aggressive gesture handlers, and a control that silently does nothing
      // is worse than no control.
      const on = (act, fn) => {
        const el = root.querySelector('[data-act="' + act + '"]');
        if (!el) return;
        const run = (ev) => { ev.preventDefault(); ev.stopPropagation(); fn(); };
        el.addEventListener('click', run, true);
        el.addEventListener('touchend', run, true);
      };
      on('add', () => {
        if (collect(state.pending)) {
          state.open = true;
          clearSelections();
        } else {
          showHint('already collected');
        }
        setPending('', null, true);
      });
      // Tapping words has to be a mode: an unarmed tap must not be swallowed,
      // or ordinary reading breaks. But burying the switch in the app's menu
      // made the feature look dead — a selection raised the chip while a tap
      // did nothing and said nothing. It belongs where the user already is.
      on('tap', () => {
        window.__cupitorSetCaptureMode(!state.tapMode);
        state.open = true;
        sync();
      });
      on('basket', () => { state.open = !state.open; sync(); });
      on('clear', () => { state.items = []; state.open = false; sync(); });
      on('send', send);
    }

    // Drop the highlight everywhere it might live, so the chip doesn't linger
    // over a selection the user thinks they have already banked.
    function clearSelections() {
      const docs = [document];
      try {
        document.querySelectorAll('iframe, frame').forEach((f) => {
          try { if (f.contentDocument) docs.push(f.contentDocument); } catch (_) {}
        });
      } catch (_) {}
      docs.forEach((d) => {
        try {
          const w = d.defaultView;
          const sel = w && w.getSelection && w.getSelection();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        } catch (_) {}
      });
    }

    function sync() {
      ensureUi();
      // An SPA that replaces <body> takes our controls with it.
      if (root && !root.isConnected) {
        try { (document.body || document.documentElement).appendChild(root); } catch (_) {}
      }
      const add = root.querySelector('[data-act="add"]');
      const basket = root.querySelector('[data-act="basket"]');
      const panel = root.querySelector('.cup-pc-panel');
      add.hidden = !state.pending;
      // Visible whenever armed, even at zero, so the mode announces itself.
      // Without this an armed page looks identical to an unarmed one until a
      // tap happens to land — and on a reader that eats taps, never.
      // Also shown for a pending selection: without that, a page where only
      // the chip has appeared offers no way to open the panel, and therefore
      // no way to find the Tap words switch inside it.
      basket.hidden = !state.items.length && !state.tapMode && !state.pending;
      basket.textContent = state.hint
        ? state.hint
        : (state.items.length
            ? (state.tapMode ? '✎ ' : '▤ ') + state.items.length
            : (state.tapMode ? '✎ Tap sentences' : '▤ Basket'));
      const tap = root.querySelector('[data-act="tap"]');
      tap.textContent = (state.tapMode ? '◉' : '○') + ' Tap words';
      tap.dataset.on = state.tapMode ? '1' : '';
      tap.title = state.tapMode
        ? 'On — tapping a word collects its sentence. Tap again to give taps back to the page.'
        : 'Off — tapping a word does nothing. Turn on to collect by tapping.';
      panel.hidden = !state.open;
      root.querySelector('[data-act="send"]').disabled = state.items.length === 0;
      const list = root.querySelector('[data-r="list"]');
      if (!panel.hidden) {
        list.textContent = '';
        state.items.forEach((text, i) => {
          const row = document.createElement('div');
          row.className = 'cup-pc-row';
          const span = document.createElement('span');
          span.textContent = text;
          const del = document.createElement('button');
          del.textContent = '✕';
          del.title = 'Remove';
          del.onclick = () => { state.items.splice(i, 1); sync(); };
          row.appendChild(span);
          row.appendChild(del);
          list.appendChild(row);
        });
        if (!state.items.length) {
          list.innerHTML = '<div class="cup-pc-empty">' + (state.tapMode
            ? 'Tap a sentence to collect it. Selecting text works too, where the page allows it.'
            : 'Select text, then tap “+ Add sentence”. To collect by tapping a '
              + 'single word, turn on Tap words below.') + '</div>';
        }
      }
    }

    function caretRangeAt(doc, x, y) {
      try {
        if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
        if (doc.caretPositionFromPoint) {
          const p = doc.caretPositionFromPoint(x, y);
          if (!p) return null;
          const r = doc.createRange();
          r.setStart(p.offsetNode, p.offset);
          r.collapse(true);
          return r;
        }
      } catch (_) {}
      return null;
    }

    // The sentence under a tap, resolved without requiring a selection the
    // user may not be able to make. Blink exposes sentence granularity on
    // Selection.modify, which is exactly this job; the manual split is the
    // fallback for when that is missing or the markup defeats it.
    let lastWhy = '';

    function sentenceAt(doc, win, x, y) {
      // Taps land in line gaps and on padding, where caretRangeFromPoint
      // returns nothing, so probe a little above and below before giving up.
      let sawCaret = false;
      // resolveFrom rewrites the selection on every probe, so a tap that
      // resolves nothing would otherwise leave a stray one-word selection and
      // destroy whatever the user actually had selected.
      let saved = null;
      try {
        const s0 = win.getSelection();
        if (s0 && s0.rangeCount) saved = s0.getRangeAt(0).cloneRange();
      } catch (_) {}
      for (const dy of [0, -6, 6, -12, 12]) {
        const range = caretRangeAt(doc, x, y + dy);
        if (!range) continue;
        sawCaret = true;
        const t = resolveFrom(win, range);
        if (t) return t;
      }
      try {
        const s1 = win.getSelection();
        if (s1) {
          s1.removeAllRanges();
          if (saved) s1.addRange(saved);
        }
      } catch (_) {}
      // 'no caret' means the point is not over addressable text at all — a
      // canvas, an overlay, a shadow root. 'no text' means it is, but nothing
      // resolved. That distinction decides what to try next.
      lastWhy = sawCaret ? 'no text' : 'no caret';
      return '';
    }

    const SENT_RE = /[^.!?…]+[.!?…]*\s*/g;

    function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

    // The sentence spanning a character offset in a block of text.
    function sentenceAtOffset(raw, at) {
      if (!raw) return '';
      if (at >= raw.length) at = raw.length - 1;
      if (at < 0) return '';
      let m;
      SENT_RE.lastIndex = 0;
      while ((m = SENT_RE.exec(raw)) !== null) {
        if (at >= m.index && at < m.index + m[0].length) return norm(m[0]);
      }
      return '';
    }

    // Expand a selection to its sentence WITHOUT touching the selection.
    //
    // The polling path below must not mutate what the page put there:
    // Selection.modify would fight a reader's own highlight palette and
    // re-trigger the very poll that called it. So this only reads.
    //
    // Readers routinely wrap each word in its own element, so the sentence is
    // almost never inside one text node — climb to an ancestor holding enough
    // text, then find where in it the selection starts.
    //
    // The position is MEASURED with a scratch range, never searched for. A
    // word occurs many times in a paragraph, so matching the selected text
    // against the block's text finds the first occurrence rather than the one
    // under the user's finger: selecting "cat" in "The cat is black. The cat
    // sat." would collect the wrong sentence every time. Range.toString() and
    // textContent share the same text-node semantics, so the length of the
    // text before the selection IS its offset — which also keeps this honest
    // where innerText would not, since innerText applies text-transform and
    // drops hidden subtrees while the selection's own text does neither.
    function sentenceAroundSelection(sel) {
      let range;
      let pick;
      try {
        if (!sel || sel.isCollapsed || !sel.rangeCount) return '';
        range = sel.getRangeAt(0);
        pick = norm(sel.toString());
      } catch (_) { return ''; }
      if (pick.length < MIN_CHARS) return '';
      // A deliberate multi-sentence selection is not something to shrink.
      if (pick.length >= 60 || /[.!?…]\s+\S/.test(pick)) return pick;

      const node = range.startContainer;
      let block = node && (node.nodeType === 1 ? node : node.parentElement);
      // Climb past the per-word inline elements. A paged reader can make each
      // LINE its own block, so keep going until there is room for a sentence.
      for (let i = 0; block && i < 8; i++) {
        if (block.tagName === 'BODY') break;
        if ((block.textContent || '').length >= 80) break;
        if (!block.parentElement) break;
        block = block.parentElement;
      }
      if (!block) return pick;
      const raw = String(block.textContent || '');
      if (!raw) return pick;

      let at;
      try {
        const pre = (block.ownerDocument || document).createRange();
        pre.selectNodeContents(block);
        pre.setEnd(range.startContainer, range.startOffset);
        at = pre.toString().length;
      } catch (_) { return pick; }

      const found = sentenceAtOffset(raw, at);
      return found.length >= MIN_CHARS ? found : pick;
    }

    function resolveFrom(win, range) {
      try {
        const sel = win.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
          sel.modify('move', 'backward', 'sentenceboundary');
          sel.modify('extend', 'forward', 'sentence');
          const t = String(sel.toString() || '').replace(/\s+/g, ' ').trim();
          if (t.length >= MIN_CHARS) return t;
        }
      } catch (_) {}
      try {
        const node = range.startContainer;
        if (!node || node.nodeType !== 3) return '';
        const raw = String(node.textContent || '');
        const off = range.startOffset;
        const re = /[^.!?…]+[.!?…]*\s*/g;
        let m;
        while ((m = re.exec(raw)) !== null) {
          if (off >= m.index && off <= m.index + m[0].length) {
            const t = m[0].replace(/\s+/g, ' ').trim();
            if (t.length >= MIN_CHARS) return t;
          }
        }
        return raw.replace(/\s+/g, ' ').trim();
      } catch (_) { return ''; }
    }

    // The last thing the user selected anywhere on the page, frames included.
    //
    // Cupitor's "open study app" button reads the selection by walking
    // window.frames and calling getSelection() on each — which THROWS for a
    // cross-origin frame, so a sentence picked inside an embedded reader is
    // invisible to it. This is the only route by which that text can reach the
    // host: the frame agent posts it here, and the host reads it from
    // window.__cupSelection().
    let lookupText = '';
    let lookupAt = 0;
    function noteLookup(text) {
      const t = String(text || '').trim();
      if (t.length < MIN_CHARS) return;
      lookupText = t;
      lookupAt = Date.now();
    }
    // Ten minutes: long enough that closing a reader's palette and then
    // opening the study app still works, short enough that a selection from
    // an earlier reading session never pre-fills a lookup.
    window.__cupSelection = function () {
      if (!lookupText || Date.now() - lookupAt > 600000) return '';
      return lookupText;
    };

    function collect(text) {
      if (!text || text.length < MIN_CHARS) return false;
      noteLookup(text);
      // Consecutive duplicates are almost always a double tap, not intent.
      if (state.items[state.items.length - 1] === text) return false;
      state.items.push(text);
      return true;
    }

    // `state.pending` — the text behind the "+ Add sentence" chip — belongs to
    // whichever document put it there. Ownership is not decoration: without
    // it a selection collapsing in one frame wipes a chip another frame raised,
    // and the frame that raised it has no way to take it down again. Both
    // directions were real. `force` is for the user banking it by hand, which
    // clears it whoever owns it.
    function setPending(text, owner, force) {
      if (text) {
        state.pending = text;
        state.pendingFrom = owner;
        noteLookup(text);
      } else {
        if (!force && state.pending && state.pendingFrom !== owner) return;
        state.pending = '';
        state.pendingFrom = null;
      }
      sync();
    }

    // Cross-origin frames run frame-boot.js, injected natively at document
    // start, and speak to us only through postMessage — a JavaScript channel
    // may or may not be exposed to them, but postMessage across origins always
    // is. Arm messages go down; sentences and selections come up.
    // A tap that resolves nothing must say so. Silence is indistinguishable
    // from a dead control, which is what "unreliable" actually felt like.
    function showHint(text) {
      state.hint = text;
      sync();
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = setTimeout(() => { state.hint = ''; sync(); }, 1600);
    }

    function broadcastArm() {
      const msg = { __cupPC: { op: 'arm', on: state.tapMode } };
      for (let i = 0; i < window.frames.length; i++) {
        try { window.frames[i].postMessage(msg, '*'); } catch (_) {}
      }
    }

    // Any frame can post here, so treat the text as untrusted input rather
    // than instruction — it only ever lands in a basket the user reviews and
    // sends by hand.
    window.addEventListener('message', (ev) => {
      const d = ev && ev.data && ev.data.__cupPC;
      if (!d || !d.op) return;
      topDiag.msgs++;
      if (d.op === 'diag') {
        topDiag.diags++;
        frameDiag[String((d.info && d.info.url) || '?')] = d.info;
        return;
      }
      if (d.op === 'hello') { topDiag.hellos++; broadcastArm(); return; }
      if (d.op === 'miss') {
        topDiag.misses++;
        showHint('no sentence (' + (d.why || 'empty') + ')');
        return;
      }
      if (d.op === 'add') {
        topDiag.adds++;
        if (collect(String(d.text || ''))) {
          // Show the list as soon as there is something in it. Relying on the
          // user finding a toggle is what made this feel broken.
          state.open = true;
        } else {
          topDiag.rejected++;
          showHint('already collected');
        }
        // Banking a sentence has to take down that frame's chip, or it sits
        // there offering to bank what was just banked — and tapping it then
        // hits the duplicate check and does nothing visible.
        setPending('', ev.source);
        return;
      }
      if (d.op === 'selection') {
        topDiag.sels++;
        setPending(String(d.text || '').slice(0, 4000), ev.source);
      }
    });

    // Armed from the app's capture chip. The host has always pushed this call
    // to the main WebView; until now nothing on a web page defined it.
    window.__cupitorSetCaptureMode = function (active) {
      state.tapMode = !!active;
      window.__cupitorCaptureMode = state.tapMode;
      armGen++;
      if (root) sync();
      broadcastArm();
      console.log('[pagecap] tap mode', state.tapMode ? 'armed' : 'off');
    };

    function send() {
      if (!state.items.length || !canSend()) return;
      // No timestamps: page sentences have no media time. The host coerces the
      // missing fields and its sort is stable, so this order is preserved.
      const payload = {
        source: 'page',
        title: (document.title || '').trim(),
        url: location.href,
        lang: '',
        lines: state.items.map((text) => ({ text: text })),
      };
      try {
        window.CaptionCollector.postMessage(JSON.stringify(payload));
        console.log('[pagecap] sent', state.items.length, 'sentence(s)');
        state.items = [];
        state.pending = '';
        state.pendingFrom = null;
        state.open = false;
        sync();
      } catch (e) {
        console.warn('[pagecap] send failed', e);
      }
    }

    // One watcher per document, installed by the top frame reaching in. The
    // top document's own selection is covered by the same registration.
    window.cupInFrames('page-capture', function (doc, win) {
      // A frame already running the native document-start agent is covered.
      // Installing here too would double every listener on the same window,
      // and stopPropagation does not stop a sibling listener — that needs
      // stopImmediatePropagation — so both would run and fight.
      if (win !== window) {
        try { if (win.__cupFrameBoot) return; } catch (_) { return; }
      }
      // Readers routinely disable selection so long-press stays theirs for
      // page turns, which is why dragging to select fails in them. Re-enable
      // it where we can; the armed tap path below is the answer when even
      // this is not enough.
      try {
        const st = doc.createElement('style');
        st.textContent =
          '*, *::before, *::after { -webkit-user-select: text !important;' +
          ' user-select: text !important; }';
        (doc.head || doc.documentElement).appendChild(st);
      } catch (_) {}

      // On the WINDOW, in capture phase, on touch rather than click. Each of
      // those matters independently: window capture is the first stop in the
      // event path, so a reader binding there and stopping propagation makes a
      // document-level listener invisible; capture runs before the target's own
      // handlers; and a reader that preventDefaults for page turns cancels the
      // synthesized click outright.
      const handleTap = (ev, x, y) => {
        const el = ev.target;
        if (el && el.closest) {
          if (el.closest('.cup-pc')) return;
          if (el.closest('a,button,input,textarea,select,[role="button"]')) return;
        }
        const text = sentenceAt(doc, win, x, y);
        if (!text) { showHint('no sentence (' + (lastWhy || 'empty') + ')'); return; }
        if (!collect(text)) { showHint('already collected'); return; }
        ev.preventDefault();
        ev.stopPropagation();
        state.open = true;
        try {
          const sel = win.getSelection();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        } catch (_) {}
        setPending('', doc);
      };
      let tapStart = null;
      win.addEventListener('touchstart', (ev) => {
        if (!state.tapMode) return;
        const t = ev.changedTouches && ev.changedTouches[0];
        tapStart = t ? { x: t.clientX, y: t.clientY, at: Date.now() } : null;
      }, true);
      win.addEventListener('touchend', (ev) => {
        if (!state.tapMode || !tapStart) return;
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t) { tapStart = null; return; }
        const dx = Math.abs(t.clientX - tapStart.x);
        const dy = Math.abs(t.clientY - tapStart.y);
        const dt = Date.now() - tapStart.at;
        tapStart = null;
        // A drag is a scroll or page turn; a long press is a selection.
        if (dx > 12 || dy > 12 || dt > 600) return;
        handleTap(ev, t.clientX, t.clientY);
      }, true);
      win.addEventListener('click', (ev) => {
        if (!state.tapMode) return;
        handleTap(ev, ev.clientX, ev.clientY);
      }, true);

      // The event-independent path, and the one to trust inside a reader.
      //
      // Every tap-based approach has to win a fight with the reader's own
      // gesture handling, and loses it in at least one of its layout modes.
      // Polling the selection picks no fight: whatever the reader does with
      // the event, if the user ends up with text selected — including by the
      // reader's own long-press-then-palette behaviour, which selects a real
      // DOM range — this sees it.
      let pollLast = '';      // what the previous tick saw
      let pollDone = '';      // what has already been acted on
      let doneGen = -1;       // the arm generation it was acted on under
      const pollSelection = () => {
        topDiag.ownPolls++;
        let txt = '';
        let sel = null;
        try {
          sel = win && win.getSelection && win.getSelection();
          if (sel && !sel.isCollapsed) {
            const node = sel.anchorNode;
            const el = node && (node.nodeType === 1 ? node : node.parentElement);
            // Selecting inside our own panel must not re-arm the chip.
            if (!(el && el.closest && el.closest('.cup-pc'))) txt = norm(sel.toString());
          }
        } catch (_) {}
        if (txt.length < MIN_CHARS) {
          if (!pollLast && !pollDone) return;
          pollLast = '';
          pollDone = '';
          // Only this document's own chip comes down — setPending refuses to
          // clear one another document raised.
          setPending('', doc);
          return;
        }
        topDiag.ownSel = 1;
        // Two identical ticks means the drag has finished. Without this every
        // intermediate selection during a drag would be collected.
        if (txt !== pollLast) { pollLast = txt; return; }
        // The generation check is what makes "select first, then arm" work:
        // the unarmed pass consumes the selection, and without this it would
        // stay consumed and never be collected.
        if (txt === pollDone && doneGen === armGen) return;
        pollDone = txt;
        doneGen = armGen;
        if (state.tapMode) {
          let sentence = '';
          try { sentence = sentenceAroundSelection(sel); } catch (_) {}
          if (!sentence) sentence = txt;
          // Collect without clearing: the selection belongs to the page, and
          // wiping it closes any palette the user is looking at. pollDone is
          // what stops the next tick adding the same sentence again.
          if (collect(sentence)) {
            topDiag.ownAdds++;
            state.open = true;
            setPending('', doc);
          } else {
            // Already the last thing banked. Saying so beats raising the chip,
            // which would offer to bank it again and then silently refuse.
            showHint('already collected');
            setPending('', doc);
          }
        } else {
          // A deliberate drag is what the user meant; don't widen it.
          setPending(txt, doc);
        }
      };
      doc.addEventListener('selectionchange', pollSelection);
      doc.addEventListener('mouseup', pollSelection);
      // selectionchange is unreliable on some WebView builds, and a reader can
      // swallow every gesture event, so the interval is the load-bearing one.
      setInterval(pollSelection, 350);
    });

    console.log('[pagecap] installed');
  })();
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
