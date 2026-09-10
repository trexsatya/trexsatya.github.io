// Cupitor frame agent.
//
// Injected by the host at DOCUMENT START into EVERY frame, via
// WebViewCompat.addDocumentStartJavaScript. That is the only way to reach a
// cross-origin iframe: page JavaScript cannot touch one from its parent, so an
// e-book reader served from a different subdomain than its host page (Studora
// renders ereader2.studora.se inside studora.se) is otherwise unreachable.
//
// Deliberately talks to the top frame with postMessage rather than through a
// JavaScript channel. Whether addJavascriptInterface exposes channels to
// cross-origin frames varies by WebView version; postMessage across origins is
// guaranteed. Only the top frame — running snippet.js — talks to the host.
//
// Protocol, all under the `__cupPC` key:
//   down   { op: 'arm', on: bool }        parent → children
//   up     { op: 'add', text }            a collected sentence
//   up     { op: 'selection', text, sentence, paragraph }
//                                          current selection, '' when cleared;
//                                          `text` is the raw pick, the other
//                                          two are the granularities offered
//   up     { op: 'hello' }                a frame arrived; asks for arm state
//   up     { op: 'miss', why }            a tap resolved no sentence
//   up     { op: 'diag', info }           counters, so failures are readable
//
// Every frame relays: arm messages downward, everything else upward. Nested
// frames therefore work without the top frame knowing the tree.
(function () {
  if (window.__cupFrameBoot) return;
  window.__cupFrameBoot = 1;

  // The top document gets snippet.js the ordinary way; this agent exists only
  // for frames, and doing both would install two of everything.
  if (window.top === window) return;

  var MIN_CHARS = 2;
  var armed = false;
  var sawArm = false;
  // Bumped on every arm change. The poller records which generation it
  // consumed a selection under, so arming while text is already selected
  // collects it instead of treating it as spent.
  var armGen = 0;

  // There is no console to read inside a cross-origin frame on a phone, and
  // "it doesn't work" has at least four distinct causes here: the script never
  // ran, arm never arrived, events never reached us, or resolution failed.
  // These counters are what tell them apart — they surface in the app's
  // "Page & frame report".
  var diag = {
    tstart: 0, tend: 0, clicks: 0, taps: 0,
    adds: 0, misses: 0, arms: 0, polls: 0, sels: 0,
    hadSel: 0, lastWhy: '', url: '',
  };
  try { diag.url = String(location.href).slice(0, 120); } catch (_) {}

  function up(msg) {
    try { parent.postMessage({ __cupPC: msg }, '*'); } catch (_) {}
  }

  function down(msg) {
    for (var i = 0; i < window.frames.length; i++) {
      try { window.frames[i].postMessage({ __cupPC: msg }, '*'); } catch (_) {}
    }
  }

  window.addEventListener('message', function (ev) {
    var d = ev && ev.data && ev.data.__cupPC;
    if (!d || !d.op) return;
    if (d.op === 'arm') {
      // Only the parent arms us: without this, any nested third-party frame
      // could arm its siblings with the app's own chip switched off. Written
      // as "present and wrong" rather than "not parent" on purpose — a
      // WebView that delivers no ev.source must not lose arming, which would
      // silently disable the whole feature.
      if (ev.source && ev.source !== parent) return;
      var was = armed;
      armed = !!d.on;
      diag.arms++;
      sawArm = true;
      // On any real change, in either direction. What must not bump it is a
      // REPEAT of the same value, which every frame's `hello` re-broadcast
      // produces. Bumping only when arming left the mirror broken: disarming
      // with text still selected reported nothing ever again.
      if (armed !== was) armGen++;
      down(d);              // keep nested frames in step
      return;
    }
    // Anything else came from a child on its way to the top.
    if (d.op === 'add' || d.op === 'selection' || d.op === 'hello' ||
        d.op === 'miss' || d.op === 'diag' || d.op === 'lookup') up(d);
  });

  var SENT_RE = /[^.!?…]+[.!?…]*\s*/g;

  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

  function caretRangeAt(x, y) {
    try {
      if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
      if (document.caretPositionFromPoint) {
        var p = document.caretPositionFromPoint(x, y);
        if (!p) return null;
        var r = document.createRange();
        r.setStart(p.offsetNode, p.offset);
        r.collapse(true);
        return r;
      }
    } catch (_) {}
    return null;
  }

  // The sentence under a tap, without requiring a selection the reader may not
  // permit. Blink offers sentence granularity on Selection.modify, which is
  // exactly this job; splitting the tapped text node is the fallback.
  var lastWhy = '';

  function resolveFrom(range) {
    try {
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
        sel.modify('move', 'backward', 'sentenceboundary');
        sel.modify('extend', 'forward', 'sentence');
        var t = norm(sel.toString());
        if (t.length >= MIN_CHARS) return t;
      }
    } catch (_) {}
    try {
      var node = range.startContainer;
      if (!node || node.nodeType !== 3) return '';
      var raw = String(node.textContent || '');
      var off = range.startOffset;
      var m;
      SENT_RE.lastIndex = 0;
      while ((m = SENT_RE.exec(raw)) !== null) {
        if (off >= m.index && off <= m.index + m[0].length) {
          var s2 = norm(m[0]);
          if (s2.length >= MIN_CHARS) return s2;
        }
      }
      return norm(raw);
    } catch (_) { return ''; }
  }

  // A finger is not a caret. Taps land in line gaps, on padding, and between
  // words, where caretRangeFromPoint returns nothing — so probe a little way
  // above and below before giving up.
  function sentenceAt(x, y) {
    var offsets = [0, -6, 6, -12, 12];
    var sawCaret = false;
    // resolveFrom below rewrites the selection on every probe, so a tap that
    // resolves nothing would otherwise leave a stray one-word selection behind
    // and destroy whatever the user actually had selected.
    var saved = null;
    try {
      var s0 = window.getSelection();
      if (s0 && s0.rangeCount) saved = s0.getRangeAt(0).cloneRange();
    } catch (_) {}
    var found = '';
    for (var i = 0; i < offsets.length; i++) {
      var range = caretRangeAt(x, y + offsets[i]);
      if (!range) continue;
      sawCaret = true;
      var t = resolveFrom(range);
      if (t) { found = t; break; }
    }
    // ALWAYS, success included. Returning early used to leave the selection
    // set to the sentence resolveFrom fabricated, which the poller then read
    // back as if the user had selected it. handleTapAt clears deliberately
    // when it banks.
    try {
      var s1 = window.getSelection();
      if (s1) {
        s1.removeAllRanges();
        if (saved) s1.addRange(saved);
      }
    } catch (_) {}
    if (found) return found;
    // 'no caret' means the point is not over text the engine can address at
    // all — a canvas, an overlay, or a shadow root. 'no text' means it is over
    // text but nothing came back, which is a resolution problem, not a
    // reachability one. The distinction decides what to try next.
    lastWhy = sawCaret ? 'no text' : 'no caret';
    diag.lastWhy = lastWhy;
    return '';
  }

  // The sentence spanning a character offset in a block of text.
  function sentenceAtOffset(raw, at) {
    if (!raw) return '';
    if (at >= raw.length) at = raw.length - 1;
    if (at < 0) return '';
    var m;
    SENT_RE.lastIndex = 0;
    while ((m = SENT_RE.exec(raw)) !== null) {
      if (at >= m.index && at < m.index + m[0].length) return norm(m[0]);
    }
    return '';
  }

  // Expand a selection to its sentence WITHOUT touching the selection.
  //
  // The polling path below must not mutate what the reader put there:
  // Selection.modify would fight the reader's own highlight palette and
  // re-trigger the very poll that called it. So this only reads.
  //
  // Readers routinely wrap each word in its own element, so the sentence is
  // almost never inside a single text node — climb to an ancestor holding
  // enough text, then find where in it the selection starts.
  //
  // The position is MEASURED with a scratch range, never searched for. A word
  // occurs many times in a paragraph, so matching the selected text against
  // the block's text picks the first occurrence rather than the one under the
  // user's finger — "cat" in "The cat is black. The cat sat." would collect
  // the wrong sentence every time. Range.toString() and textContent share the
  // same text-node semantics, so the length of the text before the selection
  // IS its offset — which also keeps this honest where innerText would not:
  // it ignores text-transform and hidden subtrees.
  function sentenceAroundSelection(sel) {
    var range, pick;
    try {
      if (!sel || sel.isCollapsed || !sel.rangeCount) return '';
      range = sel.getRangeAt(0);
      pick = norm(sel.toString());
    } catch (_) { return ''; }
    if (pick.length < MIN_CHARS) return '';

    var node = range.startContainer;
    var block = node && (node.nodeType === 1 ? node : node.parentElement);
    // Climb past the per-word inline elements. A paged reader can make each
    // LINE its own block, so keep going until there is room for a sentence.
    for (var i = 0; block && i < 8; i++) {
      if (block.tagName === 'BODY') break;
      if ((block.textContent || '').length >= 80) break;
      if (!block.parentElement) break;
      block = block.parentElement;
    }
    if (!block) return pick;
    var raw = String(block.textContent || '');
    if (!raw) return pick;

    var at;
    try {
      var pre = (block.ownerDocument || document).createRange();
      pre.selectNodeContents(block);
      pre.setEnd(range.startContainer, range.startOffset);
      at = pre.toString().length;
    } catch (_) { return pick; }

    var s = sentenceAtOffset(raw, at);
    // The sentence wins only if it actually contains what was selected;
    // otherwise the selection spans more than one and shrinking it would throw
    // away text the user deliberately picked.
    if (s.length >= MIN_CHARS && s.indexOf(pick) !== -1) return s;
    return pick;
  }

  // Tags that genuinely mark a paragraph. ARTICLE / SECTION / MAIN are
  // deliberately absent: they are containers, and treating one as a paragraph
  // would hand back the whole chapter.
  var PARA_TAGS = /^(?:P|LI|BLOCKQUOTE|DD|DT|TD|TH|FIGCAPTION|H[1-6])$/;

  // The block of prose containing the selection, read without touching it.
  //
  // The nearest real paragraph tag wins. A reader that wraps every word — or
  // every LINE — in its own element would otherwise give back one line, so the
  // fallback is the nearest ancestor holding a paragraph's worth of text.
  function paragraphAroundSelection(sel) {
    var node;
    try {
      if (!sel || sel.isCollapsed || !sel.rangeCount) return '';
      node = sel.getRangeAt(0).startContainer;
    } catch (_) { return ''; }
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    var fallback = null;
    for (var i = 0; el && i < 12; i++) {
      if (el.tagName === 'BODY') break;
      if (PARA_TAGS.test(el.tagName || '')) {
        var t = norm(el.textContent);
        if (t.length >= MIN_CHARS) return t.slice(0, 4000);
      }
      // A ceiling as well as a floor: per-line markup with no paragraph tag
      // jumps from a 40-character line straight to the chapter container, and
      // "+ Paragraph" would then bank a chapter. Nothing paragraph-sized means
      // the button stays hidden, which is the honest answer.
      if (!fallback) {
        var len = (el.textContent || '').length;
        if (len >= 200 && len <= 2000) fallback = el;
      }
      if (!el.parentElement) break;
      el = el.parentElement;
    }
    return fallback ? norm(fallback.textContent).slice(0, 4000) : '';
  }

  function handleTapAt(ev, x, y) {
    diag.taps++;
    var el = ev.target;
    if (el && el.closest &&
        el.closest('a,button,input,textarea,select,[role="button"]')) return;
    var text = sentenceAt(x, y);
    if (!text || text.length < MIN_CHARS) {
      // Say so rather than staying silent: an unexplained no-op is what makes
      // this feel unreliable even when it is working as designed. Leave the
      // event alone so the reader's own tap behaviour still happens.
      diag.misses++;
      up({ op: 'miss', why: lastWhy || 'empty' });
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    diag.adds++;
    up({ op: 'add', text: text });
    clearSel();
  }

  function clearSel() {
    try {
      var sel = window.getSelection();
      if (sel && sel.removeAllRanges) sel.removeAllRanges();
    } catch (_) {}
  }

  // The event-independent path, and the one to trust in a reader.
  //
  // Every tap-based approach here has to win a fight with the reader's own
  // gesture handling, and loses it in at least one of the reader's two layout
  // modes. Polling the selection picks no fight at all: whatever the reader
  // does with the event, if the user ends up with text selected — including
  // by the reader's own long-press-then-palette behaviour, which selects a
  // real DOM range — we see it and can read it.
  var pollLast = '';     // what the previous tick saw
  var pollDone = '';     // what has already been acted on
  var lookupSent = '';   // last text reported upward for lookup
  var doneGen = -1;      // the arm generation it was acted on under

  function pollSelection() {
    diag.polls++;
    var txt = '';
    var sel = null;
    try {
      sel = window.getSelection();
      // rangeCount first: Selection.toString() flushes layout, and this runs
      // every 350ms whether or not anything is selected.
      if (sel && sel.rangeCount && !sel.isCollapsed) txt = norm(sel.toString());
    } catch (_) {}
    if (txt.length < MIN_CHARS) {
      if (pollLast || pollDone) {
        pollLast = '';
        pollDone = '';
        lookupSent = '';
        up({ op: 'selection', text: '' });
      }
      return;
    }
    diag.hadSel = 1;
    // Reported on FIRST sight and for lookup only, ahead of the settling gate:
    // collecting needs a stable selection, looking a word up does not. Sent
    // only when it changes — this runs three times a second per frame.
    if (txt !== lookupSent) {
      lookupSent = txt;
      up({ op: 'lookup', text: txt });
    }
    // Two identical ticks means the drag has finished. Without this, every
    // intermediate selection during a drag would be collected as its own
    // sentence.
    if (txt !== pollLast) { pollLast = txt; return; }
    if (txt === pollDone && doneGen === armGen) return;
    pollDone = txt;
    doneGen = armGen;
    // Widen ONLY when collecting. This used to sit above the branch, so a
    // plain selection in a reader travelled up as its whole sentence — and
    // the host's lookup button then looked up the sentence instead of the
    // word the user had picked. Mirror of the same rule in
    // 60-page-capture.js's poller: a deliberate drag is what the user meant.
    if (armed) {
      var sentence = '';
      try { sentence = sentenceAroundSelection(sel); } catch (_) {}
      if (!sentence) sentence = txt;
      diag.adds++;
      // Collect without clearing: the selection is the reader's, and wiping it
      // would close the palette the user is looking at. pollDone is what stops
      // the next tick adding the same sentence again.
      //
      // `raw` carries what was actually selected, because `text` has been
      // widened to a sentence for the basket and lookup must not inherit that.
      // Deliberately not posting `selection` as well: that would set the top
      // frame's "+ Add sentence" chip, offering to bank what was just banked.
      up({ op: 'add', text: sentence, raw: txt });
    } else {
      // Both granularities, resolved here because only this frame can read its
      // own DOM. `text` stays the raw pick — the host's lookup wants the word
      // that was selected, not a widening of it.
      var pickSentence = '';
      var pickPara = '';
      try { pickSentence = sentenceAroundSelection(sel); } catch (_) {}
      try { pickPara = paragraphAroundSelection(sel); } catch (_) {}
      if (!pickSentence) pickSentence = txt;
      diag.sels++;
      up({
        op: 'selection',
        text: txt,
        sentence: pickSentence,
        paragraph: pickPara,
      });
    }
  }

  var tapStart = null;

  function start() {
    // Readers disable selection so long-press stays theirs for page turns,
    // which is why dragging to select fails inside them.
    try {
      var st = document.createElement('style');
      st.textContent =
        '*, *::before, *::after { -webkit-user-select: text !important;' +
        ' user-select: text !important; }';
      (document.head || document.documentElement).appendChild(st);
    } catch (_) {}

    // On WINDOW, in capture phase, and on touch rather than click. Three
    // separate reasons, each of which alone breaks this:
    //   - window capture is the first stop in the event path; a reader that
    //     binds there and stops propagation makes a document-level listener
    //     invisible;
    //   - capture phase runs before the target's own handlers;
    //   - a reader that calls preventDefault() for its page turns cancels the
    //     synthesized click outright, so no click listener ever runs.
    window.addEventListener('touchstart', function (ev) {
      diag.tstart++;
      if (!armed) return;
      var t = ev.changedTouches && ev.changedTouches[0];
      tapStart = t ? { x: t.clientX, y: t.clientY, at: Date.now() } : null;
    }, true);

    window.addEventListener('touchend', function (ev) {
      diag.tend++;
      if (!armed || !tapStart) return;
      var t = ev.changedTouches && ev.changedTouches[0];
      if (!t) { tapStart = null; return; }
      var dx = Math.abs(t.clientX - tapStart.x);
      var dy = Math.abs(t.clientY - tapStart.y);
      var dt = Date.now() - tapStart.at;
      tapStart = null;
      // A drag is the reader's page turn and a long press is a selection
      // attempt; neither is a request to collect.
      if (dx > 12 || dy > 12 || dt > 600) return;
      handleTapAt(ev, t.clientX, t.clientY);
    }, true);

    // Mouse and stylus, and WebViews that synthesize only mouse events. When
    // touchend already handled the tap it called preventDefault, so no click
    // follows; when it could not resolve a sentence, this gets a second go and
    // the top frame rejects a repeat of the same text anyway.
    window.addEventListener('click', function (ev) {
      diag.clicks++;
      if (!armed) return;
      handleTapAt(ev, ev.clientX, ev.clientY);
    }, true);

    // The poll is the load-bearing path; these just make it react instantly
    // to a selection that has already settled.
    document.addEventListener('selectionchange', pollSelection);
    document.addEventListener('mouseup', pollSelection);
    setInterval(pollSelection, 350);

    // Only while actually collecting. `sawArm` proves the top frame runs
    // pageCapture and that our messages arrive; `armed` keeps this from
    // being perpetual traffic in every frame of every page, since nothing
    // reads it the rest of the time.
    setInterval(function () {
      if (!sawArm || !armed) return;
      up({ op: 'diag', info: diag });
    }, 2000);

    // Retract any chip a PREVIOUS document in this frame raised. A reader
    // turning the page replaces its document, and the fresh one starts with no
    // selection to notice going away — so the chip stayed up backed by text
    // nobody can see any more. The frame's WindowProxy survives the
    // navigation, so the top frame still recognises us as its owner.
    up({ op: 'selection', text: '' });
    // The top frame may have been armed before this frame existed.
    up({ op: 'hello' });
    // A frame that loads before the top frame's snippet.js gets no answer to
    // that first hello, and would then never report. Keep asking until the
    // top frame replies.
    var helloTries = 0;
    var helloTimer = setInterval(function () {
      if (sawArm || ++helloTries > 20) { clearInterval(helloTimer); return; }
      up({ op: 'hello' });
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
