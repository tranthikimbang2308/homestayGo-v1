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
  await page.waitForTimeout(800);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test('trang ưu đãi hiển thị mã công khai', async ({ page }) => {
  await page.goto('/promotions');
  await expect(page.getByText('CHAOHE10').first()).toBeVisible();
  await shot(page, '90-uu-dai');
});

test('khách áp mã giảm giá, đặt phòng và xem hóa đơn', async ({ page, request }) => {
  const res = await request.get(`${API}/rooms?limit=1&sort=price_desc`);
  const room = (await res.json()).data[0];
  await login(page, 'customer5@homestaygo.vn');
  const offset = 120 + Math.floor(Math.random() * 60);
  await page.goto(`/booking/${room._id}?checkIn=${futureDate(offset)}&checkOut=${futureDate(offset + 3)}&guests=2`);
  await page.getByText('Thanh toán tại homestay').click();
  await expect(page.getByText('Tổng cộng').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('Nhập mã giảm giá').fill('CHAOHE10');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText(/Giảm giá|CHAOHE10/).nth(1)).toBeVisible();
  await shot(page, '91-dat-phong-ap-ma');
  await page.getByRole('button', { name: 'Xác nhận đặt phòng' }).click();
  await page.waitForURL(/\/account\/bookings\//);
  await expect(page.getByText('CHAOHE10').first()).toBeVisible();
  await page.getByText('Xem hóa đơn').click();
  await page.waitForURL(/invoice/);
  await expect(page.getByRole('button', { name: 'In hóa đơn' })).toBeVisible();
  await shot(page, '92-hoa-don');
});

test('chủ phòng: lịch phòng và mã giảm giá', async ({ page }) => {
  await login(page, 'owner1@homestaygo.vn');
  await page.goto('/owner/calendar');
  await page.waitForLoadState('networkidle');
  await shot(page, '93-owner-lich-phong');
  await page.goto('/owner/coupons');
  await page.waitForLoadState('networkidle');
  await shot(page, '94-owner-ma-giam-gia');
});

test('admin: mã giảm giá hệ thống', async ({ page }) => {
  await login(page, 'admin@homestaygo.vn');
  await page.goto('/admin/coupons');
  await expect(page.getByText('CHAOHE10').first()).toBeVisible();
  await shot(page, '95-admin-ma-giam-gia');
});
