import { test, expect } from '@playwright/test';

const pages = [
  { name: '01-trang-chu', path: '/', text: 'Ngủ trong nhà người địa phương' },
  { name: '02-danh-sach-phong', path: '/rooms', text: 'Bộ lọc' },
  { name: '03-dang-nhap', path: '/login', text: 'Đăng nhập' },
  { name: '04-dang-ky', path: '/register?role=owner', text: 'Tạo tài khoản' },
  { name: '05-khong-tim-thay', path: '/khong-ton-tai', text: 'Lạc đường rồi' },
];

for (const item of pages) {
  test(`trang ${item.name}`, async ({ page }) => {
    await page.goto(item.path);
    await expect(page.getByText(item.text).first()).toBeVisible();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `screenshots/${item.name}.png`, fullPage: true });
  });
}

test('trang chủ trên điện thoại', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Tìm phòng' })).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/06-trang-chu-mobile.png', fullPage: true });
});
