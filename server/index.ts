import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  ALLOWED_SCENE_IDS,
  ALLOWED_UI_KEYS,
  ALLOWED_ZONE_KEYS,
} from './copyAllowlists'
import { prisma } from './db'

type PublicCopyPayload = {
  scenes: Record<string, string>
  zones: Record<string, { title: string; mapRange: string }>
  ui: Record<string, string>
}

const app = express()
const port = Number(process.env.ADMIN_API_PORT) || 4000
const corsOrigin = process.env.ADMIN_CORS_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'fillin-admin-api' })
})

async function loadPublicCopy(): Promise<PublicCopyPayload> {
  const [scenes, zones, site] = await Promise.all([
    prisma.sceneCopy.findMany(),
    prisma.zoneCopy.findMany(),
    prisma.siteCopy.findMany(),
  ])
  const scenesMap: Record<string, string> = {}
  for (const r of scenes) {
    if (ALLOWED_SCENE_IDS.has(r.sceneId)) scenesMap[r.sceneId] = r.title
  }
  const zonesMap: PublicCopyPayload['zones'] = {}
  for (const r of zones) {
    if (ALLOWED_ZONE_KEYS.has(r.zoneKey)) {
      zonesMap[r.zoneKey] = { title: r.title, mapRange: r.mapRange }
    }
  }
  const ui: Record<string, string> = {}
  for (const r of site) {
    if (ALLOWED_UI_KEYS.has(r.key)) ui[r.key] = r.value
  }
  return { scenes: scenesMap, zones: zonesMap, ui }
}

/** Публичные тексты тура (для фронта). */
app.get('/api/public/copy', async (_req, res) => {
  try {
    const data = await loadPublicCopy()
    res.json(data)
  } catch {
    res.status(500).json({ error: 'database_error' })
  }
})

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = process.env.ADMIN_TOKEN
  if (!token || !token.trim()) {
    res.status(503).json({ error: 'admin_token_not_configured' })
    return
  }
  const got = req.headers['x-admin-token']
  if (got !== token) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}

/** Сохранение всех текстов (админка). */
app.put('/api/admin/copy', requireAdmin, async (req, res) => {
  const body = req.body as Partial<PublicCopyPayload>
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'invalid_body' })
    return
  }
  try {
    await prisma.$transaction(async (tx) => {
      if (body.scenes && typeof body.scenes === 'object') {
        for (const [sceneId, title] of Object.entries(body.scenes)) {
          if (!ALLOWED_SCENE_IDS.has(sceneId)) continue
          if (typeof title !== 'string') continue
          await tx.sceneCopy.upsert({
            where: { sceneId },
            create: { sceneId, title },
            update: { title },
          })
        }
      }
      if (body.zones && typeof body.zones === 'object') {
        for (const [zoneKey, row] of Object.entries(body.zones)) {
          if (!ALLOWED_ZONE_KEYS.has(zoneKey)) continue
          if (!row || typeof row !== 'object') continue
          const title = typeof row.title === 'string' ? row.title : ''
          const mapRange =
            typeof row.mapRange === 'string' ? row.mapRange : ''
          await tx.zoneCopy.upsert({
            where: { zoneKey },
            create: { zoneKey, title, mapRange },
            update: { title, mapRange },
          })
        }
      }
      if (body.ui && typeof body.ui === 'object') {
        for (const [key, value] of Object.entries(body.ui)) {
          if (!ALLOWED_UI_KEYS.has(key)) continue
          if (typeof value !== 'string') continue
          await tx.siteCopy.upsert({
            where: { key },
            create: { key, value },
            update: { value },
          })
        }
      }
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'save_failed' })
  }
})

app.get('/api/admin/users', async (_req, res) => {
  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    res.json(users)
  } catch {
    res.status(500).json({ error: 'database_error' })
  }
})

app.listen(port, () => {
  console.log(`[admin-api] http://localhost:${port}`)
})
