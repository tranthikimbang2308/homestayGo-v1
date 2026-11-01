import { test, expect } from '@playwright/test';

const BASE_URL = process.env.B_BASE_URL || 'http://localhost:5173';
const SHOT_DIR = 'screenshots';

test.use({ baseURL: BASE_URL });

const login = async (page, email, password = '123456') => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
};

test('Trang đăng nhập có link quên mật khẩu', async ({ page }) => {
  await page.goto('/login');
  const link = page.getByRole('link', { name: 'Quên mật khẩu?' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole('heading', { name: 'Quên mật khẩu' })).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/50-quen-mat-khau.png`, fullPage: true });
  await page.getByLabel('Email').fill('customer3@homestaygo.vn');
  await page.getByRole('button', { name: 'Gửi liên kết đặt lại' }).click();
  await expect(page.getByText('Đã gửi yêu cầu')).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/51-quen-mat-khau-da-gui.png`, fullPage: true });
});

test('Trang đặt lại mật khẩu báo lỗi token sai', async ({ page }) => {
  await page.goto('/reset-password/token-khong-hop-le');
  await expect(page.getByRole('heading', { name: 'Đặt lại mật khẩu' })).toBeVisible();
  await page.locator('#reset-password').fill('matkhau123');
  await page.locator('#reset-confirm').fill('matkhau123');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByText('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/52-dat-lai-mat-khau.png`, fullPage: true });
});

test('Khách hàng: chuông thông báo, trang thông báo và tin nhắn', async ({ page }) => {
  await login(page, 'customer1@homestaygo.vn');
  const bell = page.getByRole('button', { name: /^Thông báo/ });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(page.getByRole('link', { name: 'Xem tất cả', exact: true })).toBeVisible();
  await expect(page.getByText('Chào mừng bạn đến với HomestayGo')).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/53-chuong-thong-bao.png`, fullPage: false });
  await page.getByRole('link', { name: 'Xem tất cả', exact: true }).click();
  await expect(page).toHaveURL(/\/account\/notifications$/);
  await expect(page.getByRole('heading', { name: 'Thông báo', exact: true })).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/54-khach-thong-bao.png`, fullPage: true });

  await page.goto('/account/messages');
  await expect(page.getByRole('heading', { name: 'Tin nhắn' })).toBeVisible();
  await page.getByText('Trần Thị Thu Hà').first().click();
  await expect(page).toHaveURL(/\?c=/);
  await expect(page.getByText('cao lầu', { exact: false })).toBeVisible();
  const text = `Cảm ơn chị, em sẽ đến lúc 14h ${Date.now()}`;
  await page.getByPlaceholder('Nhập tin nhắn, Enter để gửi').fill(text);
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await expect(page.getByText(text)).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/55-khach-tin-nhan.png`, fullPage: true });
});

test('Khách hàng: nút nhắn tin trên trang chi tiết phòng mở hội thoại', async ({ page }) => {
  await login(page, 'customer4@homestaygo.vn');
  await page.goto('/rooms');
  await page.locator('a[href^="/rooms/"]').first().click();
  await page.waitForURL(/\/rooms\/.+/);
  const button = page.getByRole('button', { name: 'Nhắn tin cho chủ phòng' });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await expect(page).toHaveURL(/\/account\/messages\?c=/);
  await expect(page.getByText('Hãy gửi lời chào để bắt đầu cuộc trò chuyện')).toBeVisible();
});

test('Chủ phòng: tin nhắn và thông báo trong dashboard', async ({ page }) => {
  await login(page, 'owner1@homestaygo.vn');
  await page.goto('/owner/messages');
  await expect(page.getByText('Phạm Quốc Bảo').first()).toBeVisible();
  await page.getByText('Phạm Quốc Bảo').first().click();
  await expect(page.getByText('chỗ đậu ô tô', { exact: false })).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/56-owner-tin-nhan.png`, fullPage: true });
  await page.goto('/owner/notifications');
  await expect(page.getByRole('heading', { name: 'Thông báo', exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: /^Chưa đọc/ }).click();
  await page.screenshot({ path: `${SHOT_DIR}/57-owner-thong-bao.png`, fullPage: true });
});

test('Admin: trang thông báo', async ({ page }) => {
  await login(page, 'admin@homestaygo.vn');
  await page.goto('/admin/notifications');
  await expect(page.getByText('Có phòng mới chờ duyệt')).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/58-admin-thong-bao.png`, fullPage: true });
});

test('Mobile: tin nhắn chuyển một cột', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'owner1@homestaygo.vn');
  await page.goto('/owner/messages');
  await expect(page.getByPlaceholder('Tìm hội thoại')).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/59-mobile-danh-sach-hoi-thoai.png`, fullPage: true });
  await page.getByText('Võ Ngọc Anh').first().click();
  await expect(page.getByPlaceholder('Tìm hội thoại')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Quay lại danh sách' })).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/60-mobile-khung-chat.png`, fullPage: true });
});
