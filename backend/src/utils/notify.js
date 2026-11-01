import Notification from '../models/Notification.js';

const buildDoc = (userId, payload = {}) => ({
  user: userId,
  type: payload.type || 'system',
  title: payload.title || 'Thông báo',
  message: payload.message || '',
  link: payload.link || '',
});

export const notify = async (userId, payload = {}) => {
  try {
    if (!userId) return null;
    return await Notification.create(buildDoc(userId?._id || userId, payload));
  } catch (error) {
    console.error('[notify] Lỗi tạo thông báo:', error.message);
    return null;
  }
};

export const notifyMany = async (userIds = [], payload = {}) => {
  try {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean).map((id) => String(id?._id || id)))];
    if (!uniqueIds.length) return [];
    return await Notification.insertMany(uniqueIds.map((id) => buildDoc(id, payload)));
  } catch (error) {
    console.error('[notify] Lỗi tạo nhiều thông báo:', error.message);
    return [];
  }
};
