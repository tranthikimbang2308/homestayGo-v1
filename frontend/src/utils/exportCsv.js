import dayjs from 'dayjs';
import client from '../api/client.js';
import { BOOKING_STATUS, PAYMENT_METHODS, PAYMENT_STATUS, ROLES } from './constants.js';

const BOM = '﻿';
const PAGE_SIZE = 100;
const MAX_ROWS = 1000;

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? dayjs(value).format('DD/MM/YYYY HH:mm') : String(value);
  if (/[",\r\n;]/.test(text) || /^\s|\s$/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const resolveValue = (row, column) => {
  if (typeof column.value === 'function') return column.value(row);
  return String(column.key || '')
    .split('.')
    .reduce((current, part) => (current === null || current === undefined ? undefined : current[part]), row);
};

export const buildCsv = (rows, columns) => {
  const header = columns.map((column) => escapeCell(column.label)).join(',');
  const body = rows.map((row) => columns.map((column) => escapeCell(resolveValue(row, column))).join(','));
  return BOM + [header, ...body].join('\r\n');
};

export const downloadCsv = (filename, rows, columns) => {
  const csv = buildCsv(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const fetchAllRows = async (url, params = {}, maxRows = MAX_ROWS) => {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await client.get(url, { params: { ...cleanParams, page, limit: PAGE_SIZE } });
    const data = res.data.data;
    const list = Array.isArray(data) ? data : data?.items || [];
    rows.push(...list);
    totalPages = res.data.pagination?.totalPages || 1;
    if (!list.length) break;
    page += 1;
  } while (page <= totalPages && rows.length < maxRows);
  return rows.slice(0, maxRows);
};

export const csvFilename = (prefix) => `${prefix}-${dayjs().format('YYYYMMDD-HHmm')}.csv`;

export const formatCsvDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '');

export const formatCsvDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '');

export const BOOKING_CSV_COLUMNS = [
  { label: 'Mã đơn', key: 'code' },
  { label: 'Phòng', key: 'room.title' },
  { label: 'Thành phố', key: 'room.city' },
  { label: 'Khách hàng', value: (row) => row.customer?.name || row.contactName || '' },
  { label: 'Email khách', key: 'customer.email' },
  { label: 'Người liên hệ', key: 'contactName' },
  { label: 'Số điện thoại', value: (row) => row.contactPhone || row.customer?.phone || '' },
  { label: 'Nhận phòng', value: (row) => formatCsvDate(row.checkIn) },
  { label: 'Trả phòng', value: (row) => formatCsvDate(row.checkOut) },
  { label: 'Số đêm', key: 'nights' },
  { label: 'Số khách', key: 'guests' },
  { label: 'Mã giảm giá', key: 'couponCode' },
  { label: 'Giảm giá (VNĐ)', value: (row) => row.discount || 0 },
  { label: 'Tổng tiền (VNĐ)', value: (row) => row.totalPrice || 0 },
  { label: 'Thanh toán', value: (row) => PAYMENT_METHODS[row.paymentMethod]?.label || row.paymentMethod || '' },
  { label: 'Trạng thái thanh toán', value: (row) => PAYMENT_STATUS[row.paymentStatus]?.label || row.paymentStatus || '' },
  { label: 'Trạng thái đơn', value: (row) => BOOKING_STATUS[row.status]?.label || row.status || '' },
  { label: 'Ngày đặt', value: (row) => formatCsvDateTime(row.createdAt) },
];

export const USER_CSV_COLUMNS = [
  { label: 'Họ tên', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: 'Số điện thoại', key: 'phone' },
  { label: 'Vai trò', value: (row) => ROLES[row.role]?.label || row.role || '' },
  { label: 'Trạng thái', value: (row) => (row.isActive === false ? 'Đã khóa' : 'Hoạt động') },
  { label: 'Ngày tham gia', value: (row) => formatCsvDateTime(row.createdAt) },
];

export default downloadCsv;
