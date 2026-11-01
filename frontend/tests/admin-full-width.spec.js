import { test, expect } from '@playwright/test';

const PAGES = [
  ['', 'Tổng quan'],
  ['rooms', 'Duyệt phòng'],
  ['users', 'Người dùng'],
  ['bookings', 'Đơn đặt phòng'],
  ['reviews', 'Đánh giá'],
  ['reports', 'Khiếu nại'],
  ['coupons', 'Mã giảm giá'],
  ['posts', 'Bài viết'],
  ['contacts', 'Liên hệ'],
  ['settings', 'Cài đặt'],
  ['notifications', 'Thông báo'],
  ['profile', 'Tài khoản'],
];

test.use({ viewport: { width: 1920, height: 1000 } });

test('các trang admin tràn hết chiều rộng vùng nội dung', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('ban@email.com').fill('admin@homestaygo.vn');
  await page.getByPlaceholder('Nhập mật khẩu').fill('123456');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));

  for (const [index, [path, label]] of PAGES.entries()) {
    await page.goto(`/admin/${path}`);
    await expect(page.locator('header h1')).toHaveText(label);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const main = page.locator('main');
    const mainBox = await main.boundingBox();
    const contentBox = await main.locator(':scope > *').first().boundingBox();
    expect(contentBox.width).toBeGreaterThan(mainBox.width - 80);
    await page.screenshot({ path: `screenshots/96-admin-full-${String(index + 1).padStart(2, '0')}.png`, fullPage: true });
  }
});
