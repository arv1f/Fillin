import { PrismaClient } from '@prisma/client'
import {
  DEFAULT_SCENE_TITLES,
  DEFAULT_UI_STRINGS,
  DEFAULT_ZONE_COPY,
} from '../src/data/sceneCopyDefaults'

const prisma = new PrismaClient()

async function main() {
  for (const [sceneId, title] of Object.entries(DEFAULT_SCENE_TITLES)) {
    await prisma.sceneCopy.upsert({
      where: { sceneId },
      create: { sceneId, title },
      update: { title },
    })
  }

  for (const [zoneKey, row] of Object.entries(DEFAULT_ZONE_COPY)) {
    await prisma.zoneCopy.upsert({
      where: { zoneKey },
      create: {
        zoneKey,
        title: row.title,
        mapRange: row.mapRange,
      },
      update: { title: row.title, mapRange: row.mapRange },
    })
  }

  for (const [key, value] of Object.entries(DEFAULT_UI_STRINGS)) {
    await prisma.siteCopy.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  }

  console.log('Seed: scene / zone / site copy OK')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
