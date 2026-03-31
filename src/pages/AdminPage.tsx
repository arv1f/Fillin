import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Health = { ok?: boolean; service?: string }
type AdminUserRow = {
  id: string
  email: string
  displayName: string | null
  createdAt: string
}

export function AdminPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [users, setUsers] = useState<AdminUserRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [h, u] = await Promise.all([
          fetch('/api/health').then((r) => r.json()),
          fetch('/api/admin/users').then((r) => r.json()),
        ])
        if (!cancelled) {
          setHealth(h)
          setUsers(Array.isArray(u) ? u : [])
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setError(
            'API недоступен. Запусти в отдельном терминале: npm run server:dev',
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-dvh bg-zinc-950 p-6 text-zinc-100 sm:p-10">
      <div className="mx-auto max-w-lg">
        <p className="mb-4 text-sm text-zinc-500">
          <Link
            to="/tour/00"
            className="text-cyan-400 underline-offset-2 hover:underline"
          >
            ← К туру
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Админка</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Prisma + SQLite. API на порту 4000, в dev Vite проксирует{' '}
          <code className="text-zinc-300">/api</code> на этот сервер.
        </p>

        <section className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Health
          </h2>
          <pre className="mt-2 overflow-x-auto text-xs text-zinc-300">
            {error ?? JSON.stringify(health, null, 2)}
          </pre>
        </section>

        <section className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            AdminUser (Prisma)
          </h2>
          {users && users.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              Пока нет записей. Добавь через{' '}
              <code className="text-zinc-400">npx prisma studio</code> или
              сидер позже.
            </p>
          ) : null}
          {users && users.length > 0 ? (
            <ul className="mt-2 space-y-2 text-sm">
              {users.map((u) => (
                <li key={u.id} className="rounded border border-zinc-800 px-3 py-2">
                  <span className="font-medium text-cyan-200">{u.email}</span>
                  {u.displayName ? (
                    <span className="text-zinc-500"> — {u.displayName}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  )
}
