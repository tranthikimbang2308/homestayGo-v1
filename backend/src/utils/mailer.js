const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SKIPPED_DOMAINS = ['@homestaygo.vn'];

const escapeHtml = (text = '') =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const mailLayout = (title, bodyHtml = '') => `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F5F6F5;font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif;color:#1E1E1C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E3E5E3;border-radius:12px;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #E3E5E3;font-size:18px;font-weight:700;color:#1F5F4A;">HomestayGo</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#1E1E1C;">${escapeHtml(title)}</h1>
          <div style="font-size:15px;line-height:1.6;color:#1E1E1C;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E3E5E3;font-size:12px;line-height:1.5;color:#6B6B66;">Email tự động từ HomestayGo. Vui lòng không trả lời trực tiếp email này nếu không cần thiết.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const mailButton = (href, label) =>
  `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#1F5F4A;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">${escapeHtml(label)}</a></p>`;

const normalizeRecipients = (to) => (Array.isArray(to) ? to : [to]).map((item) => String(item || '').trim().toLowerCase()).filter(Boolean);

const isSkipped = (email) => SKIPPED_DOMAINS.some((domain) => email.endsWith(domain));

export const sendMail = async ({ to, subject, html, replyTo } = {}) => {
  try {
    const recipients = normalizeRecipients(to).filter((email) => !isSkipped(email));
    if (!recipients.length) return { skipped: true, reason: 'no_recipient' };
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[mailer] Chưa cấu hình RESEND_API_KEY, bỏ qua gửi mail');
      return { skipped: true, reason: 'no_api_key' };
    }
    const fromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@axisdev.vn';
    const fromName = process.env.MAIL_FROM_NAME || 'HomestayGo';
    const body = {
      from: `${fromName} <${fromAddress}>`,
      to: recipients,
      subject: subject || 'Thông báo từ HomestayGo',
      html: html || mailLayout(subject || 'Thông báo từ HomestayGo', ''),
    };
    if (replyTo) body.reply_to = replyTo;
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[mailer] Resend trả lỗi:', response.status, result?.message || result);
      return { success: false, error: result?.message || `HTTP ${response.status}` };
    }
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[mailer] Lỗi gửi mail:', error.message);
    return { success: false, error: error.message };
  }
};

export { escapeHtml };
