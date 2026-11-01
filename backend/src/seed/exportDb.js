import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

const { EJSON } = mongoose.mongo.BSON;
const outputDir = path.resolve(process.cwd(), process.argv[2] || '../database/homestaygo');

const exportDatabase = async () => {
  await connectDB();
  fs.mkdirSync(outputDir, { recursive: true });
  const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const documents = await mongoose.connection.db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(outputDir, `${name}.json`), EJSON.stringify(documents, null, 2, { relaxed: false }));
    console.log(`Đã xuất ${name}: ${documents.length} bản ghi`);
  }
  console.log(`Thư mục dữ liệu: ${outputDir}`);
};

exportDatabase()
  .catch((error) => {
    console.error('Xuất dữ liệu thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
