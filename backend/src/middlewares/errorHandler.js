import multer from 'multer';

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy đường dẫn ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Mã định danh không hợp lệ';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field === 'email' ? 'Email đã được sử dụng' : 'Dữ liệu đã tồn tại';
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Kích thước mỗi ảnh tối đa 5MB';
    else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Chỉ được tải lên tối đa 10 ảnh qua trường images';
    else message = 'Lỗi tải tệp lên';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Dữ liệu gửi lên không đúng định dạng JSON';
  }

  if (statusCode >= 500) {
    console.error(err);
    if (!err.statusCode) message = 'Lỗi máy chủ, vui lòng thử lại sau';
  }
  res.status(statusCode).json({ success: false, message });
};
