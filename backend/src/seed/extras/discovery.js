import Room from '../../models/Room.js';

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const seedDiscovery = async ({ rooms = [] } = {}) => {
  const operations = rooms.map((room) => {
    const base = room.status === 'approved' ? randomBetween(40, 900) : randomBetween(0, 20);
    const bonus = Math.round((room.ratingAvg || 0) * 30 + (room.bookingCount || 0) * 15);
    return { updateOne: { filter: { _id: room._id }, update: { $set: { viewCount: base + bonus } } } };
  });
  if (operations.length) await Room.bulkWrite(operations);
  console.log(`Đã gán lượt xem cho ${operations.length} phòng`);
};
