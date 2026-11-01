import { test, expect } from '@playwright/test';

const BASE_URL = process.env.C_BASE_URL || 'http://localhost:5173';
const SHOT_DIR = 'screenshots';

test.use({ baseURL: BASE_URL });

const login = async (page, email, password = '123456') => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
};

const shot = (page, name) => page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });

test('Trang chủ có mục Cẩm nang và chân trang mới', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Đọc trước khi lên đường' })).toBeVisible();
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'Câu hỏi thường gặp' })).toBeVisible();
  await expect(footer.getByText('1900 6868')).toBeVisible();
  await page.locator('section', { hasText: 'Đọc trước khi lên đường' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await shot(page, '70-trang-chu-cam-nang-footer');
});

test('Cẩm nang: danh sách, lọc danh mục và chi tiết bài viết', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { name: 'Đi đâu, ở đâu, ăn gì' })).toBeVisible();
  await expect(page.getByText('Đọc bài viết')).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, '71-cam-nang-danh-sach');
  await page.getByRole('button', { name: 'Ẩm thực', exact: true }).click();
  await expect(page).toHaveURL(/category=am-thuc/);
  await expect(page.getByRole('heading', { name: /Hà Nội|Sài Gòn/ }).first()).toBeVisible();
  await page.getByRole('link', { name: /Ăn sáng kiểu Hà Nội/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Ăn sáng kiểu Hà Nội/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Phở bò và phở gà' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bài viết liên quan' })).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, '72-cam-nang-chi-tiet');
});

test('Liên hệ: hiển thị thông tin và gửi form', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: 'Chúng tôi luôn sẵn lòng lắng nghe' })).toBeVisible();
  await expect(page.locator('main').getByText('hotro@homestaygo.vn')).toBeVisible();
  await page.getByRole('button', { name: 'Gửi liên hệ' }).click();
  await expect(page.getByText('Vui lòng nhập họ tên')).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, '73-lien-he-form');
  await page.getByLabel('Họ và tên').fill('Khách kiểm thử Playwright');
  await page.getByLabel('Email').fill('playwright@homestaygo.vn');
  await page.getByLabel('Nội dung').fill('Mình muốn hỏi về chính sách hủy phòng khi trời mưa bão.');
  await page.getByRole('button', { name: 'Gửi liên hệ' }).click();
  await expect(page.getByRole('heading', { name: 'Đã nhận được liên hệ của bạn' })).toBeVisible();
  await shot(page, '74-lien-he-da-gui');
});

test('FAQ và Về chúng tôi', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: 'Câu hỏi thường gặp' })).toBeVisible();
  await page.getByRole('button', { name: 'Hủy phòng và hoàn tiền' }).click();
  await page.getByRole('button', { name: 'Tôi có thể hủy đơn không?' }).click();
  await expect(page.getByText(/trước ngày nhận phòng, trong mục Đơn đặt phòng/)).toBeVisible();
  await shot(page, '75-faq');
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: /Kết nối du khách/ })).toBeVisible();
  await expect(page.getByText('Homestay đang hoạt động')).toBeVisible();
  await expect(page.getByText('13', { exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, '76-ve-chung-toi');
});

