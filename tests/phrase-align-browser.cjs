const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const note = pitch => '<note><pitch><step>'+pitch+'</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>';
const xml = '<?xml version="1.0" encoding="utf-8"?>'
 + '<score-partwise version="3.1"><work><work-title>Alignment test</work-title></work>'
 + '<movement-title>Alignment test</movement-title>'
 + '<identification><creator type="composer">Test</creator></identification>'
 + '<defaults><scaling><millimeters>7</millimeters><tenths>40</tenths></scaling></defaults>'
 + '<part-list><score-part id="P1"><part-name>Guitar</part-name><part-abbreviation>Gtr</part-abbreviation>'
 + '<score-instrument id="I1"><instrument-name>Guitar</instrument-name></score-instrument></score-part></part-list>'
 + '<part id="P1">'
 + Array.from({length:8},(_,i)=>'<measure number="'+(i+1)+'">'
  + (i===0?'<attributes><divisions>1</divisions><key><fifths>2</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>':'')
  + note('C')+note('D')+note('E')+'</measure>').join('')
 + '</part></score-partwise>';
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1500,height:1000}});
    page.on('pageerror', error => console.error('Browser error:',error.message));
    await page.goto('http://127.0.0.1:8765/tests/phrase-align-browser.html');
    await page.waitForFunction(() => typeof window.phraseAlignBrowserTest === 'function');
    const result = await page.evaluate(xml => window.phraseAlignBrowserTest(xml), xml);
    console.log('First-note alignment coordinates:',JSON.stringify(result));
    console.log('SVG time classes:', await page.evaluate(() => [...document.querySelectorAll('[class*="time"]')].slice(0,30).map(e => ({tag:e.tagName,cls:e.getAttribute('class'),html:e.outerHTML.slice(0,180)}))));
    await page.screenshot({path:'phrase-align-browser.png',fullPage:true});
    assert.equal(result.wrapped.length,0,'Comparison phrases unexpectedly wrapped');
    assert.ok(result.systems.length >= 2,'Expected at least two staff systems');
    assert.ok(result.delta <= 2,'First-note positions differ by '+result.delta.toFixed(2)+'px');
    for(let m=1;m<=4;m++) assert.ok(Math.abs(result.noteXs[m]-result.noteXs[m+4])<=2,
      'Measure '+m+' note is not aligned with measure '+(m+4)+': '+JSON.stringify(result.noteXs));
    assert.ok(result.timeSigns.some(s => s.hidden),'Synthesized time signature should be hidden after layout');
    assert.ok(result.timeSigns.some(s => !s.hidden),'Original time signature must remain visible');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
