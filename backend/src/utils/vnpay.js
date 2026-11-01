import crypto from 'crypto';
import qs from 'qs';
import dayjs from 'dayjs';

const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .map((key) => encodeURIComponent(key))
    .sort()
    .forEach((encodedKey) => {
      const originalKey = decodeURIComponent(encodedKey);
      sorted[encodedKey] = encodeURIComponent(String(obj[originalKey])).replace(/%20/g, '+');
    });
  return sorted;
};

const sign = (sortedParams) => {
  const signData = qs.stringify(sortedParams, { encode: false });
  return crypto
    .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
};

export const createPaymentUrl = ({ amount, txnRef, orderInfo, ipAddr }) => {
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount) * 100,
    vnp_ReturnUrl: `${process.env.CLIENT_URL}/payment/vnpay-return`,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: dayjs().format('YYYYMMDDHHmmss'),
    vnp_ExpireDate: dayjs().add(15, 'minute').format('YYYYMMDDHHmmss'),
  };
  const sorted = sortObject(params);
  sorted.vnp_SecureHash = sign(sorted);
  return `${process.env.VNPAY_URL}?${qs.stringify(sorted, { encode: false })}`;
};

export const verifyReturn = (query) => {
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  if (!secureHash) return false;
  const checkHash = sign(sortObject(params));
  return String(secureHash).toLowerCase() === checkHash.toLowerCase();
};

export const signForTest = (params) => sign(sortObject(params));

export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = (forwarded ? String(forwarded).split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';
  const ip = raw.replace('::ffff:', '');
  return ip === '::1' ? '127.0.0.1' : ip;
};
