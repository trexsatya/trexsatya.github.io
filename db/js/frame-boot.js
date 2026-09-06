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
    if (d.op === 'add' || d.op === 'selection' || d.op === 'hello') up(d);
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
  function sentenceAt(x, y) {
    var range = caretRangeAt(x, y);
    if (!range) return '';
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
          var s = m[0].replace(/\s+/g, ' ').trim();
          if (s.length >= MIN_CHARS) return s;
        }
      }
      return raw.replace(/\s+/g, ' ').trim();
    } catch (_) { return ''; }
  }

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

    // Capture phase: a reader that swallows clicks for its own gestures would
    // otherwise never let this run. Only swallows the tap when a sentence was
    // actually collected, so an armed tap on empty margin still turns the page.
    document.addEventListener('click', function (ev) {
      if (!armed) return;
      var el = ev.target;
      if (el && el.closest &&
          el.closest('a,button,input,textarea,select,[role="button"]')) return;
      var text = sentenceAt(ev.clientX, ev.clientY);
      if (!text || text.length < MIN_CHARS) return;
      ev.preventDefault();
      ev.stopPropagation();
      up({ op: 'add', text: text });
      try {
        var sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      } catch (_) {}
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
