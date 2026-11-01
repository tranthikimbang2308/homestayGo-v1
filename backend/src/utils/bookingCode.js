const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

const generateBookingCode = () => {
  let code = 'HG';
  for (let i = 0; i < 8; i += 1) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
};

export default generateBookingCode;
