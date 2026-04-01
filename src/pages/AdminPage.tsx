import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSceneContent } from '../contexts/SceneContentContext'
import {
  DEFAULT_UI_STRINGS,
  mergeWithDefaults,
  type PublicCopyPayload,
} from '../data/sceneCopyDefaults'
import { SCENE_IDS } from '../scenes'

type Health = { ok?: boolean; service?: string }
type AdminUserRow = {
  id: string
  email: string
  displayName: string | null
  createdAt: string
}

const TOKEN_STORAGE = 'fillin_admin_token'

function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? ''
}

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1'
}

function hintApiUnreachable(): string {
  return isLocalDevHost()
    ? 'API недоступен. Запусти npm run dev:all (или в отдельном терминале npm run server:dev, пока идёт npm run dev).'
    : 'API недоступен на этом домене. На VPS нужны: Node API (pm2, порт 4000), nginx с proxy /api → 127.0.0.1:4000, файл .env с DATABASE_URL и ADMIN_TOKEN. Скрипт выкладки API: scripts/deploy-api-remote.ps1.'
}

function formatSaveError(status: number): string {
  if (status === 401) return 'Неверный ADMIN_TOKEN.'
  if (status === 503) return 'На сервере не задан ADMIN_TOKEN (503).'
  if (status === 405) {
    return '405: PUT не доходит до Node (nginx отдаёт статику). Добавь в nginx location /api с proxy_pass на 127.0.0.1:4000 — см. nginx-fillin.conf.example на сервере.'
  }
  return `Ошибка сохранения (HTTP ${status}).`
}

