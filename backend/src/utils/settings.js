import Setting, { DEFAULT_SETTINGS } from '../models/Setting.js';

const CACHE_TTL_MS = 60 * 1000;
let cached = null;
let cachedAt = 0;

export const clearSettingsCache = () => {
  cached = null;
  cachedAt = 0;
};

export const getSettings = async () => {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;
  try {
    let doc = await Setting.findOne().sort({ createdAt: 1 });
    if (!doc) doc = await Setting.create({});
    cached = doc.toJSON();
    cachedAt = Date.now();
    return cached;
  } catch (error) {
    console.error('Không đọc được cài đặt hệ thống:', error.message);
    return { ...DEFAULT_SETTINGS };
  }
};

export const updateSettings = async (payload) => {
  let doc = await Setting.findOne().sort({ createdAt: 1 });
  if (!doc) doc = new Setting();
  doc.set(payload);
  await doc.save();
  clearSettingsCache();
  return getSettings();
};
