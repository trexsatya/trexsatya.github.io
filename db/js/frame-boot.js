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
//   up     { op: 'selection', text }      current selection, '' when cleared
//   up     { op: 'hello' }                a frame arrived; asks for arm state
//   up     { op: 'miss' }                 a tap resolved no sentence
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
      armed = !!d.on;
      down(d);              // keep nested frames in step
      return;
    }
    // Anything else came from a child on its way to the top.
    if (d.op === 'add' || d.op === 'selection' || d.op === 'hello' ||
        d.op === 'miss') up(d);
  });

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
        var t = String(sel.toString() || '').replace(/\s+/g, ' ').trim();
        if (t.length >= MIN_CHARS) return t;
      }
    } catch (_) {}
    try {
      var node = range.startContainer;
      if (!node || node.nodeType !== 3) return '';
      var raw = String(node.textContent || '');
      var off = range.startOffset;
      var re = /[^.!?…]+[.!?…]*\s*/g;
      var m;
      while ((m = re.exec(raw)) !== null) {
        if (off >= m.index && off <= m.index + m[0].length) {
          var s2 = m[0].replace(/\s+/g, ' ').trim();
          if (s2.length >= MIN_CHARS) return s2;
        }
      }
      return raw.replace(/\s+/g, ' ').trim();
    } catch (_) { return ''; }
  }

  // A finger is not a caret. Taps land in line gaps, on padding, and between
  // words, where caretRangeFromPoint returns nothing — so probe a little way
  // above and below before giving up.
  function sentenceAt(x, y) {
    var offsets = [0, -6, 6, -12, 12];
    var sawCaret = false;
    for (var i = 0; i < offsets.length; i++) {
      var range = caretRangeAt(x, y + offsets[i]);
      if (!range) continue;
      sawCaret = true;
      var t = resolveFrom(range);
      if (t) return t;
    }
    // 'no caret' means the point is not over text the engine can address at
    // all — a canvas, an overlay, or a shadow root. 'no text' means it is over
    // text but nothing came back, which is a resolution problem, not a
    // reachability one. The distinction decides what to try next.
    lastWhy = sawCaret ? 'no text' : 'no caret';
    return '';
  }

  function clearSel() {
    try {
      var sel = window.getSelection();
      if (sel && sel.removeAllRanges) sel.removeAllRanges();
    } catch (_) {}
  }

  function handleTapAt(ev, x, y) {
    var el = ev.target;
    if (el && el.closest &&
        el.closest('a,button,input,textarea,select,[role="button"]')) return;
    var text = sentenceAt(x, y);
    if (!text || text.length < MIN_CHARS) {
      // Say so rather than staying silent: an unexplained no-op is what makes
      // this feel unreliable even when it is working as designed. Leave the
      // event alone so the reader's own tap behaviour still happens.
      up({ op: 'miss', why: lastWhy || 'empty' });
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    up({ op: 'add', text: text });
    clearSel();
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
      if (!armed) return;
      var t = ev.changedTouches && ev.changedTouches[0];
      tapStart = t ? { x: t.clientX, y: t.clientY, at: Date.now() } : null;
    }, true);

    window.addEventListener('touchend', function (ev) {
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
    // collect() rejects a repeat of the same text anyway.
    window.addEventListener('click', function (ev) {
      if (!armed) return;
      handleTapAt(ev, ev.clientX, ev.clientY);
    }, true);

    var report = function () {
      var text = '';
      try {
        var sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          text = String(sel.toString() || '').replace(/\s+/g, ' ').trim();
        }
      } catch (_) {}
      if (text.length < MIN_CHARS) text = '';
      up({ op: 'selection', text: text });
    };
    document.addEventListener('selectionchange', report);
    document.addEventListener('mouseup', report);
    document.addEventListener('touchend', report);

    // The top frame may have been armed before this frame existed.
    up({ op: 'hello' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
