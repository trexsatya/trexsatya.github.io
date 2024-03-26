Download video and subtitles from YT:
```
TO_DOWNLOAD=$(pwd)/urls_to_download.txt
cd $1

OUT_FORMAT="%(uploader)s || %(title)s || %(id)s.%(ext)s"
echo "Downloading into directory "$1
echo "Downloading from urls in "$TO_DOWNLOAD
# yt-dlp --write-subs --sub-langs sv --convert-subs srt --skip-download -o "$OUT_FORMAT" -a $TO_DOWNLOAD
# yt-dlp --write-subs --sub-langs sv --skip-download -o "$OUT_FORMAT" -a $TO_DOWNLOAD

# yt-dlp  -o "$OUT_FORMAT" --audio-format mp3 -x -a $TO_DOWNLOAD
yt-dlp  -o "$OUT_FORMAT" -S vcodec:h264,res,acodec:m4a -a $TO_DOWNLOAD
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
Collect subtitles
```
javascript: (() => {  let elementContainingSubtitles = document.querySelector('[class*="_video-player__text-tracks"]');  let filterSubtitleNodes = it => it;  let timestampNode = document.querySelector('div[data-rt="video-player-time-indicator"]');  if (window.location.hostname === 'urplay.se') {    elementContainingSubtitles = document.querySelector('.jw-captions');  timestampNode = document.querySelector('.jw-text-elapsed');  filterSubtitleNodes = it => Array.from(it.classList).includes('jw-text-track-display');  }  if (!elementContainingSubtitles) {    return  }  const observeDOM = (function () {    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;    return function (obj, callback) {      if (!obj || obj.nodeType !== 1) {        console.log('Node type !=1 ', obj.nodeType);        return      }      if (MutationObserver) {        const mutationObserver = new MutationObserver(callback);        mutationObserver.observe(obj, {childList: true, subtree: true});        return mutationObserver      } else if (window.addEventListener) {        obj.addEventListener('DOMNodeInserted', callback, false);        obj.addEventListener('DOMNodeRemoved', callback, false);      }    }  })();  if (!document.getElementById('subtitleWiki')) {    let subContainer = document.createElement('div');    subContainer.id = 'subtitleWiki';    subContainer.style.padding = '1em';    subContainer.style.paddingTop = '3em';    subContainer.style.position = 'fixed';    subContainer.style.right = '0.2em';    subContainer.style.height = '100%';    subContainer.style.width = '13%';    subContainer.style.top = '0';    subContainer.style.backgroundColor = 'white';    subContainer.style.zIndex = '1000';    subContainer.style.fontSize = 'larger';    document.body.appendChild(subContainer);    function btn(txt, onclick) {      let prevBtn = document.createElement('span');      prevBtn.innerHTML = txt;      prevBtn.style.cursor = 'pointer';      prevBtn.style.border = '1px solid black';      prevBtn.style.borderRadius = '10%';      prevBtn.style.marginRight = '1em';      prevBtn.onclick = onclick;      return prevBtn    }    let subsContent = document.createElement('div');    subsContent.id = 'subtitlesContent';    subsContent.style.paddingTop = '1em';    subContainer.append(btn('< Previous', x => {      window.currentSubtitleIndex -= 1;      if (window.currentSubtitleIndex < 0) {        window.currentSubtitleIndex = 0;      }      subtitlesContent.innerHTML = getWikiLinks(window.subtitles[window.currentSubtitleIndex].text)    }));    subContainer.append(btn('Next >', x => {      window.currentSubtitleIndex += 1;      if (window.currentSubtitleIndex >= window.subtitles.length) {        window.currentSubtitleIndex = window.subtitles.length - 1;      }      subtitlesContent.innerHTML = getWikiLinks(window.subtitles[window.currentSubtitleIndex].text);    }));    subContainer.append(subsContent)  }  let lastSubs = null;  window.subtitles = [];  window.currentSubtitleIndex = 0;  function getTextFromSubtitleNodes(addedSubs) {    const segmentor = new Intl.Segmenter([], {granularity: 'word'}); const segmentedText = segmentor.segment(addedSubs.innerText); return  Array.from(segmentedText, ({segment}) => segment).map(it => it.trim()).join(" ");  }  function getWikiLinks(text) {    return text.split(" ").map(it => `<span> <a target="_blank" href="https://sv.wiktionary.org/wiki/${it.toLowerCase()}">${it}</a></span>`).join(" ");  } function getTimestamp() {    let str = timestampNode.innerText.split("/")[0].trim();    let [x, y] = str.split(":");    return parseInt(x)*60 + parseInt(y);  }  observeDOM(elementContainingSubtitles, function (m) {    var addedNodes = [], removedNodes = [];    m.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes));    m.forEach(record => record.removedNodes.length & removedNodes.push(...record.removedNodes));   console.log(%27Added%27, addedNodes, %27Removed:%27, removedNodes);    let addedSubs = addedNodes.find(filterSubtitleNodes);    let removedSubs = removedNodes.find(it => it);    if (addedSubs) {      addedSubs = getTextFromSubtitleNodes(addedSubs);      if (addedSubs !== lastSubs) {        subtitlesContent.innerHTML = getWikiLinks(addedSubs);        lastSubs = addedSubs;        window.subtitles.push({ts: getTimestamp(), text: addedSubs});        window.currentSubtitleIndex = window.subtitles.length - 1;      }    }    if(removedSubs) {      let txt = getTextFromSubtitleNodes(removedSubs);      let matching = window.subtitles.filter(it => it.text === txt);      if(matching.length) {        console.log("Adding end time");        matching[matching.length-1].te = getTimestamp();      }    }  });  document.querySelector(%27#subtitlesContent').onclick = e => {    if (e.target.nodeName !== 'A') {      return;    }    let ws = window.wordsCollected || new Set();    ws.add(e.target.innerHTML);    window.wordsCollected = ws;  };})();
```

Write-SRT
```
javascript: {  function fixTiming(x) {    for(let i = 1; i < x.length; i++) {      let item = x[i];      let prev = x[i-1];      if(!prev['te']) {        prev['te'] = parseInt(item['ts']);      }    }  }  function convertToTimestamp(n) {    let hr = Math.floor(n / 3600), min = Math.floor(n / 60), sec = n % 60;    hr = (hr + '').padStart(2, '0'); min = (min+'').padStart(2, '0'); sec = (sec+'').padStart(2, '0');    return `${hr}:${min}:${sec},000`;  }  function convertToSrt(x) {    let srt = '';    for(let i = 0; i < x.length; i++) {      let item = x[i];      let ts = convertToTimestamp(item['ts']);      let te = convertToTimestamp(item['te']);      let text = item['text'];      srt += `${i+1}\n${ts} --> ${te}\n${text}\n\n`;    }    return srt;  }  fixTiming(window.subtitles);  console.log(convertToSrt(window.subtitles))}
```
To extract images from webpages so that it can be used as wallpapers:
```
items = $('#inner_content-10-38').children().toArray()
let acc = [] 
for(let i=0; i < items.length; i++) {
   let item = items[i]
   let $el = $('<div>').addClass('autocreated') 
   if($(item).is('h3')) {
       console.log('h3 found', acc)
       if(acc.length) {
           $('#inner_content-10-38').append($el)
           acc.forEach(it => $(it).appendTo($el));
       }
       acc = []
       $el = $('<div>').addClass('autocreated') 
   } else {
       console.log('pushing to acc')
       acc.push(item)
   }
}

items = $('.autocreated').toArray()

async function saveImg(it){
  let canvas = await html2canvas(it)
    //console.log(canvas.toDataURL("image/jpeg"))
    fetch('http://localhost:5000/save_img', {
        method: 'POST',
        body: JSON.stringify({img: canvas.toDataURL("image/jpeg")}),
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

update = n => {}
function schedule(data, timeInSeconds, taskRunner, onComplete, finishNowCondition) {
  data = data.map(x => x); //clone
  let totalDataItems = data.length
  let fn = null;
  fn = (x, idx) => setTimeout(() => {
    let first = data.splice(0, 1);

    if (finishNowCondition && finishNowCondition(first)) {
      //-1 => Finished because finishNowCondition satisfied
      console.log("Maybe finishing early on index, last consumed data item at index: " + (idx) + " out of total: " + (totalDataItems - 1))
      return
    }
    if (first.length) {
      let task = typeof (first[0]) == 'function' ? first[0] : () => taskRunner(first[0], idx)
      let result = task()
      update();
      if (result instanceof Promise) {
        result.then(it => {
          if (window.stopAnimationSignal) {
            window.animationScriptFunction = () => fn(100, idx) //Store function
            console.log("Waiting for signal. Call resumeAnimationScript()")
          } else {
            fn(100, idx + 1)
          }

        })
      } else if (result !== false) {
        let delay = timeInSeconds * 1000
        if (typeof (result) == 'number') delay = result * 1000

        if (result === -1 || window.stopAnimationSignal) {
          if (window.animationScriptFunction) {
            console.log('There is already a function for animation script!!!')
          } else {
            window.animationScriptFunction = () => fn(delay, idx + 1) //Store function
            console.log("Waiting for signal. Call resumeAnimationScript()")
            $('#btnResumeAnimation').show();
          }
        } else {
          fn(delay, idx + 1)
        }
      } else {
        console.log("Ended because function returned false!")
      }
    } else {
      if (onComplete) onComplete();
    }
  }, x);
  fn(0, 0);
}
schedule(items, 3, x => saveImg(x))
```
