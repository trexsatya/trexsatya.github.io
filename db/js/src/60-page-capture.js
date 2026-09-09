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
