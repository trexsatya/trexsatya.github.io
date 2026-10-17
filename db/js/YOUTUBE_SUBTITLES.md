# Download a YouTube track into the caption sidebar

In a compatible Cupitor app, the YouTube sidebar's **⤓CC** button asks the
native `YouTubeSubtitles` JavaScript channel to download the current video's
subtitles. The app reuses its existing track picker and yt-dlp downloader.
The button is hidden when that channel is absent.

The app calls `window.__cupImportYouTubeSubtitles` with:

```js
{
  videoId: 'abcdefghijk',
  lang: 'sv',
  lines: [{start: 1.5, end: 4, text: 'En mening.'}]
}
```

Times are seconds. The function returns `true` for an accepted track and
`false` for an empty/invalid payload or a different current video. Import
replaces harvested lines; it does not seek or start playback. The native video
clock still drives highlighting and the existing replay strategies. Caption
translation and selecting/sending lines use the selected track's language.

While a downloaded track is active, live DOM/TextTrack/VTT harvesting cannot
append duplicate approximate captions. Moving to a new video clears the old
timeline. Up to five downloaded tracks are remembered in `sessionStorage`,
and returning to one of those videos restores its track. Clear removes it
from both the panel and that session cache.

Regenerate `snippet.js` after changing the numbered sources:

```sh
sh db/js/build.sh
CUPITOR_JSDOM=/path/to/jsdom node --test db/js/youtube-download.test.mjs
CUPITOR_JSDOM=/path/to/jsdom node db/js/caption-capture.test.mjs
CUPITOR_JSDOM=/path/to/jsdom node db/js/caption-link.test.mjs
```

The app update is in `trexsatya/cupitor-flutter`; the two changes can be merged
in either order. Refresh the video page after both are deployed. Older apps
continue their existing caption capture flow without a download button.
