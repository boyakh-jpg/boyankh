import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.BOXTIER_URL || 'https://platunumball.vercel.app';
const outDir = path.resolve('boxtier-live-captures');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});
const page = await context.newPage();
page.setDefaultTimeout(30000);

const log = [];
const safeName = (value) => String(value).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '');

async function settle(ms = 2500) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function capture(name, fullPage = false) {
  const file = path.join(outDir, `${safeName(name)}.png`);
  await page.screenshot({ path: file, fullPage, animations: 'disabled' });
  const title = await page.title().catch(() => '');
  const url = page.url();
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  log.push({ name, file: path.basename(file), url, title, h1: String(h1 || '').trim() });
  console.log(`captured ${name}: ${url}`);
}

async function gotoRoute(route, name, selector = 'body', fullPage = false) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  await settle();
  await capture(name, fullPage);
}

// 실제 로그인 화면
await gotoRoute('/login', '01-login', '.auth-card');

// Google OAuth 대신 테스트 계정 사용
const testSelect = page.locator('.auth-test-login select');
if (await testSelect.count()) {
  await testSelect.selectOption('rankball-001').catch(() => {});
}
const testButton = page.locator('.provider-test');
if (!(await testButton.count())) {
  throw new Error('테스트 계정 로그인 버튼을 찾지 못함');
}
await testButton.click();
await page.waitForURL((url) => url.pathname.startsWith('/app'), { timeout: 60000 }).catch(() => {});
await settle(4500);

if (page.url().includes('/app/signup')) {
  throw new Error(`테스트 계정이 가입 설정 화면으로 이동함: ${page.url()}`);
}

await capture('02-home');

const routes = [
  ['/app/matches', '03-schedule', '.page-stack'],
  ['/app/recruiting', '04-match-queue', '.arena-recruit-page'],
  ['/app/create', '05-create-match', '.page-stack'],
  ['/app/create?intent=record', '06-create-record', '.page-stack'],
  ['/app/recorder', '07-play-recorder', '.recorder-page'],
  ['/app/teams', '08-teams', '.page-stack'],
  ['/app/profile', '09-profile', '.page-stack'],
  ['/app/profile/records', '10-profile-records', '.page-stack'],
  ['/app/rankings', '11-rankings', '.page-stack'],
  ['/app/settings', '12-settings', '.page-stack'],
  ['/app/settings/courts', '13-settings-courts', '.page-stack'],
  ['/app/referee-rulebook', '14-referee-rulebook', 'body'],
  ['/app/notifications', '15-notifications', '.page-stack'],
  ['/app/admin', '16-admin', 'body'],
];

for (const [route, name, selector] of routes) {
  await gotoRoute(route, name, selector);
}

// 대기 매칭 목록에서 실제 방 상세 모달 열기
await page.goto(`${baseUrl}/app/recruiting`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await settle(3500);
let cards = page.locator('.match-list-card');
if ((await cards.count()) === 0) {
  const activeStart = page.locator('.arena-start-date-filter button.active').first();
  if (await activeStart.count()) {
    await activeStart.click().catch(() => {});
    await settle(3500);
  }
}
cards = page.locator('.match-list-card');
if (await cards.count()) {
  await cards.first().click();
  await page.locator('.arena-lobby-modal, .arena-room-modal').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  await settle(2500);
  await capture('17-match-room-modal');
}

// 일정 목록에서 실제 경기방 모달 열기
await page.goto(`${baseUrl}/app/matches`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await settle(3000);
const matchCards = page.locator('.match-list-card');
if (await matchCards.count()) {
  await matchCards.first().click();
  await page.locator('.arena-lobby-modal, .arena-room-modal').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  await settle(2500);
  await capture('18-schedule-room-modal');
}

// 팀 상세 화면
await page.goto(`${baseUrl}/app/teams`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await settle(3000);
const teamLink = page.locator('a[href^="/app/teams/"]').first();
if (await teamLink.count()) {
  await teamLink.click();
  await settle(3000);
  await capture('19-team-detail');
}

// 모바일 실제 화면
await page.setViewportSize({ width: 390, height: 844 });
for (const [route, name, selector] of [
  ['/app', '20-mobile-home', 'body'],
  ['/app/recruiting', '21-mobile-match-queue', 'body'],
  ['/app/matches', '22-mobile-schedule', 'body'],
  ['/app/profile', '23-mobile-profile', 'body'],
]) {
  await gotoRoute(route, name, selector);
}

await fs.writeFile(path.join(outDir, 'capture-log.json'), JSON.stringify(log, null, 2), 'utf8');
await browser.close();
