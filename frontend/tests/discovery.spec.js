import fs from 'fs';
import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.PW_BASE_URL || 'http://localhost:5173' });

async function loginByApi(page, email) {
  const res = await page.request.post('/api/auth/login', { data: { email, password: '123456' } });
  const body = await res.json();
  const token = body.data?.token;
  expect(token).toBeTruthy();
  await page.addInitScript((value) => localStorage.setItem('hg_token', value), token);
}

async function firstRoom(page) {
  const res = await page.request.get('/api/rooms/map');
  const body = await res.json();
  return body.data;
}

test('danh sách phòng chuyển sang chế độ bản đồ', async ({ page }) => {
  await page.goto('/rooms');
  await page.getByRole('button', { name: 'Bản đồ' }).click();
  await expect(page).toHaveURL(/view=map/);
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible();
  await page.waitForTimeout(1500);
  await page.locator('.leaflet-marker-icon').first().click();
  await expect(page.locator('.leaflet-popup').getByText('Xem chi tiết')).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/40-ban-do-phong.png', fullPage: true });
});

test('so sánh phòng từ thẻ phòng', async ({ page }) => {
  await page.goto('/rooms');
  const compareButtons = page.getByRole('button', { name: 'So sánh', exact: true });
  await compareButtons.nth(0).click();
  await compareButtons.nth(0).click();
  await compareButtons.nth(0).click();
  await expect(page.getByText('So sánh (3/3)')).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/41-thanh-so-sanh.png', fullPage: false });
  await page.getByRole('link', { name: 'So sánh ngay' }).click();
  await expect(page.getByRole('heading', { name: 'So sánh phòng' })).toBeVisible();
  await expect(page.getByText('Giá mỗi đêm')).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/42-so-sanh-phong.png', fullPage: true });
});

test('chi tiết phòng: phân bố sao, lọc đánh giá, phòng tương tự, đã xem gần đây', async ({ page }) => {
  const rooms = await firstRoom(page);
  let target = null;
  for (const room of rooms) {
    const res = await page.request.get(`/api/rooms/${room._id}/reviews`);
    const body = await res.json();
    const total = Object.values(body.data.ratingBreakdown).reduce((a, b) => a + b, 0);
    if (total >= 2) {
      target = { room, breakdown: body.data.ratingBreakdown };
      break;
    }
  }
  expect(target).toBeTruthy();
  await page.goto(`/rooms/${target.room.slug}`);
  await expect(page.getByRole('heading', { name: 'Đánh giá của khách' })).toBeVisible();
  await expect(page.getByText('Lọc theo:')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Phòng tương tự' })).toBeVisible();
  const star = Number(Object.entries(target.breakdown).find(([, count]) => count > 0)[0]);
  await page.getByRole('button', { name: `${star} sao (`, exact: false }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/43-chi-tiet-danh-gia-loc-sao.png', fullPage: true });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Đã xem gần đây' })).toBeVisible();
  await page.getByRole('heading', { name: 'Đã xem gần đây' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/44-da-xem-gan-day.png', fullPage: true });
});

test('trang hồ sơ chủ nhà từ chi tiết phòng', async ({ page }) => {
  const rooms = await firstRoom(page);
  await page.goto(`/rooms/${rooms[0].slug}`);
  const hostLink = page.locator('a[href^="/hosts/"]').filter({ hasText: /\S/ }).first();
  await hostLink.click();
  await expect(page).toHaveURL(/\/hosts\//);
  await expect(page.getByText('Phòng đang cho thuê')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Khách nói gì' })).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/45-ho-so-chu-nha.png', fullPage: true });
});

test('owner xuất CSV đơn đặt phòng', async ({ page }) => {
  await loginByApi(page, 'owner1@homestaygo.vn');
  await page.goto('/owner/bookings');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất CSV' }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  const buffer = fs.readFileSync(filePath);
  expect(buffer.subarray(0, 3).toString('hex')).toBe('efbbbf');
  const text = buffer.toString('utf8');
  expect(text).toContain('Mã đơn,Phòng');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/46-owner-xuat-csv.png', fullPage: true });
});

test('admin xuất CSV đơn và người dùng', async ({ page }) => {
  await loginByApi(page, 'admin@homestaygo.vn');
  await page.goto('/admin/bookings');
  let downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất CSV' }).click();
  let download = await downloadPromise;
  let text = fs.readFileSync(await download.path(), 'utf8');
  expect(text.charCodeAt(0)).toBe(0xfeff);
  expect(text.split('\r\n').length).toBeGreaterThan(20);
  await page.screenshot({ path: 'screenshots/47-admin-don-xuat-csv.png', fullPage: true });
  await page.goto('/admin/users');
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất CSV' }).click();
  download = await downloadPromise;
  text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('Họ tên,Email,Số điện thoại,Vai trò');
  expect(text).toContain('Quản trị viên');
  await page.screenshot({ path: 'screenshots/48-admin-nguoi-dung-xuat-csv.png', fullPage: true });
});
