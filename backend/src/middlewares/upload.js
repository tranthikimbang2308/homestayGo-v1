import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new ApiError(400, 'Chỉ chấp nhận tệp hình ảnh'));
  },
});

export default upload;
