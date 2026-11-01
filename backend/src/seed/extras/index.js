import { seedCoupons } from './coupons.js';
import { seedCommunication } from './communication.js';
import { seedContent } from './content.js';
import { seedDiscovery } from './discovery.js';

export const seedExtras = async (ctx) => {
  await seedCoupons(ctx);
  await seedCommunication(ctx);
  await seedContent(ctx);
  await seedDiscovery(ctx);
};
