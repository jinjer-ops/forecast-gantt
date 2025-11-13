// src/api.ts

export type Task = {
  Plan: string
  Workstream: string
  Category: string
  Task: string
  Start: string
  End: string
  Deliverable?: string
  DefinitionOfDone?: string
  Owner?: string
  Dependencies?: string
  Notes?: string
  Spec?: number
  Dev?: number
  Test?: number
  Ship?: number
  [key: string]: any
}

const GAS_URL = import.meta.env.VITE_GAS_URL as string

if (!GAS_URL) {
  console.error('VITE_GAS_URL が設定されていません')
}

export const pollMs = Number(import.meta.env.VITE_POLL_MS ?? '15000')

export async function listTasks(): Promise<Task[]> {
  if (!GAS_URL) throw new Error('VITE_GAS_URL が設定されていません')

  const res = await fetch(`${GAS_URL}?action=list`)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} / ${res.statusText}\n${text.slice(0, 200)}`)
  }

  const json = await res.json()
  if (!json.ok) {
    throw new Error(`GAS 側エラー: ${json.error || 'ok:false'}`)
  }
  if (!Array.isArray(json.tasks)) {
    throw new Error('GAS から tasks 配列が返ってきていません')
  }

  return json.tasks as Task[]
}

export async function saveTicks(rows: any[]): Promise<void> {
  if (!GAS_URL) throw new Error('VITE_GAS_URL が設定されていません')

  const res = await fetch(`${GAS_URL}?action=saveticks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`saveTicks HTTP ${res.status} / ${res.statusText}\n${text.slice(0, 200)}`)
  }

  const json = await res.json()
  if (!json.ok) {
    throw new Error(`saveTicks GAS 側エラー: ${json.error || 'ok:false'}`)
  }
}
