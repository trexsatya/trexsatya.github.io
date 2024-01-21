Download video and subtitles from YT:
```
yt-dlp --write-subs --sub-langs sv,en --convert-subs srt --skip-download -o "%(uploader)s || %(title)s || %(id)s.%(ext)s" -a urls_to_download.txt

```
Python:
```
p = pathlib.Path("/Users/satyendra.kumar/Documents/Swedish_Media/Swedish_YT_9")
    for it in p.rglob("*.sv.srt"):
        new_name = f"{it}".replace('.sv.srt', '.srt')
        print(it, new_name)
        os.rename(f"{it}", f"{new_name}")
```


JS Bookmark to connect subtitles to Wiki
---------------------------------------
```
javascript: (() => {
  let elementContainingSubtitles = document.querySelector('[class*="_video-player__text-tracks"]');
  let filterSubtitleNodes = it => it;

  if (window.location.hostname === 'urplay.se') {
    elementContainingSubtitles = document.querySelector('.jw-captions');
    filterSubtitleNodes = it => Array.from(it.classList).includes('jw-text-track-display');
  }

  if (!elementContainingSubtitles) {
    return
  }
  const observeDOM = (function () {
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    return function (obj, callback) {
      if (!obj || obj.nodeType !== 1) {
        console.log('Node type !=1 ', obj.nodeType);
        return
      }

      if (MutationObserver) {
        const mutationObserver = new MutationObserver(callback);

        mutationObserver.observe(obj, {childList: true, subtree: true});
        return mutationObserver
      }

      else if (window.addEventListener) {
        obj.addEventListener('DOMNodeInserted', callback, false);
        obj.addEventListener('DOMNodeRemoved', callback, false);
      }
    }
  })();

  if (!document.getElementById('subtitleWiki')) {
    let subContainer = document.createElement('div');
    subContainer.id = 'subtitleWiki';
    subContainer.style.padding = '1em';
    subContainer.style.paddingTop = '3em';
    subContainer.style.position = 'fixed';
    subContainer.style.right = '0.2em';
    subContainer.style.height = '100%';
    subContainer.style.width = '35%';
    subContainer.style.top = '0';
    subContainer.style.backgroundColor = 'white';
    subContainer.style.zIndex = '1000';
    subContainer.style.fontSize = 'larger';
    document.body.appendChild(subContainer);

    function btn(txt, onclick) {
      let prevBtn = document.createElement('span');
      prevBtn.innerHTML = txt;
      prevBtn.style.cursor = 'pointer';
      prevBtn.style.border = '1px solid black';
      prevBtn.style.borderRadius = '10%';
      prevBtn.style.marginRight = '1em';
      prevBtn.onclick = onclick;
      return prevBtn
    }

    let subsContent = document.createElement('div');
    subsContent.id = 'subtitlesContent';
    subsContent.style.paddingTop = '1em';

    subContainer.append(btn('< Previous', x => {
      window.currentSubtitleIndex -= 1;
      if (window.currentSubtitleIndex < 0) {
        window.currentSubtitleIndex = 0;
      }
      subtitlesContent.innerHTML = window.subtitles[window.currentSubtitleIndex]
    }));

    subContainer.append(btn('Next >', x => {
      window.currentSubtitleIndex += 1;
      if (window.currentSubtitleIndex >= window.subtitles.length) {
        window.currentSubtitleIndex = window.subtitles.length - 1;
      }
      subtitlesContent.innerHTML = window.subtitles[window.currentSubtitleIndex];
    }));
    subContainer.append(subsContent)
  }

  let lastSubs = null;
  window.subtitles = [];
  window.currentSubtitleIndex = 0;
  observeDOM(elementContainingSubtitles, function (m) {
    var addedNodes = [], removedNodes = [];

    m.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes));

    m.forEach(record => record.removedNodes.length & removedNodes.push(...record.removedNodes));

    console.clear();
    console.log('Added:', addedNodes, 'Removed:', removedNodes);
    let subs = addedNodes.find(filterSubtitleNodes);
    if (subs) {
      subs = subs.innerText.replaceAll("\n", " ");
      subs = subs.split(" ").map(it =>
        it.replaceAll("-", "").replaceAll("–", "").replaceAll(".", "").replaceAll(",", "")
          .replaceAll("?", "")).map(it => `<span> <a target="_blank" href="https://sv.wiktionary.org/wiki/${it.toLowerCase()}">${it}</a></span>&nbsp;`).join(" ");

      if (subs !== lastSubs) {
        subtitlesContent.innerHTML = subs;
        lastSubs = subs;
        window.subtitles.push(subs);
        window.currentSubtitleIndex = window.subtitles.length - 1;
      }
    }
  });

  document.querySelector('#subtitlesContent').onclick = e => {
    if (e.target.nodeName !== 'A') {
      return
    }
    let ws = window.wordsCollected || new Set();
    ws.add(e.target.innerHTML);
    window.wordsCollected = ws;
  };
})();

```
