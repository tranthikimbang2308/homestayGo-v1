import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api';

async function login(page, email) {
  await page.goto('/login');
  await page.getByPlaceholder('ban@email.com').fill(email);
  await page.getByPlaceholder('Nhập mật khẩu').fill('123456');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

async function shot(page, name) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function firstRoom(request) {
  const res = await request.get(`${API}/rooms?limit=1&sort=rating`);
  const body = await res.json();
  return body.data[0];
}

test.describe('Khách vãng lai', () => {
  test('trang chủ có thành phố và phòng nổi bật', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href^="/rooms/"]').first()).toBeVisible();
    await shot(page, '10-trang-chu-du-lieu');
  });

  test('tìm kiếm và lọc theo thành phố', async ({ page }) => {
    await page.goto('/rooms?city=' + encodeURIComponent('Đà Lạt'));
    await expect(page.locator('a[href^="/rooms/"]').first()).toBeVisible();
    await expect(page.locator('main a[href^="/rooms/"]').filter({ hasText: 'Đà Lạt' }).first()).toBeVisible();
    await shot(page, '11-loc-da-lat');
  });

  test('chi tiết phòng có bản đồ và đánh giá', async ({ page, request }) => {
    const room = await firstRoom(request);
    await page.goto(`/rooms/${room.slug}`);
    await expect(page.getByText(room.title).first()).toBeVisible();
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
    await shot(page, '12-chi-tiet-phong');
  });
});

test.describe('Khách hàng', () => {
  test('đặt phòng thanh toán tại homestay', async ({ page, request }) => {
    const room = await firstRoom(request);
    await login(page, 'customer3@homestaygo.vn');
    const offset = 200 + Math.floor(Math.random() * 100);
    await page.goto(`/booking/${room._id}?checkIn=${futureDate(offset)}&checkOut=${futureDate(offset + 2)}&guests=2`);
    await expect(page.getByText('Xác nhận và thanh toán')).toBeVisible();
    await page.getByText('Thanh toán tại homestay').click();
    await shot(page, '13-trang-dat-phong');
    await page.getByRole('button', { name: 'Xác nhận đặt phòng' }).click();
    await expect(page.getByText('Đặt phòng thành công').first()).toBeVisible();
    await page.waitForURL(/\/account\/bookings\//);
    await expect(page.getByText('Chờ xác nhận').first()).toBeVisible();
    await shot(page, '14-chi-tiet-don-moi');
  });

  test('đặt phòng VNPay chuyển sang cổng sandbox', async ({ page, request }) => {
    const room = await firstRoom(request);
    await login(page, 'customer4@homestaygo.vn');
    const offset = 320 + Math.floor(Math.random() * 30);
    await page.goto(`/booking/${room._id}?checkIn=${futureDate(offset)}&checkOut=${futureDate(offset + 1)}&guests=1`);
    await page.getByRole('button', { name: 'Thanh toán qua VNPay' }).click();
    await page.waitForURL(/sandbox\.vnpayment\.vn/, { timeout: 20000 });
    expect(page.url()).not.toContain('Error');
  });

  test('đơn của tôi, yêu thích, hồ sơ', async ({ page }) => {
    await login(page, 'customer1@homestaygo.vn');
    await page.goto('/account/bookings');
    await expect(page.getByText(/HG[A-Z0-9]{8}/).first()).toBeVisible();
    await shot(page, '15-don-cua-toi');
    await page.goto('/account/favorites');
    await expect(page.locator('a[href^="/rooms/"]').first()).toBeVisible();
    await shot(page, '16-yeu-thich');
    await page.goto('/account/profile');
    await expect(page.getByText('Phạm Quốc Bảo').first()).toBeVisible();
    await shot(page, '17-ho-so');
  });
});

test.describe('Chủ phòng', () => {
  test('các trang quản lý', async ({ page }) => {
    await login(page, 'owner1@homestaygo.vn');
    await expect(page).toHaveURL(/\/owner/);
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    await shot(page, '20-owner-tong-quan');
    await page.goto('/owner/rooms');
    await shot(page, '21-owner-phong');
    await page.goto('/owner/rooms/new');
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
    await shot(page, '22-owner-them-phong');
    await page.goto('/owner/bookings');
    await expect(page.getByText(/HG[A-Z0-9]{8}/).first()).toBeVisible();
    await shot(page, '23-owner-don');
    await page.goto('/owner/reviews');
    await shot(page, '24-owner-danh-gia');
  });
});

test.describe('Admin', () => {
  test('các trang quản trị', async ({ page }) => {
    await login(page, 'admin@homestaygo.vn');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    await shot(page, '30-admin-tong-quan');
    await page.goto('/admin/rooms');
    await shot(page, '31-admin-duyet-phong');
    await page.goto('/admin/users');
    await expect(page.getByText('customer1@homestaygo.vn').first()).toBeVisible();
    await shot(page, '32-admin-nguoi-dung');
    await page.goto('/admin/bookings');
    await expect(page.getByText(/HG[A-Z0-9]{8}/).first()).toBeVisible();
    await shot(page, '33-admin-don');
  });
});