export function AdminPage() {
  const { refresh } = useSceneContent()
  const [draft, setDraft] = useState<PublicCopyPayload | null>(null)
  const [token, setToken] = useState(() =>
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(TOKEN_STORAGE) ?? ''
      : '',
  )

  /** Доступ к данным и формам только после успешной проверки токена (GET /api/admin/copy). */
  const [unlocked, setUnlocked] = useState(false)
  const [authChecking, setAuthChecking] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return (localStorage.getItem(TOKEN_STORAGE)?.trim() ?? '') !== ''
  })
  const [authError, setAuthError] = useState<string | null>(null)

  const [health, setHealth] = useState<Health | null>(null)
  const [users, setUsers] = useState<AdminUserRow[] | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'ok' | 'err'
  >('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const persistToken = useCallback((value: string) => {
    setToken(value)
    try {
      localStorage.setItem(TOKEN_STORAGE, value)
    } catch {
      /* ignore */
    }
  }, [])

  const tryUnlock = useCallback(
    async (t: string, opts?: { persist?: boolean }) => {
      const trimmed = t.trim()
      if (!trimmed) {
        setAuthError('Введите токен из ADMIN_TOKEN на сервере.')
        setUnlocked(false)
        setDraft(null)
        setAuthChecking(false)
        return
      }
      setAuthChecking(true)
      setAuthError(null)
      try {
        const r = await fetch(`${apiBase()}/api/admin/copy`, {
          headers: { 'X-Admin-Token': trimmed },
        })
        if (r.ok) {
          const data = (await r.json()) as Partial<PublicCopyPayload>
          setDraft(mergeWithDefaults(data))
          setUnlocked(true)
          if (opts?.persist !== false) persistToken(trimmed)
        } else {
          setUnlocked(false)
          setDraft(null)
          setAuthError(
            r.status === 401
              ? 'Неверный токен.'
              : r.status === 503
                ? 'ADMIN_TOKEN на сервере не настроен.'
                : `Ошибка входа (${r.status}).`,
          )
        }
      } catch {
        setUnlocked(false)
        setDraft(null)
        setAuthError(hintApiUnreachable())
      } finally {
        setAuthChecking(false)
      }
    },
    [persistToken],
  )

  /** При открытии страницы: если в localStorage был токен — проверить и подгрузить данные. */
  useEffect(() => {
    const stored =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(TOKEN_STORAGE)?.trim() ?? ''
        : ''
    if (stored) {
      void tryUnlock(stored, { persist: false })
    } else {
      setAuthChecking(false)
    }
  }, [tryUnlock])

  /** Health и список пользователей — только после входа (users требует токен на сервере). */
  useEffect(() => {
    if (!unlocked || !token.trim()) {
      setHealth(null)
      setUsers(null)
      setApiError(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const hr = await fetch(`${apiBase()}/api/health`)
        if (!hr.ok) {
          if (!cancelled) {
            setApiError(
              `${hintApiUnreachable()} Сейчас /api/health отвечает ${hr.status}.`,
            )
            setHealth(null)
            setUsers(null)
          }
          return
        }
        const h = (await hr.json()) as Health
        const ur = await fetch(`${apiBase()}/api/admin/users`, {
          headers: { 'X-Admin-Token': token.trim() },
        })
        let userRows: AdminUserRow[] = []
        if (ur.ok) {
          const data = (await ur.json()) as unknown
          userRows = Array.isArray(data) ? (data as AdminUserRow[]) : []
        }
        if (!cancelled) {
          setHealth(h)
          setUsers(userRows)
          setApiError(null)
        }
      } catch {
        if (!cancelled) {
          setApiError(hintApiUnreachable())
          setHealth(null)
          setUsers(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [unlocked, token])

  const handleLogin = useCallback(() => {
    void tryUnlock(token, { persist: true })
  }, [token, tryUnlock])

  const handleLogout = useCallback(() => {
    persistToken('')
    setUnlocked(false)
    setDraft(null)
    setAuthError(null)
    setHealth(null)
    setUsers(null)
    setSaveMessage(null)
    setSaveStatus('idle')
  }, [persistToken])

  const setSceneTitle = useCallback((sceneId: string, title: string) => {
    setDraft((d) =>
      d ? { ...d, scenes: { ...d.scenes, [sceneId]: title } } : null,
    )
  }, [])

  const setZoneField = useCallback(
    (
      zoneKey: keyof PublicCopyPayload['zones'],
      field: 'title' | 'mapRange',
      value: string,
    ) => {
      setDraft((d) => {
        if (!d) return null
        const prev = d.zones[zoneKey] ?? { title: '', mapRange: '' }
        return {
          ...d,
          zones: {
            ...d.zones,
            [zoneKey]: { ...prev, [field]: value },
          },
        }
      })
    },
    [],
  )

  const setUiString = useCallback((key: string, value: string) => {
    setDraft((d) =>
      d ? { ...d, ui: { ...d.ui, [key]: value } } : null,
    )
  }, [])

  const handleSave = useCallback(async () => {
    if (!draft || !token.trim()) {
      setSaveStatus('err')
      setSaveMessage('Нужен токен администратора.')
      return
    }
    setSaveStatus('saving')
    setSaveMessage(null)
    try {
      const r = await fetch(`${apiBase()}/api/admin/copy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token.trim(),
        },
        body: JSON.stringify(draft),
      })
      if (!r.ok) {
        const raw = await r.text()
        let code = formatSaveError(r.status)
        try {
          const err = JSON.parse(raw) as { error?: unknown }
          if (typeof err?.error === 'string') code = err.error
        } catch {
          if (r.status === 405) code = formatSaveError(405)
        }
        throw new Error(code)
      }
      setSaveStatus('ok')
      setSaveMessage('Сохранено.')
      const reload = await fetch(`${apiBase()}/api/admin/copy`, {
        headers: { 'X-Admin-Token': token.trim() },
      })
      if (reload.ok) {
        const data = (await reload.json()) as Partial<PublicCopyPayload>
        setDraft(mergeWithDefaults(data))
      }
      await refresh()
    } catch (e) {
      setSaveStatus('err')
      setSaveMessage(
        e instanceof Error ? e.message : 'Ошибка сохранения (сеть или токен).',
      )
    }
  }, [draft, token, refresh])

  const uiKeys = Object.keys(DEFAULT_UI_STRINGS)

  return (
    <div className="min-h-dvh bg-zinc-950 p-6 text-zinc-100 sm:p-10">
      <div className="mx-auto max-w-3xl">
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
          Данные и редактирование доступны после ввода{' '}
          <code className="text-zinc-300">ADMIN_TOKEN</code> (тот же, что в{' '}
          <code className="text-zinc-300">.env</code> на сервере API).
        </p>
        <p className="mt-3 rounded-md border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-500">
          Набор панорам, точек маршрута и геометрия хотспотов заданы в коде и
          через эту панель не меняются — здесь только подписи и тексты
          интерфейса.
        </p>

        <section className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Вход
          </h2>
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => persistToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            className="mt-2 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-600 focus:outline-none"
            disabled={authChecking}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleLogin()}
              disabled={authChecking || !token.trim()}
              className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:opacity-50"
            >
              {authChecking ? 'Проверка…' : 'Войти'}
            </button>
            {unlocked ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Выйти
              </button>
            ) : null}
          </div>
          {authError ? (
            <p className="mt-2 text-sm text-red-400">{authError}</p>
          ) : null}
        </section>

        {!unlocked && !authChecking ? (
          <p className="mt-8 text-sm text-zinc-500">
            Введите токен и нажмите «Войти», чтобы увидеть и менять тексты.
          </p>
        ) : null}

        {authChecking && !unlocked ? (
          <p className="mt-8 text-sm text-zinc-500">Проверка токена…</p>
        ) : null}

        {unlocked && draft ? (
          <>
            <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Точки маршрута
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {SCENE_IDS.map((id) => (
                  <label
                    key={id}
                    className="flex flex-col gap-1 text-xs text-zinc-400"
                  >
                    <span className="font-mono text-zinc-500">{id}</span>
                    <input
                      value={draft.scenes[id] ?? ''}
                      onChange={(e) => setSceneTitle(id, e.target.value)}
                      className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 focus:border-cyan-600 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Зоны
              </h2>
              <div className="mt-3 space-y-4">
                {(
                  [
                    'corridor',
                    'second',
                    'interactive',
                    'historical',
                    'other',
                  ] as const
                ).map((zk) => (
                  <div
                    key={zk}
                    className="rounded border border-zinc-800/80 p-3"
                  >
                    <p className="font-mono text-[11px] text-zinc-500">
                      {zk}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs text-zinc-400">
                        Название
                        <input
                          value={draft.zones[zk]?.title ?? ''}
                          onChange={(e) =>
                            setZoneField(zk, 'title', e.target.value)
                          }
                          className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 focus:border-cyan-600 focus:outline-none"
                        />
                      </label>
                      {zk !== 'other' ? (
                        <label className="flex flex-col gap-1 text-xs text-zinc-400">
                          Диапазон на карте
                          <input
                            value={draft.zones[zk]?.mapRange ?? ''}
                            onChange={(e) =>
                              setZoneField(zk, 'mapRange', e.target.value)
                            }
                            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 focus:border-cyan-600 focus:outline-none"
                          />
                        </label>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Интерфейс
              </h2>
              <div className="mt-3 space-y-3">
                {uiKeys.map((key) => (
                  <label
                    key={key}
                    className="flex flex-col gap-1 text-xs text-zinc-400"
                  >
                    <span className="font-mono text-zinc-500">{key}</span>
                    <textarea
                      rows={key.includes('hint') ? 3 : 1}
                      value={draft.ui[key] ?? ''}
                      onChange={(e) => setUiString(key, e.target.value)}
                      className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 focus:border-cyan-600 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </section>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saveStatus === 'saving'}
                className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:opacity-50"
              >
                {saveStatus === 'saving' ? 'Сохранение…' : 'Сохранить в БД'}
              </button>
              {saveMessage ? (
                <span
                  className={
                    saveStatus === 'ok'
                      ? 'text-sm text-emerald-400'
                      : 'text-sm text-red-400'
                  }
                >
                  {saveMessage}
                </span>
              ) : null}
            </div>
          </>
        ) : null}

        {unlocked ? (
          <>
            <section className="mt-10 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Health
              </h2>
              <pre className="mt-2 overflow-x-auto text-xs text-zinc-300">
                {apiError ?? JSON.stringify(health, null, 2)}
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
                    <li
                      key={u.id}
                      className="rounded border border-zinc-800 px-3 py-2"
                    >
                      <span className="font-medium text-cyan-200">{u.email}</span>
                      {u.displayName ? (
                        <span className="text-zinc-500"> — {u.displayName}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
