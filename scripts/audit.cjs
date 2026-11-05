const {spawn} = require('node:child_process');
const fs = require('node:fs');
(async () => {
  let server, chrome;
  const url = process.env.AUDIT_URL || 'http://127.0.0.1:8002/';
  try {
    if (!process.env.AUDIT_URL) {
      server = spawn('python3', ['scripts/serve.py', '--port', '8002'], {stdio: 'inherit'});
      for (let attempt = 0; ; attempt++) {
        try {const response = await fetch(url); if (response.ok) break;} catch {}
        if (attempt >= 50) throw Error('Audit server did not start');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    const {launch} = await import('chrome-launcher');
    const {default: lighthouse} = await import('lighthouse');
    chrome = await launch({chromePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', chromeFlags: ['--headless', '--no-sandbox']});
    const result = await lighthouse(url, {port: chrome.port, output: ['json', 'html'],
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], logLevel: 'error'});
    if (result.lhr.runtimeError) throw Error(result.lhr.runtimeError.message);
    fs.mkdirSync('artifacts', {recursive: true});
    fs.writeFileSync('artifacts/lighthouse.json', result.report[0]);
    fs.writeFileSync('artifacts/lighthouse.html', result.report[1]);
    console.log(Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])));
    for (const key of ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift']) {
      console.log(key + ': ' + result.lhr.audits[key].displayValue);
    }
  } finally {if (chrome) await chrome.kill(); if (server) server.kill();}
})().catch(error => {console.error(error); process.exitCode = 1;});
