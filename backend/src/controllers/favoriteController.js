import Room from '../models/Room.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    populate: { path: 'owner', select: 'name avatar' },
  });
  const rooms = (user.favorites || []).filter(Boolean);
  res.json({ success: true, data: rooms });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId).select('_id');
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  const user = await User.findById(req.user._id);
  const index = user.favorites.findIndex((id) => String(id) === String(room._id));
  const favorited = index === -1;
  if (favorited) user.favorites.push(room._id);
  else user.favorites.splice(index, 1);
  await user.save();
  res.json({
    success: true,
    message: favorited ? 'Đã thêm vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích',
    data: { favorited, favorites: user.favorites.map((id) => String(id)) },
  });
});
