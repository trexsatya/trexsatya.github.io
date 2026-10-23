#!/bin/sh
# Regenerate db/js/snippet.js from db/js/src/*.js.
#
# snippet.js is what the app fetches: ONE file, ONE request, injected into every
# page with runJavaScript. It cannot be split at delivery time — a <script src>
# pointing at gh-pages is blocked by the content-security policy on exactly the
# sites this targets — so the sources are concatenated here instead.
#
# Sources are numbered because concatenation order is load order:
# 70-caption-capture.js reads what 20 and 30 publish on window.__cupShared.
#
# The host wraps the whole bundle in a function that declares a local `console`
# routing to SnippetLogChannel, so every module's console.log reaches the app's
# log. That works because the modules are siblings inside that one wrapper —
# keep them as top-level IIFEs in the bundle and it keeps working.
#
# Run with --check to verify the committed snippet.js matches the sources
# without rewriting it. Use that anywhere a stale bundle would be shipped
# silently; the repo's git-hooks/pre-commit calls it, though note the hooks in
# git-hooks/ are only active once core.hooksPath points at them.
set -e
cd "$(dirname "$0")"

CHECK_ONLY=no
if [ "$1" = "--check" ]; then CHECK_ONLY=yes; fi

# A syntax error must never reach a device: the bundle is fetched at runtime by
# every install, and a broken one silently disables every page feature at once.
if command -v node > /dev/null 2>&1; then
  for f in src/*.js; do
    node --check "$f" || { echo "build.sh: syntax error in $f" >&2; exit 1; }
  done
else
  echo "build.sh: node not found — writing the bundle unchecked" >&2
fi

# Alongside the output rather than in the system temp dir: same filesystem, so
# the copy below cannot half-write a bundle, and it works where /tmp is not
# writable. The .js extension is required — `node --check` refuses to parse a
# file it cannot identify as a script.
TMP=snippet.tmp.js
trap 'rm -f "$TMP"' EXIT

{
  echo '// GENERATED FILE — DO NOT EDIT.'
  echo '//'
  echo '// Built from db/js/src/*.js by db/js/build.sh. Edit the sources there and'
  echo '// re-run that script; anything written here is lost on the next build.'
  echo ''
  cat src/*.js
} > "$TMP"

if command -v node > /dev/null 2>&1; then
  node --check "$TMP" || {
    echo "build.sh: the generated bundle does not parse" >&2
    exit 1
  }
fi

if [ "$CHECK_ONLY" = yes ]; then
  if cmp -s "$TMP" snippet.js; then
    echo "snippet.js is up to date with src/"
    exit 0
  fi
  echo "build.sh: snippet.js is STALE — run db/js/build.sh and commit the result" >&2
  exit 1
fi

cp "$TMP" snippet.js
echo "snippet.js: $(wc -l < snippet.js | tr -d ' ') lines from $(ls src/*.js | wc -l | tr -d ' ') sources"