test('Khách hàng báo cáo phòng', async ({ page }) => {
  await login(page, 'customer2@homestaygo.vn');
  await page.goto('/rooms');
  await page.locator('a[href^="/rooms/"]').first().click();
  await page.getByRole('button', { name: 'Báo cáo' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Báo cáo phòng')).toBeVisible();
  await dialog.getByRole('button', { name: 'Gửi báo cáo' }).click();
  await expect(dialog.getByText('Vui lòng chọn lý do báo cáo')).toBeVisible();
  await dialog.getByText('Vệ sinh kém').click();
  await dialog.getByRole('textbox', { name: 'Mô tả chi tiết' }).fill('Ga giường có vết bẩn, phòng tắm chưa được lau dọn khi nhận phòng.');
  await page.screenshot({ path: `${SHOT_DIR}/77-bao-cao-phong.png` });
  await dialog.getByRole('button', { name: 'Gửi báo cáo' }).click();
  await expect(page.getByText(/Đã gửi báo cáo|đang chờ xử lý/)).toBeVisible();
});

test('Admin: bài viết, liên hệ, khiếu nại, đánh giá, cài đặt', async ({ page }) => {
  await login(page, 'admin@homestaygo.vn');

  await page.goto('/admin/posts');
  await expect(page.getByRole('heading', { name: 'Bài viết cẩm nang' })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Đà Lạt 3 ngày 2 đêm/ })).toBeVisible();
  await page.waitForTimeout(600);
  await shot(page, '78-admin-bai-viet');

  await page.getByRole('link', { name: 'Viết bài mới' }).first().click();
  await expect(page.getByRole('heading', { name: 'Viết bài mới' })).toBeVisible();
  await page.getByLabel('Tiêu đề').fill('Bài kiểm thử Playwright');
  await page.getByLabel('Nội dung').fill('Đoạn mở đầu của bài viết kiểm thử, đủ dài để vượt qua kiểm tra năm mươi ký tự.\n\n## Mục thứ nhất\n\n- Ý một\n- Ý hai');
  await page.getByRole('button', { name: 'Xem trước' }).click();
  await expect(page.getByRole('heading', { name: 'Mục thứ nhất' })).toBeVisible();
  await shot(page, '79-admin-viet-bai-xem-truoc');
  await page.getByRole('button', { name: 'Đăng bài' }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/);
  await expect(page.getByRole('cell', { name: /Bài kiểm thử Playwright/ })).toBeVisible();
  await page.getByRole('row', { name: /Bài kiểm thử Playwright/ }).getByRole('button', { name: 'Xóa bài viết' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa bài viết' }).click();
  await expect(page.getByRole('cell', { name: /Bài kiểm thử Playwright/ })).toHaveCount(0);

  await page.goto('/admin/contacts');
  await expect(page.getByRole('heading', { name: 'Hộp thư liên hệ' })).toBeVisible();
  await expect(page.getByText('Khách kiểm thử Playwright')).toBeVisible();
  await shot(page, '80-admin-lien-he');
  await page.getByText('Khách kiểm thử Playwright').click();
  const contactDialog = page.getByRole('dialog');
  await contactDialog.getByLabel('Nội dung trả lời').fill('Chào bạn, đơn hủy trước ngày nhận phòng được hoàn tiền đầy đủ.');
  await page.screenshot({ path: `${SHOT_DIR}/81-admin-tra-loi-lien-he.png` });
  await contactDialog.getByRole('button', { name: 'Gửi trả lời' }).click();
  await expect(contactDialog.getByText(/Đã trả lời/).first()).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/admin/reports');
  await expect(page.getByRole('heading', { name: 'Khiếu nại phòng' })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Vệ sinh kém/ }).first()).toBeVisible();
  await shot(page, '82-admin-khieu-nai');
  await page.getByRole('button', { name: 'Xử lý', exact: true }).first().click();
  const reportDialog = page.getByRole('dialog');
  await expect(reportDialog.getByText('Ẩn phòng khỏi hệ thống')).toBeVisible();
  await reportDialog.getByLabel(/Ghi chú gửi người báo cáo/).fill('Đã nhắc nhở chủ phòng cải thiện vệ sinh.');
  await page.screenshot({ path: `${SHOT_DIR}/83-admin-xu-ly-khieu-nai.png` });
  await reportDialog.getByRole('button', { name: 'Xác nhận đã xử lý' }).click();
  await expect(page.getByText('Đã cập nhật báo cáo')).toBeVisible();

  await page.goto('/admin/reviews');
  await expect(page.getByRole('heading', { name: 'Kiểm duyệt đánh giá' })).toBeVisible();
  await page.getByRole('button', { name: 'Đã ẩn', exact: true }).click();
  await expect(page.getByText(/Đã ẩn lúc/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
  await page.waitForTimeout(600);
  await shot(page, '84-admin-kiem-duyet-danh-gia');

  await page.goto('/admin/settings');
  await expect(page.getByRole('heading', { name: 'Cài đặt hệ thống' })).toBeVisible();
  await page.getByLabel('Phí dịch vụ (%)').fill('6');
  await expect(page.getByText('Phí dịch vụ 6%')).toBeVisible();
  await shot(page, '85-admin-cai-dat');
  await page.getByRole('button', { name: 'Lưu cài đặt' }).click();
  await expect(page.getByText('Đã lưu cài đặt hệ thống')).toBeVisible();
  await page.getByLabel('Phí dịch vụ (%)').fill('5');
  await page.getByRole('button', { name: 'Lưu cài đặt' }).click();
  await expect(page.getByText('Đã lưu cài đặt hệ thống').first()).toBeVisible();
});

test('Giao diện di động: cẩm nang và chân trang', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog');
  await expect(page.getByRole('heading', { name: 'Đi đâu, ở đâu, ăn gì' })).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, '86-mobile-cam-nang');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});
