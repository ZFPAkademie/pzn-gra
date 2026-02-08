/**
 * Database Seed Script
 * 
 * Sprint 0: Skeleton only
 * Initial system settings defined in SPRINT_0_PLAN.md §5.3
 * 
 * Run with: pnpm --filter web prisma db seed
 * (after configuring package.json prisma.seed)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Initial system settings (from SPRINT_0_PLAN.md §5.3)
  const settings = [
    { key: 'exchange_rate_eur_czk', value: '24.20' },
    { key: 'commission_rate_web', value: '0.30' },
    { key: 'commission_rate_ota', value: '0.40' },
    { key: 'min_stay_nights', value: '2' },
    { key: 'default_check_in_time', value: '15:00' },
    { key: 'default_check_out_time', value: '10:00' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
    console.log(`  ✓ ${setting.key}: ${setting.value}`);
  }

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
