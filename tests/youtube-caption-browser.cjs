const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test, before, after} = require('node:test');
const {chromium} = require('playwright');
const {execFileSync} = require('node:child_process');
const sources = process.env.CUPITOR_BASELINE ? ['20-caption-sidebar.js', '26-youtube-split-layout.js', '30-caption-sites.js', '70-caption-capture.js'].map(name =>
  process.env.CUPITOR_BASELINE ? execFileSync('git', ['show', 'origin/gh-pages:db/js/src/' + name], {encoding: 'utf8'}) :
    fs.readFileSync(path.join(__dirname, '../db/js/src', name), 'utf8'))
  : [fs.readFileSync(process.env.CUPITOR_RUNTIME_BUNDLE || path.join(__dirname, '../db/js/snippet.js'), 'utf8')];
let browser;
before(async () => { browser = await chromium.launch({executablePath: process.env.CUPITOR_CHROME_PATH, headless: true, args: ['--no-sandbox']}); });
after(async () => { await browser?.close(); });
for (const [host, viewport] of [['m.youtube.com', {width: 393, height: 852}], ['www.youtube.com', {width: 1280, height: 800}]]) {
  test(`SRT works with Trusted Types enforced on ${host}`, async () => {
    const context = await browser.newContext({viewport});
    try {
      const page = await context.newPage();
      await page.route('**/*', route => route.fulfill({contentType: 'text/html',
        headers: {'Content-Security-Policy': "require-trusted-types-for 'script'; trusted-types 'none'"},
        body: '<!doctype html><html><head></head><body style="margin:0;background:#222;color:white"><div id="movie_player"><video style="height:50vh;width:100%"></video></div><p>Video details</p></body></html>'}));
      await page.goto(`https://${host}/watch?v=abcdefghijk`);
      await page.evaluate(() => {
        window.__downloads = []; window.__captures = [];
        window.YouTubeSubtitles = {postMessage: message => window.__downloads.push(JSON.parse(message))};
        window.CaptionCollector = {postMessage: message => window.__captures.push(JSON.parse(message))};
        window.TranslateRequest = {postMessage: () => {}};
      });
      for (const source of sources) await page.evaluate(source);
      await page.locator('.cup-sub-sidebar').waitFor({state: 'visible'});
      await page.locator('[data-act="split"]').click();
      await page.locator('#cup-youtube-srt-toggle').click();
      await page.locator('.cup-sub-sidebar').waitFor({state: 'visible'});
      await page.locator('[data-act="download"]').click();
      assert.deepEqual(await page.evaluate(() => window.__downloads), [{op: 'download'}]);
      assert.equal(await page.evaluate(() => window.__cupImportYouTubeSubtitles({
        videoId: 'abcdefghijk', lang: 'sv', lines: [{start: 10, end: 12, text: 'Första meningen <img src=x onerror=alert(1)>'}],
      })), true);
      await page.locator('.cup-sub-cue').waitFor();
      assert.equal(await page.locator('.cup-sub-list img').count(), 0);
      await page.locator('[data-act="settings"]').click();
      await page.locator('[data-f="source"]').fill('sv');
      await page.locator('.cup-sub-modal [data-act="save"]').click();
      await page.locator('[data-act="pick"]').click();
      await page.locator('.cup-sub-cue').click();
      await page.locator('[data-act="send"]').click();
      assert.equal(await page.evaluate(() => window.__captures.length), 1);
      if (process.env.CUPITOR_SCREENSHOTS) await page.screenshot({path: path.join(process.env.CUPITOR_SCREENSHOTS, host + '.png')});
      await page.locator('[data-act="clear"]').click();
      assert.equal(await page.locator('.cup-sub-cue').count(), 0);
    } finally { await context.close(); }
  });
}
