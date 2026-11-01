import { test, expect } from '@playwright/test';

test('trang đăng nhập không còn khối tài khoản dùng thử', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  await expect(page.getByText('Chưa có tài khoản?')).toBeVisible();
  await expect(page.getByText('Tài khoản dùng thử')).toHaveCount(0);
  await expect(page.getByText('customer1@homestaygo.vn')).toHaveCount(0);
  await page.screenshot({ path: 'screenshots/97-dang-nhap-khong-tai-khoan-thu.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'screenshots/98-dang-nhap-mobile.png', fullPage: true });
});
