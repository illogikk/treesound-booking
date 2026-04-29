import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Room types
  const djType = await prisma.roomType.upsert({
    where: { name: 'DJ Booth' },
    update: {},
    create: {
      name: 'DJ Booth',
      description: 'Professional DJ setup with Pioneer CDJs and mixer',
      attrs: { gear: ['Pioneer CDJ-3000', 'Pioneer DJM-900NXS2', 'KRK Rokit 8 monitors'] },
    },
  });

  const recordingType = await prisma.roomType.upsert({
    where: { name: 'Recording Studio' },
    update: {},
    create: {
      name: 'Recording Studio',
      description: 'Full tracking room with isolation booth',
      attrs: { gear: ['Pro Tools HDX', 'SSL console', 'Neumann U87', 'Avalon preamps'] },
    },
  });

  const podcastType = await prisma.roomType.upsert({
    where: { name: 'Podcast Room' },
    update: {},
    create: {
      name: 'Podcast Room',
      description: 'Acoustically treated room for crystal-clear recordings',
      attrs: {
        gear: ['Rodecaster Pro II', 'Shure SM7B x4', 'Focusrite Scarlett 18i20', 'Acoustic panels'],
      },
    },
  });

  const rehearsalType = await prisma.roomType.upsert({
    where: { name: 'Rehearsal Space' },
    update: {},
    create: {
      name: 'Rehearsal Space',
      description: 'Large rehearsal room for bands up to 6 members',
      attrs: {
        gear: ['Pearl drum kit', 'Marshall amp stack', 'Fender bass amp', 'PA system'],
      },
    },
  });

  // Location
  const location = await prisma.location.upsert({
    where: { id: 'loc_treesound_main' },
    update: {},
    create: {
      id: 'loc_treesound_main',
      name: 'TreeSound Studios',
      address: '1234 Music Row',
      city: 'Nashville',
      state: 'TN',
      zip: '37203',
      country: 'US',
      timezone: 'America/Chicago',
      phone: '+1-615-555-0100',
      email: 'studio@treesound.com',
    },
  });

  // Rooms
  const rooms = [
    {
      id: 'room_dj_a',
      locationId: location.id,
      typeId: djType.id,
      name: 'DJ Booth A',
      slug: 'dj-booth-a',
      description:
        'Our flagship DJ room featuring Pioneer CDJ-3000s and a DJM-900NXS2 mixer. Perfect for practice sets, radio shows, or live streaming.',
      capacity: 3,
      equipment: [
        'Pioneer CDJ-3000 x2',
        'Pioneer DJM-900NXS2',
        'KRK Rokit 8 Monitors',
        'Serato DJ Pro',
      ],
      photos: [],
      baseHourly: 3500, // $35/hr in cents
    },
    {
      id: 'room_recording_a',
      locationId: location.id,
      typeId: recordingType.id,
      name: 'Recording Studio A',
      slug: 'recording-studio-a',
      description:
        'Professional 2-room recording setup with a fully equipped control room and isolation booth. Ideal for vocals, acoustic instruments, and full band tracking.',
      capacity: 8,
      equipment: [
        'Pro Tools HDX',
        'Neve 8078 Console',
        'Neumann U87',
        'AKG C414',
        'Avalon 737 Preamp',
        'Isolation Booth',
      ],
      photos: [],
      baseHourly: 7500, // $75/hr in cents
    },
    {
      id: 'room_podcast_a',
      locationId: location.id,
      typeId: podcastType.id,
      name: 'Podcast Room A',
      slug: 'podcast-room-a',
      description:
        'Acoustically treated podcast suite for up to 4 hosts. Includes a Rodecaster Pro II and broadcast-quality microphones.',
      capacity: 4,
      equipment: [
        'Rodecaster Pro II',
        'Shure SM7B x4',
        'Focusrite Scarlett 18i20',
        'Acoustic treatment',
        'Monitoring headphones x4',
      ],
      photos: [],
      baseHourly: 4500, // $45/hr in cents
    },
    {
      id: 'room_rehearsal_a',
      locationId: location.id,
      typeId: rehearsalType.id,
      name: 'Rehearsal Space A',
      slug: 'rehearsal-space-a',
      description:
        'Large, soundproofed rehearsal room with full backline. Great for bands preparing for tours or recording sessions.',
      capacity: 6,
      equipment: [
        'Pearl Reference drum kit',
        'Marshall JVM410H + 1960A cab',
        'Ampeg SVT-CL bass amp',
        'Yamaha PA system',
        'Direct boxes',
      ],
      photos: [],
      baseHourly: 5000, // $50/hr in cents
    },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    });
  }

  // Default open-hours schedule rule for the location (Mon-Sun 8am-10pm)
  await prisma.scheduleRule.upsert({
    where: { id: 'rule_loc_open_hours' },
    update: {},
    create: {
      id: 'rule_loc_open_hours',
      locationId: location.id,
      ruleType: 'OPEN',
      label: 'Standard Hours',
      openHours: [
        { dayOfWeek: 0, openHour: 8, closeHour: 22 }, // Sunday
        { dayOfWeek: 1, openHour: 8, closeHour: 22 }, // Monday
        { dayOfWeek: 2, openHour: 8, closeHour: 22 }, // Tuesday
        { dayOfWeek: 3, openHour: 8, closeHour: 22 }, // Wednesday
        { dayOfWeek: 4, openHour: 8, closeHour: 22 }, // Thursday
        { dayOfWeek: 5, openHour: 9, closeHour: 23 }, // Friday
        { dayOfWeek: 6, openHour: 9, closeHour: 23 }, // Saturday
      ],
    },
  });

  // Peak pricing rule (Fri/Sat evenings, 1.5x)
  await prisma.priceRule.upsert({
    where: { id: 'rule_peak_weekend' },
    update: {},
    create: {
      id: 'rule_peak_weekend',
      appliesTo: 'LOCATION',
      locationId: location.id,
      kind: 'PEAK',
      label: 'Weekend Evening Peak',
      rate: 1.5,
      schedule: { daysOfWeek: [5, 6], startHour: 18, endHour: 23 },
      priority: 10,
    },
  });

  // Sample promo code
  await prisma.promo.upsert({
    where: { code: 'TREESOUND10' },
    update: {},
    create: {
      code: 'TREESOUND10',
      type: 'PERCENTAGE',
      value: 10,
      maxUses: 100,
      active: true,
    },
  });

  console.log('✅ Seed complete!');
  console.log(`   Location: ${location.name} (${location.city}, ${location.state})`);
  console.log(`   Rooms: ${rooms.map((r) => r.name).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
