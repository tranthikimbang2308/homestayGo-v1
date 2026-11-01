import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

const { EJSON } = mongoose.mongo.BSON;
const inputDir = path.resolve(process.cwd(), process.argv[2] || '../database/homestaygo');

const importDatabase = async () => {
  if (!fs.existsSync(inputDir)) throw new Error(`Không tìm thấy thư mục ${inputDir}`);
  await connectDB();
  const files = fs.readdirSync(inputDir).filter((file) => file.endsWith('.json'));
  for (const file of files) {
    const name = path.basename(file, '.json');
    const documents = EJSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf8'), { relaxed: false });
    const collection = mongoose.connection.db.collection(name);
    await collection.deleteMany({});
    if (documents.length) await collection.insertMany(documents);
    console.log(`Đã nhập ${name}: ${documents.length} bản ghi`);
  }
};

importDatabase()
  .catch((error) => {
    console.error('Nhập dữ liệu thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
