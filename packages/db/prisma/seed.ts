import { PrismaClient, TimeControl } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test users
  const user1 = await prisma.user.upsert({
    where: { handle: 'testuser1' },
    update: {},
    create: {
      handle: 'testuser1',
      email: 'test1@example.com',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { handle: 'testuser2' },
    update: {},
    create: {
      handle: 'testuser2', 
      email: 'test2@example.com',
    },
  })

  // Create ratings for both time controls
  await prisma.rating.upsert({
    where: { 
      userId_tc: {
        userId: user1.id,
        tc: TimeControl.ONE_PLUS_ZERO
      }
    },
    update: {},
    create: {
      userId: user1.id,
      tc: TimeControl.ONE_PLUS_ZERO,
      rating: 1500,
      rd: 350,
      vol: 0.06,
    },
  })

  await prisma.rating.upsert({
    where: { 
      userId_tc: {
        userId: user1.id,
        tc: TimeControl.ONE_PLUS_ONE
      }
    },
    update: {},
    create: {
      userId: user1.id,
      tc: TimeControl.ONE_PLUS_ONE,
      rating: 1480,
      rd: 340,
      vol: 0.06,
    },
  })

  await prisma.rating.upsert({
    where: { 
      userId_tc: {
        userId: user2.id,
        tc: TimeControl.ONE_PLUS_ZERO
      }
    },
    update: {},
    create: {
      userId: user2.id,
      tc: TimeControl.ONE_PLUS_ZERO,
      rating: 1520,
      rd: 330,
      vol: 0.06,
    },
  })

  await prisma.rating.upsert({
    where: { 
      userId_tc: {
        userId: user2.id,
        tc: TimeControl.ONE_PLUS_ONE
      }
    },
    update: {},
    create: {
      userId: user2.id,
      tc: TimeControl.ONE_PLUS_ONE,
      rating: 1495,
      rd: 325,
      vol: 0.06,
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })