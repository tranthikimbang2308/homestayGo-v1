import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const uploadBuffer = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'homestaygo', resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
  });

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw new ApiError(400, 'Vui lòng chọn ít nhất một ảnh');
  try {
    const urls = await Promise.all(files.map(uploadBuffer));
    res.status(201).json({ success: true, message: 'Tải ảnh lên thành công', data: { urls } });
  } catch (error) {
    console.error(error);
    throw new ApiError(500, 'Tải ảnh lên Cloudinary thất bại');
  }
});
