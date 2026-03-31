import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { prisma } from './db'

const app = express()
const port = Number(process.env.ADMIN_API_PORT) || 4000
const corsOrigin = process.env.ADMIN_CORS_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'fillin-admin-api' })
})

/** Список админов (без passwordHash) — заготовка под будущую админку. */
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
