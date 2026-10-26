// 렌더·검산 경고·오류·인쇄 PDF·HTML 저장·모바일 가로 넘침을 확인한다.
// 사용: node tests/smoke.cjs [URL]  (기본: public/index.html 파일)
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const url = process.argv[2] || 'file://' + path.join(root, 'public/index.html');
const fx = name => path.join(root, 'tests/fixtures', name);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);

  await page.click('#demo');
  assert.equal(await page.locator('.sheet').count(), 1);
  await page.locator('.caption button').click();
  assert.equal(await page.locator('.sheet').count(), 0);

  await page.setInputFiles('#pick', ['a_basic.xml', 'b_amend_broker_mismatch.xml', 'c_taxfree_euckr_rrn.xml', 'd_not_invoice.xml'].map(fx));
  await page.waitForSelector('.sheet');
  assert.equal(await page.locator('.sheet').count(), 3);
  assert.match(await page.locator('#errors').innerText(), /d_not_invoice\.xml/);
  assert.deepEqual(
    (await page.locator('.title').allInnerTexts()).map(t => t.replace(/\s+/g, ' ')),
    ['전자세금계산서', '수정전자세금계산서 (영세율)', '전자계산서']
  );
  const warns = await page.locator('.warn').allInnerTexts();
  assert.ok(warns.some(w => w.includes('공급가액')), 'mismatch warning');
  const third = page.locator('.sheet').nth(2);
  assert.ok((await third.innerText()).includes('900101-*******'), 'masked resident number');
  assert.ok((await third.innerText()).includes('예시상사(주)'), 'EUC-KR decoded');
  assert.ok((await page.locator('.sheet').nth(1).innerText()).includes('수탁예시'), 'broker shown');

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#save')]);
  assert.match(download.suggestedFilename(), /\.html$/);

  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert.equal(pages, 3, 'one A4 page per invoice');
  await page.emulateMedia({ media: 'screen' });

  for (const width of [320, 375, 414]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `no overflow at ${width}`);
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('ok', url);
})().catch(e => { console.error(e); process.exit(1); });
